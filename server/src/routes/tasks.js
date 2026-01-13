import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { canAccessTask, forbidden } from '../middleware/authorization.js';

const router = express.Router();

// Resolve partner by name (case-insensitive); create if missing
async function resolvePartner(name) {
  if (!name || !name.trim()) {
    return { partnerId: null, partnerName: null };
  }

  const normalizedName = name.trim().toLowerCase();

  let partner = await prisma.partner.findUnique({
    where: { normalizedName },
  });

  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        normalizedName,
      },
    });
  }

  return { partnerId: partner.id, partnerName: partner.name };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !req.user.employeeId) {
      return res.json([]);
    }
    const where = isAdmin ? {} : { creatorId: req.user.employeeId };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        creator: true,
        partnerRef: true,
        raci: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check authorization
    const hasAccess = await canAccessTask(req, req.params.id);
    if (!hasAccess) {
      return forbidden(res, 'You do not have access to this task');
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        creator: true,
        partnerRef: true,
        raci: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { id, name, groupName, frequency, note, partner, partnerName, projectId, creatorId } = req.body;

    if (!id || !name || !frequency || !projectId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine the actual creator
    let actualCreatorId;
    
    if (req.user.role === 'admin') {
      // Admin can set creatorId to any employee or use their own
      actualCreatorId = creatorId || req.user.employeeId;
    } else {
      // User can only create tasks for themselves
      if (creatorId && creatorId !== req.user.employeeId) {
        return forbidden(res, 'You can only create tasks for yourself');
      }
      
      if (!req.user.employeeId) {
        return res.status(400).json({ error: 'User must have an associated employee record' });
      }
      
      actualCreatorId = req.user.employeeId;
    }

    const { partnerId, partnerName: resolvedPartnerName } = await resolvePartner(partnerName || partner);

    const task = await prisma.task.create({
      data: {
        id,
        name,
        groupName: groupName || null,
        frequency,
        note: note || null,
        partner: resolvedPartnerName || null,
        partnerId,
        projectId,
        creatorId: actualCreatorId,
      },
      include: {
        partnerRef: true,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error.message, error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    // Check authorization
    const hasAccess = await canAccessTask(req, req.params.id);
    if (!hasAccess) {
      return forbidden(res, 'You do not have access to this task');
    }

    const { name, groupName, frequency, note, partner, partnerName, projectId } = req.body;

    const { partnerId, partnerName: resolvedPartnerName } = await resolvePartner(partnerName || partner);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(groupName !== undefined && { groupName: groupName || null }),
        ...(frequency && { frequency }),
        ...(note !== undefined && { note: note || null }),
        ...(partner !== undefined || partnerName !== undefined
          ? { partner: resolvedPartnerName || null, partnerId }
          : {}),
        ...(projectId && { projectId }),
      },
      include: {
        partnerRef: true,
      },
    });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check authorization
    const hasAccess = await canAccessTask(req, req.params.id);
    if (!hasAccess) {
      return forbidden(res, 'You do not have access to this task');
    }

    await prisma.task.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
