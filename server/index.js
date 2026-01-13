import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json({ limit: '5mb' }));

// Utility to ensure a directory exists
async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true }).catch(() => {});
}

app.post('/api/tasks/save', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.tasks) || !Array.isArray(payload.raci)) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const dataDir = path.join(process.cwd(), 'data');

    // Prepare data
    const tasksToSave = payload.tasks.map((t) => ({
      id: t.id,
      code: t.id?.substring(0, 8) || t.code || '',
      name: t.name,
      description: t.note || '',
      taskGroupId: t.groupId,
      projectId: t.projectId,
      duration: t.duration ?? 1,
      frequency: t.frequency,
      status: 'active',
      order: 1,
      isActive: true,
      partner: t.partner || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const tasksRaciToSave = payload.raci.map((r, idx) => ({
      id: r.id || `RACI${idx + 1}`,
      taskId: r.taskId,
      positionId: r.positionId || `POS_${r.employeeId}`,
      role: r.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const taskGroupsToSave = (payload.taskGroups || []).map((tg) => ({
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
      data: Array.from(new Set((payload.partners || []).filter(Boolean))).map((p, idx) => ({
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

    // Ensure dirs
    await ensureDir(path.join(dataDir, 'tasks'));
    await ensureDir(path.join(dataDir, 'master'));

    // Write files
    await Promise.all([
      fs.promises.writeFile(
        path.join(dataDir, 'tasks', 'tasks.json'),
        JSON.stringify({ data: tasksToSave }, null, 2)
      ),
      fs.promises.writeFile(
        path.join(dataDir, 'tasks', 'task-groups.json'),
        JSON.stringify({ data: taskGroupsToSave }, null, 2)
      ),
      fs.promises.writeFile(
        path.join(dataDir, 'tasks', 'raci-assignments.json'),
        JSON.stringify({ data: tasksRaciToSave }, null, 2)
      ),
      fs.promises.writeFile(
        path.join(dataDir, 'master', 'partners.json'),
        JSON.stringify(partnersData, null, 2)
      ),
    ]);

    return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Save API error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Unknown error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
