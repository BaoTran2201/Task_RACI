import prisma from '../utils/prisma.js';

/**
 * Check if user can access/modify a task
 * Admin: can access any task
 * User: can only access tasks where creatorId === req.user.employeeId
 */
const canAccessTask = async (req, taskId) => {
  if (req.user.role === 'admin') {
    return true;
  }

  // For regular users, check if they created the task
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creatorId: true },
  });

  if (!task) {
    return false;
  }

  return task.creatorId === req.user.employeeId;
};

/**
 * Check if user can access/modify RACI assignment
 * Admin: can modify any RACI
 * User: can only modify RACI for tasks they created
 */
const canAccessRaci = async (req, raciId) => {
  if (req.user.role === 'admin') {
    return true;
  }

  // For regular users, check if they created the task associated with this RACI
  const raci = await prisma.raciAssignment.findUnique({
    where: { id: raciId },
    include: {
      task: {
        select: { creatorId: true },
      },
    },
  });

  if (!raci) {
    return false;
  }

  return raci.task.creatorId === req.user.employeeId;
};

/**
 * Check if user can create RACI for a specific task
 * Admin: can create RACI for any task
 * User: can only create RACI for tasks they created
 */
const canCreateRaciForTask = async (req, taskId) => {
  if (req.user.role === 'admin') {
    return true;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creatorId: true },
  });

  if (!task) {
    return false;
  }

  return task.creatorId === req.user.employeeId;
};

/**
 * Send 403 Forbidden response
 */
const forbidden = (res, message = 'Access denied') => {
  return res.status(403).json({ error: message });
};

export { canAccessTask, canAccessRaci, canCreateRaciForTask, forbidden };
