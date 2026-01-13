/**
 * API Request/Response DTOs
 * All types MUST match backend DTO contracts exactly
 * Generated from: CheckRaci.Application/DTOs
 */

import { RaciRole, TaskFrequency } from './enums';

// ============================================================================
// EMPLOYEE API
// ============================================================================

export interface CreateEmployeeRequest {
  name: string;
  department: string;
  position: string;
  managerId?: string; // Guid string or undefined (do NOT send if not set)
}

export interface UpdateEmployeeRequest {
  name?: string;
  department?: string;
  position?: string;
  managerId?: string;
}

export interface EmployeeResponse {
  id: string; // Guid
  name: string;
  department: string;
  position: string;
  managerId?: string;
  hasUserAccount?: boolean;
  username?: string;
}

// ============================================================================
// PROJECT API
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  customer: string; // NOT "client" - backend uses "customer"
  managerId: string; // Guid string (REQUIRED)
}

export interface UpdateProjectRequest {
  name?: string;
  customer?: string;
  managerId?: string;
}

export interface ProjectResponse {
  id: string; // Guid
  name: string;
  customer: string;
  managerId: string;
}

// ============================================================================
// TASK API
// ============================================================================

export interface CreateTaskRequest {
  name: string;
  frequency: TaskFrequency;
  projectId: string;
  groupName?: string;
  note?: string;
  partner?: string;
  estimatedHours?: number; // Optional; backend defaults to 0
  raciAssignments?: Array<{
    role: RaciRole;
    positionId: string;
    employeeId: string;
  }>;
}

export interface UpdateTaskRequest {
  name?: string;
  frequency?: TaskFrequency;
  projectId?: string;
  groupName?: string;
  note?: string;
  partner?: string;
  estimatedHours?: number; // Optional partial update
  // DO NOT include: id, creatorId
}

export interface TaskResponse {
  id: string; // Guid
  name: string;
  frequency: TaskFrequency;
  projectId: string;
  groupName?: string;
  note?: string;
  partner?: string;
  creatorId: string;
  groupId?: string;
  estimatedHours?: number; // Present from backend; optional for safety
}

// ============================================================================
// RACI API
// ============================================================================

export interface CreateRaciRequest {
  taskId: string; // Guid string
  positionId: string; // Guid string
  role: RaciRole; // Enum: R, A, C, I
}

export interface UpdateRaciRequest {
  role: RaciRole; // Enum: R, A, C, I
}

export interface RaciResponse {
  id: string; // Guid or numeric ID (check backend)
  taskId: string;
  positionId: string;
  role: RaciRole;
}

// ============================================================================
// AUTH API
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: 'admin' | 'user';
  mustChangePassword: boolean;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Runtime validation: Ensure value is valid TaskFrequency
 */
export function isValidTaskFrequency(value: any): value is TaskFrequency {
  return Object.values(TaskFrequency).includes(value);
}

/**
 * Runtime validation: Ensure value is valid RaciRole
 */
export function isValidRaciRole(value: any): value is RaciRole {
  return Object.values(RaciRole).includes(value);
}

/**
 * Runtime validation: Ensure value is valid UserRole
 */
export function isValidUserRole(value: any): value is 'admin' | 'user' {
  return value === 'admin' || value === 'user';
}
// ============================================================================
// ESTIMATED HOURS AUDIT API
// ============================================================================

export interface EstimatedHoursAuditEntry {
  id: string; // Guid
  changedByName: string;
  oldHours: number;
  newHours: number;
  changedAt: string; // ISO 8601 timestamp
  source: 'CreatorEdit' | 'AdminEdit';
}

export interface EstimatedHoursHistoryResponse {
  taskId: string; // Guid
  history: EstimatedHoursAuditEntry[];
}