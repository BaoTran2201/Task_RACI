import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { forbidden } from '../middleware/authorization.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return forbidden(res);
  }

  try {
    const { id, name, customer } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const project = await prisma.project.create({
      data: {
        id,
        name,
        customer: customer || null,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return forbidden(res);
  }

  try {
    const { name, customer } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(customer !== undefined && { customer: customer || null }),
      },
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return forbidden(res);
  }

  try {
    const tasksCount = await prisma.task.count({
      where: { projectId: req.params.id },
    });

    if (tasksCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete project with existing tasks',
        message: `Project has ${tasksCount} task(s). Please delete or reassign tasks first.`
      });
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
