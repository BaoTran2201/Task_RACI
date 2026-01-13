import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { canAccessRaci, canCreateRaciForTask, forbidden } from '../middleware/authorization.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { taskId, employeeId } = req.query;

    const where = {};
    if (taskId) where.taskId = taskId;
    if (employeeId) where.employeeId = employeeId;

    // For regular users, filter to only show RACI for tasks they created
    if (req.user.role !== 'admin') {
      where.task = {
        creatorId: req.user.employeeId,
      };
    }

    const assignments = await prisma.raciAssignment.findMany({
      where,
      include: {
        task: true,
        employee: true,
      },
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get RACI assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch RACI assignments' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { taskId, employeeId, role } = req.body;

    if (!taskId || !employeeId || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['R', 'A', 'C', 'I'].includes(role)) {
      return res.status(400).json({ error: 'Invalid RACI role' });
    }

    // Check if user can create RACI for this task
    const canCreate = await canCreateRaciForTask(req, taskId);
    if (!canCreate) {
      return forbidden(res, 'You can only assign RACI for tasks you created');
    }

    const assignment = await prisma.raciAssignment.create({
      data: {
        taskId,
        employeeId,
        role,
      },
      include: {
        task: true,
        employee: true,
      },
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create RACI assignment error:', error);
    res.status(500).json({ error: 'Failed to create RACI assignment' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['R', 'A', 'C', 'I'].includes(role)) {
      return res.status(400).json({ error: 'Invalid RACI role' });
    }

    // Check authorization
    const hasAccess = await canAccessRaci(req, parseInt(req.params.id));
    if (!hasAccess) {
      return forbidden(res, 'You can only modify RACI for tasks you created');
    }

    const assignment = await prisma.raciAssignment.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      include: {
        task: true,
        employee: true,
      },
    });

    res.json(assignment);
  } catch (error) {
    console.error('Update RACI assignment error:', error);
    res.status(500).json({ error: 'Failed to update RACI assignment' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check authorization
    const hasAccess = await canAccessRaci(req, parseInt(req.params.id));
    if (!hasAccess) {
      return forbidden(res, 'You can only delete RACI for tasks you created');
    }

    await prisma.raciAssignment.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete RACI assignment error:', error);
    res.status(500).json({ error: 'Failed to delete RACI assignment' });
  }
});

export default router;
