import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/* =========================
   CONSTANTS & HELPERS
========================= */

const FREQUENCY_MAP = {
  'Hàng ngày': 'DAILY',
  'Hàng tuần': 'WEEKLY',
  'Hàng tháng': 'MONTHLY',
  'Hàng năm': 'YEARLY',
  'Khi phát sinh': 'ADHOC',
};

function loadJSON(filePath) {
  const fullPath = path.resolve(__dirname, '../../data', filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

function extractArrayDeep(data, hint) {
  if (Array.isArray(data)) return data;

  if (data && typeof data === 'object') {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') {
        const nested = extractArrayDeep(value, hint);
        if (nested) return nested;
      }
    }
  }

  throw new Error(`Expected array${hint ? ` for ${hint}` : ''}`);
}

function normalizeEmployee(emp, departmentMap, positionMap) {
  const departmentId = emp.departmentId || emp.department;
  const positionId = emp.primaryPositionId || emp.positionId || emp.position;
  
  return {
    id: emp.id || emp.employeeId || emp.maNhanVien,
    name: emp.name || emp.fullName || emp.employeeName || emp['Tên nhân viên'] || emp.ten,
    department: departmentMap.get(departmentId) || departmentId || 'Unknown',
    position: positionMap.get(positionId) || positionId || 'Unknown',
    managerId: emp.managerId || emp.lineManagerId || null,
  };
}

function normalizeProject(proj) {
  return {
    id: proj.id || proj.projectId || proj.maDuAn,
    name: proj.name || proj.projectName || proj['Tên dự án'] || proj.tenDuAn,
    customer: proj.customer || proj['Khách hàng'] || proj.khachHang || null,
  };
}

function normalizeTask(task, taskGroupMap) {
  const taskGroupId = task.taskGroupId || task.groupId;
  return {
    id: task.id || task.taskId || task.maCongViec,
    name: task.name || task.taskName || task['Tên công việc'] || task.tenCongViec,
    groupName: taskGroupMap.get(taskGroupId) || task.groupName || task.group || 'Default',
    frequency: task.frequency || task['Tần suất'] || task.tanSuat || 'Khi phát sinh',
    note: task.note || task.description || task['Ghi chú'] || task.ghiChu || null,
    partner: task.partner || task['Đối tác'] || task.doiTac || null,
    projectId: task.projectId || task.project || task.maDuAn,
  };
}

function normalizeRaci(raci, positionToEmployeeMap) {
  let employeeId = raci.employeeId || raci.employee || raci.maNhanVien;
  
  if (!employeeId && raci.positionId) {
    employeeId = positionToEmployeeMap.get(raci.positionId);
    
    if (!employeeId && raci.positionId.startsWith('POS_EMP')) {
      employeeId = raci.positionId.replace('POS_', '');
    }
  }
  
  return {
    taskId: raci.taskId || raci.task || raci.maCongViec,
    employeeId: employeeId,
    role: raci.role || raci.raciRole || raci.vaiTro,
  };
}

function validateArray(data, requiredFields = []) {
  if (!Array.isArray(data)) {
    throw new Error('Expected array');
  }

  data.forEach((item, idx) => {
    requiredFields.forEach(field => {
      if (!(field in item) || item[field] === undefined || item[field] === null) {
        throw new Error(`Item ${idx} missing required field: ${field}`);
      }
    });
  });
}

/* =========================
   MIGRATION
========================= */

