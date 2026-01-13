import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        manager: true,
        subordinates: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { id, name, department, position, managerId } = req.body;

    if (!id || !name || !department || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const employee = await prisma.employee.create({
      data: {
        id,
        name,
        department,
        position,
        managerId: managerId || null,
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, department, position, managerId } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(department && { department }),
        ...(position && { position }),
        ...(managerId !== undefined && { managerId: managerId || null }),
      },
    });

    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;
