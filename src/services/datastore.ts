import { Employee, Project, Task, RaciMatrix, Department, Position } from '../../types';
import { apiRequest } from './api';
import { departmentApi, positionApi } from './api';
import { isDemoMode, hasUserData, loadDemoData, loadDemoOverrides, persistDemoOverrides } from './demoMode';
import { TaskFrequency, LabelToTaskFrequency } from '../types/enums';

// Mapping: Backend enum values to TaskFrequency enum
const BACKEND_FREQ_MAP: Record<string, TaskFrequency> = {
  'Daily': TaskFrequency.Daily,
  'Weekly': TaskFrequency.Weekly,
  'Monthly': TaskFrequency.Monthly,
  'Quarterly': TaskFrequency.Quarterly,
  'Yearly': TaskFrequency.Yearly,
  'AdHoc': TaskFrequency.AdHoc,
};

// Legacy mapping: Vietnamese labels to TaskFrequency enum
const LEGACY_FREQ_LABELS: Record<string, TaskFrequency> = {
  'Hàng ngày': TaskFrequency.Daily,
  'Hàng tuần': TaskFrequency.Weekly,
  'Hàng tháng': TaskFrequency.Monthly,
  'Hàng quý': TaskFrequency.Quarterly,
  'Hàng năm': TaskFrequency.Yearly,
  'Khi phát sinh': TaskFrequency.AdHoc,
};

// Load data from public folder
async function loadJsonData<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`/data/${path}`);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return (Array.isArray(error) ? [] : {}) as T;
  }
}

export async function loadAll(isAdmin: boolean = true): Promise<{ employees: Employee[]; projects: Project[]; tasks: Task[]; raciData: RaciMatrix[]; departments: Department[]; positions: Position[]; }> {
  try {
    // Always load departments and positions from API (even in demo mode for now)
    let departments: Department[] = [];
    let positions: Position[] = [];

    try {
      const deptApi = await departmentApi.getAll();
      departments = deptApi.map((d) => ({
        id: d.id,
        name: d.name,
        active: d.isActive,
      }));
    } catch (err) {
      console.warn('Failed to load departments from API, using fallback:', err);
      // Fallback: try loading from JSON
      const departmentsJson = await loadJsonData<any[]>('departments.json');
      departments = (Array.isArray(departmentsJson) ? departmentsJson : departmentsJson || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        active: d.isActive !== false,
      }));
    }

    try {
      const posApi = await positionApi.getAll();
      positions = posApi.map((p) => ({
        id: p.id,
        name: p.name,
        canManage: p.canManage,
        active: p.isActive,
      }));
    } catch (err) {
      console.warn('Failed to load positions from API, using fallback:', err);
      // Fallback: try loading from JSON
      const positionsJson = await loadJsonData<any[]>('positions.json');
      positions = (Array.isArray(positionsJson) ? positionsJson : positionsJson || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        canManage: p.isManagement || false,
        active: p.isActive !== false,
      }));
    }

    let employees: Employee[] = [];
    let projects: Project[] = [];
    let tasks: Task[] = [];
    let raciData: RaciMatrix[] = [];

    if (isDemoMode()) {
      const demo = await loadDemoData();
      const overrides = loadDemoOverrides();
      employees = demo.employees;
      projects = (overrides.projects || demo.projects).map((p: any) => ({
        id: p.id,
        name: p.name,
        client: p.client || p.customer || 'Internal',
        managerId: p.managerId || p.ownerId || '',
      }));
      tasks = (overrides.tasks || demo.tasks).map((t: any) => ({
        id: t.id,
        groupId: t.groupId || t.groupName || 'default',
        groupName: t.groupName || 'Chưa phân nhóm',
        name: t.name,
        frequency: parseTaskFrequency(t.frequency),
        note: t.note || undefined,
        creatorId: t.creatorId || employees[0]?.id || 'emp-1',
        projectId: t.projectId || projects[0]?.id || 'proj-1',
        partner: t.partner ?? null,
        partnerId: t.partnerId ?? null,
      }));
      raciData = (overrides.raciData || demo.raciData).map((r: any, idx: number) => ({
        id: r.id || idx,
        taskId: r.taskId,
        employeeId: r.employeeId,
        role: r.role,
      }));
      persistDemoOverrides({ tasks, projects, raciData });
    } else {
      const tasksPath = isAdmin ? '/tasks' : '/tasks/my';
      const [employeesApi, projectsApi, tasksApi, raciApi] = await Promise.all([
        apiRequest<any[]>('/employees'),
        apiRequest<any[]>('/projects'),
        apiRequest<any[]>(tasksPath),
        apiRequest<any[]>('/raci'),
      ]);

      employees = employeesApi.map((e) => ({
        id: e.id,
        name: e.name,
        department: e.department || 'Unknown',
        position: e.position || 'Unknown',
        positionId: e.positionId || e.primaryPositionId || undefined,
        primaryPositionId: e.primaryPositionId || e.positionId || undefined,
        managerId: e.managerId || undefined,
        username: e.username || undefined,
      }));

      projects = projectsApi.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.customer || p.client || 'Internal',
        managerId: p.ownerId || p.managerId || '',
      }));

      tasks = tasksApi.map((t) => ({
        id: t.id,
        groupId: t.groupName || 'default',
        groupName: t.groupName || 'Chưa phân nhóm',
        name: t.name,
        frequency: parseTaskFrequency(t.frequency),
        estimatedHours: typeof t.estimatedHours === 'number' ? t.estimatedHours : undefined,
        note: t.note || undefined,
        creatorId: t.creatorId,
        projectId: t.projectId,
        partner: t.partner ?? t.partnerRef?.name ?? null,
        partnerId: t.partnerId ?? t.partnerRef?.id ?? null,
        raciAssignments: (t.raciAssignments || t.raci || []).map((r: any) => ({
          taskId: r.taskId,
          role: r.role,
          positionId: r.positionId ?? null,
          positionName: r.positionName ?? null,
          employeeId: r.employeeId,
        })),
      }));

      raciData = raciApi.map((r) => ({
        id: r.id,
        taskId: r.taskId,
        positionId: r.positionId,
        positionName: r.positionName ?? '',
        role: r.role,
      }));
    }

    return { employees, projects, tasks, raciData, departments, positions };
  } catch (error) {
    console.error('API load failed:', error);
    if (isDemoMode() || hasUserData()) {
      return { employees: [], projects: [], tasks: [], raciData: [], departments: [], positions: [] };
    }
    throw error;
  }
}

/**
 * Parse frequency value from any source (backend enum, legacy label, or value)
 * Converts to TaskFrequency enum
 */
function parseTaskFrequency(value: any): TaskFrequency {
  if (!value) return TaskFrequency.Daily;

  // Try backend enum mapping first
  if (BACKEND_FREQ_MAP[value]) return BACKEND_FREQ_MAP[value];

  // Try legacy Vietnamese labels
  if (LEGACY_FREQ_LABELS[value]) return LEGACY_FREQ_LABELS[value];

  // Try as is (in case it's already an enum value)
  if (Object.values(TaskFrequency).includes(value)) return value;

  // Default
  return TaskFrequency.Daily;
}