async function migrate() {
  try {
    console.log('Starting data migration...\n');

    /* --- Step 1: Admin employee & user --- */

    const adminEmployee = await prisma.employee.upsert({
      where: { id: 'ADMIN' },
      update: {},
      create: {
        id: 'ADMIN',
        name: 'Admin',
        department: 'IT',
        position: 'Administrator',
      },
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        employeeId: adminEmployee.id,
      },
    });

    const userPassword = await bcrypt.hash('user123', 10);

    await prisma.user.upsert({
      where: { username: 'user' },
      update: { password: userPassword },
      create: {
        username: 'user',
        password: userPassword,
        role: 'user',
        employeeId: 'EMP001',
      },
    });

    /* --- Step 2: Load & validate data --- */

    const departmentsRaw = extractArrayDeep(
      loadJSON('master/departments.json'),
      'departments'
    );
    const departmentMap = new Map(
      departmentsRaw.map(d => [d.id, d.name || d.code])
    );

    const positionsRaw = extractArrayDeep(
      loadJSON('master/positions.json'),
      'positions'
    );
    const positionMap = new Map(
      positionsRaw.map(p => [p.id, p.name || p.code])
    );

    const employeePositionsRaw = extractArrayDeep(
      loadJSON('mapping/employee-positions.json'),
      'employee-positions'
    );
    const positionToEmployeeMap = new Map();
    employeePositionsRaw.forEach(ep => {
      if (!positionToEmployeeMap.has(ep.positionId)) {
        positionToEmployeeMap.set(ep.positionId, ep.employeeId);
      }
    });

    const taskGroupsRaw = extractArrayDeep(
      loadJSON('tasks/task-groups.json'),
      'task-groups'
    );
    const taskGroupMap = new Map(
      taskGroupsRaw.map(tg => [tg.id, tg.name || tg.code])
    );

    const employeesData = extractArrayDeep(
      loadJSON('master/employees.json'),
      'employees'
    ).map(emp => normalizeEmployee(emp, departmentMap, positionMap));
    validateArray(employeesData, ['id', 'name', 'department', 'position']);

    const projectsData = extractArrayDeep(
      loadJSON('master/projects.json'),
      'projects'
    ).map(normalizeProject);
    validateArray(projectsData, ['id', 'name']);

    const tasksData = extractArrayDeep(
      loadJSON('tasks/tasks.json'),
      'tasks'
    ).map(task => normalizeTask(task, taskGroupMap));
    validateArray(tasksData, ['id', 'name', 'frequency', 'projectId']);

    const raciData = extractArrayDeep(
      loadJSON('tasks/raci-assignments.json'),
      'raci'
    ).map(raci => normalizeRaci(raci, positionToEmployeeMap));
    validateArray(raciData, ['taskId', 'employeeId', 'role']);

    /* --- Step 3: Employees --- */

    for (const emp of employeesData) {
      await prisma.employee.upsert({
        where: { id: emp.id },
        update: {
          name: emp.name,
          department: emp.department,
          position: emp.position,
          managerId: emp.managerId,
        },
        create: {
          id: emp.id,
          name: emp.name,
          department: emp.department,
          position: emp.position,
          managerId: emp.managerId,
        },
      });
    }

    /* --- Step 4: Projects --- */

    for (const proj of projectsData) {
      await prisma.project.upsert({
        where: { id: proj.id },
        update: {
          name: proj.name,
          customer: proj.customer,
        },
        create: {
          id: proj.id,
          name: proj.name,
          customer: proj.customer,
        },
      });
    }

    /* --- Step 5: Tasks --- */

    for (const task of tasksData) {
      const frequency = FREQUENCY_MAP[task.frequency] || 'ADHOC';

      await prisma.task.upsert({
        where: { id: task.id },
        update: {
          name: task.name,
          groupName: task.groupName,
          frequency,
          note: task.note,
          partner: task.partner,
          projectId: task.projectId,
          creatorId: adminEmployee.id,
        },
        create: {
          id: task.id,
          name: task.name,
          groupName: task.groupName,
          frequency,
          note: task.note,
          partner: task.partner,
          projectId: task.projectId,
          creatorId: adminEmployee.id,
        },
      });
    }

    /* --- Step 6: RACI --- */

    const employeeIds = new Set(employeesData.map(e => e.id));
    const taskIds = new Set(tasksData.map(t => t.id));
    let raciSkipped = 0;
    let raciSuccess = 0;

    for (const raci of raciData) {
      if (!['R', 'A', 'C', 'I'].includes(raci.role)) {
        raciSkipped++;
        continue;
      }

      if (!taskIds.has(raci.taskId)) {
        console.warn(`⚠ Skipping RACI: taskId "${raci.taskId}" not found`);
        raciSkipped++;
        continue;
      }

      if (!employeeIds.has(raci.employeeId)) {
        console.warn(`⚠ Skipping RACI: employeeId "${raci.employeeId}" not found`);
        raciSkipped++;
        continue;
      }

      try {
        await prisma.raciAssignment.upsert({
          where: {
            taskId_employeeId: {
              taskId: raci.taskId,
              employeeId: raci.employeeId,
            },
          },
          update: { role: raci.role },
          create: {
            taskId: raci.taskId,
            employeeId: raci.employeeId,
            role: raci.role,
          },
        });
        raciSuccess++;
      } catch (err) {
        console.warn(`⚠ Failed to upsert RACI (${raci.taskId}/${raci.employeeId}): ${err.message}`);
        raciSkipped++;
      }
    }

    console.log('\n✓ Migration completed successfully');
    console.log(`  - Employees: ${employeesData.length}`);
    console.log(`  - Projects: ${projectsData.length}`);
    console.log(`  - Tasks: ${tasksData.length}`);
    console.log(`  - RACI: ${raciSuccess} inserted, ${raciSkipped} skipped`);
    console.log('\nDefault admin account: admin / admin123');
    console.log('Please change the password after first login.');

  } catch (err) {
    console.error('✗ Migration failed');
    console.error(err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
