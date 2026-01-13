import { RaciRole, TaskFrequency, UserRole as UserRoleEnum } from './src/types/enums';

export type Role = RaciRole | 'R' | 'A' | 'C' | 'I';
export type UserRole = UserRoleEnum | 'admin' | 'user';

export interface Department {
  id: string;
  name: string;
  active: boolean;
}

export interface Position {
  id: string;
  name: string;
  canManage: boolean;
  active: boolean;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  positionId?: string;
  primaryPositionId?: string;
  managerId?: string;
  username?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  managerId: string;
}

export interface TaskGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  projectId: string;
}

export interface Task {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  frequency: TaskFrequency;
  note?: string;
  creatorId: string;
  projectId: string;
  partner?: string | null;
  partnerId?: string | null;
  estimatedHours?: number;
  raciAssignments?: Array<{
    taskId: string;
    role: RaciRole;
    positionId?: string | null;
    positionName?: string | null;
    employeeId: string;
  }>;
}

export interface RaciMatrix {
  id?: string | number;
  taskId: string;
  positionId: string;
  positionName: string;
  role: RaciRole;
  employeeId?: string;
}

export enum Page {
  // Admin Pages
  ADMIN_DASHBOARD = 'admin_dashboard',
  ADMIN_IMPORT_EMPLOYEES = 'admin_import_employees',
  ADMIN_IMPORT_PROJECTS = 'admin_import_projects',
  ADMIN_DEPARTMENTS = 'admin_departments',
  ADMIN_POSITIONS = 'admin_positions',
  ADMIN_PROJECTS = 'admin_projects',
  ADMIN_TASKS = 'admin_tasks',
  ADMIN_EMPLOYEES = 'admin_employees',
  ADMIN_REPORT_TASK = 'admin_report_task',
  ADMIN_REPORT_USER = 'admin_report_user',
  
  // User Pages
  USER_DASHBOARD = 'user_dashboard',
  USER_MY_TASKS = 'user_my_tasks',
  USER_MY_RACI = 'user_my_raci',
  USER_PROFILE = 'user_profile',
  USER_ADD_TASK = 'user_add_task',
}
