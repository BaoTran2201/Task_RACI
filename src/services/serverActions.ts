import { Task, RaciMatrix, Role } from '../../types';

interface SavePayload {
  tasks: Task[];
  raci: RaciMatrix[];
  taskGroups: any[];
  partners: string[];
}

interface SaveResponse {
  success: boolean;
  error?: string;
  timestamp?: string;
}

export async function saveAllData(payload: SavePayload): Promise<SaveResponse> {
  try {
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

    await fs.writeFile(
      path.join(dataDir, 'tasks', 'tasks.json'),
      JSON.stringify({ data: tasksToSave }, null, 2)
    );

    await fs.writeFile(
      path.join(dataDir, 'tasks', 'task-groups.json'),
      JSON.stringify({ data: taskGroupsToSave }, null, 2)
    );

    await fs.writeFile(
      path.join(dataDir, 'tasks', 'raci-assignments.json'),
      JSON.stringify({ data: tasksRaciToSave }, null, 2)
    );

    await fs.writeFile(
      path.join(dataDir, 'master', 'partners.json'),
      JSON.stringify(partnersData, null, 2)
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error saving data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
