import { Task, RaciMatrix } from '../../../types';

interface SavePayload {
  tasks: Task[];
  raci: RaciMatrix[];
  taskGroups: any[];
  partners: string[];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: SavePayload = req.body;

    if (!payload.tasks || !Array.isArray(payload.tasks)) {
      return res.status(400).json({ error: 'Invalid tasks payload' });
    }

    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    const dataDir = path.join(process.cwd(), 'public', 'data');

    const tasksToSave = payload.tasks.map(t => ({
      id: t.id,
      code: t.id.substring(0, 8),
      name: t.name,
      description: t.note || '',
      taskGroupId: t.groupId,
      projectId: t.projectId,
      duration: 1,
      frequency: t.frequency,
      status: 'active',
      order: 1,
      isActive: true,
      partner: t.partner || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const tasksRaciToSave = payload.raci.map((r, idx) => ({
      id: `RACI${idx + 1}`,
      taskId: r.taskId,
      positionId: `POS_${r.employeeId}`,
      role: r.role,
    }));

    const taskGroupsToSave = payload.taskGroups.map(tg => ({
      id: tg.id,
      code: tg.code,
      name: tg.name,
      description: tg.description || '',
      projectId: tg.projectId,
      parentId: null,
      order: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const partnersData = {
      data: Array.from(new Set(payload.partners.filter(Boolean))).map((p, idx) => ({
        id: `PARTNER_${idx + 1}`,
        name: p,
        description: '',
        contact: '',
        website: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    const fs_promises = fs;
    const path_join = path.join;

    await Promise.all([
      fs_promises.writeFile(
        path_join(dataDir, 'tasks', 'tasks.json'),
        JSON.stringify({ data: tasksToSave }, null, 2)
      ),
      fs_promises.writeFile(
        path_join(dataDir, 'tasks', 'task-groups.json'),
        JSON.stringify({ data: taskGroupsToSave }, null, 2)
      ),
      fs_promises.writeFile(
        path_join(dataDir, 'tasks', 'raci-assignments.json'),
        JSON.stringify({ data: tasksRaciToSave }, null, 2)
      ),
      fs_promises.writeFile(
        path_join(dataDir, 'master', 'partners.json'),
        JSON.stringify(partnersData, null, 2)
      ),
    ]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Data saved successfully',
    });
  } catch (error) {
    console.error('Error in save API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
