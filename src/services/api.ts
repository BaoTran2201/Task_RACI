import { Task, RaciMatrix } from '../../types';
import { isDemoMode, loadDemoOverrides, persistDemoOverrides } from './demoMode';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  CreateRaciRequest,
  UpdateRaciRequest,
  RaciResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  LoginRequest,
  LoginResponse,
  isValidTaskFrequency,
  isValidRaciRole,
  EstimatedHoursHistoryResponse,
} from '../types/api-dto';
import { RaciRole, TaskFrequency, UserRole } from '../types/enums';

export const TOKEN_KEY = 'raci_api_token';
// Use HTTP for local development (CORS + preflight issues with HTTPS redirect)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthToken();
    unauthorizedHandler?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    const errorMessage = errorText || `Request failed (${res.status})`;
    if (options?.method === 'POST' || options?.method === 'PUT') {
      console.error('[API ERROR]', {
        path,
        method: options?.method,
        status: res.status,
        error: errorMessage,
        body: options?.body
      });
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ============================================================================
// TASK API - REFACTORED FOR DTO ALIGNMENT
// ============================================================================

export const taskApi = {
  /**
   * Create task - strict DTO compliance with request wrapper
   * Backend expects: { request: { name, frequency, projectId, ... } }
   * @param taskDto - CreateTaskRequest (name, frequency, projectId, optional: groupName, note, partner)
   * @returns Created task from backend
   */
  async create(taskDto: CreateTaskRequest): Promise<Task> {
    // Validate frequency is a valid enum value
    if (!isValidTaskFrequency(taskDto.frequency)) {
      throw new Error(`Invalid frequency: ${taskDto.frequency}. Must be one of: Daily, Weekly, Monthly, Quarterly, Yearly, AdHoc`);
    }

    if (isDemoMode()) {
      const overrides = loadDemoOverrides();
      const existing = overrides.tasks || [];
      const newTask: Task = {
        id: `T${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        groupId: taskDto.groupName || 'default',
        groupName: taskDto.groupName || '',
        name: taskDto.name,
        frequency: taskDto.frequency,
        note: taskDto.note,
        creatorId: 'demo-user',
        projectId: taskDto.projectId,
        partner: taskDto.partner || null,
        estimatedHours: taskDto.estimatedHours ?? 0,
      };
      const next = [...existing, newTask];
      persistDemoOverrides({ tasks: next });
      return Promise.resolve(newTask);
    }
    
    const payload = {
      request: {
        name: taskDto.name,
        frequency: taskDto.frequency,
        projectId: taskDto.projectId,
        groupName: taskDto.groupName || null,
        note: taskDto.note || null,
        partner: taskDto.partner || null,
        estimatedHours: taskDto.estimatedHours ?? 0,
        raciAssignments: taskDto.raciAssignments || null,
      },
    };
    
    // Debug: log payload before sending
    console.log('TASK CREATE PAYLOAD', JSON.stringify(payload, null, 2));
    
    return apiRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createBulk(tasks: CreateTaskRequest[]): Promise<Task[]> {
    if (isDemoMode()) {
      return Promise.all(tasks.map(task => this.create(task)));
    }
    
    const results: Task[] = [];
    for (const task of tasks) {
      const created = await this.create(task);
      results.push(created);
    }
    return results;
  },

  /**
   * Update task - strict DTO compliance
   * @param id - Task ID (Guid)
   * @param request - UpdateTaskRequest (optional fields)
   * @returns Updated task from backend
   */
  async update(id: string, request: UpdateTaskRequest): Promise<Task> {
    if (isDemoMode()) {
      const overrides = loadDemoOverrides();
      const existing = overrides.tasks || [];
      const next = existing.map((t: Task) => (t.id === id ? { ...t, ...request } : t));
      persistDemoOverrides({ tasks: next });
      const updated = next.find((t: Task) => t.id === id) as Task;
      return Promise.resolve(updated);
    }
    
    // CRITICAL: Only send fields matching backend UpdateTaskDto
    const payload: Record<string, any> = {};
    if (request.name !== undefined) payload.name = request.name;
    if (request.frequency !== undefined) payload.frequency = request.frequency;
    if (request.projectId !== undefined) payload.projectId = request.projectId;
    if (request.groupName !== undefined) payload.groupName = request.groupName;
    if (request.note !== undefined) payload.note = request.note;
    if (request.partner !== undefined) payload.partner = request.partner;
    if (request.estimatedHours !== undefined) payload.estimatedHours = request.estimatedHours;
    
    return apiRequest<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<void> {
    if (isDemoMode()) {
      const overrides = loadDemoOverrides();
      const existing = overrides.tasks || [];
      const next = existing.filter((t: Task) => t.id !== id);
      persistDemoOverrides({ tasks: next });
      return Promise.resolve();
    }
    return apiRequest<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async getAll(): Promise<Task[]> {
    if (isDemoMode()) {
      const overrides = loadDemoOverrides();
      return Promise.resolve((overrides.tasks as Task[]) || []);
    }
    return apiRequest<Task[]>('/tasks');
  },

  /**
   * Fetch estimated hours audit history for a task
   * Only accessible to task creator or admins
   * @param taskId - Task ID (Guid)
   * @returns EstimatedHoursHistoryResponse with audit entries ordered by most recent first
   */
  async getEstimatedHoursHistory(taskId: string): Promise<EstimatedHoursHistoryResponse> {
    return apiRequest<EstimatedHoursHistoryResponse>(`/tasks/${taskId}/estimated-hours/history`);
  },
};

// ============================================================================
// AUTH API - REFACTORED FOR ENUM COMPLIANCE
// ============================================================================

export const authApi = {
  /**
   * Login with typed request/response
   * @param request - LoginRequest (username, password)
   * @returns LoginResponse with token and user role (enum-typed)
   */
  async login(
    request: LoginRequest
  ): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!res.ok) {
      if (res.status === 401) throw new Error('Sai tài khoản hoặc mật khẩu');
      const text = await res.text().catch(() => '');
      throw new Error(text || `Login failed (${res.status})`);
    }
    
    const data = await res.json() as LoginResponse;
    if (!data?.token) throw new Error('Missing token');
    setAuthToken(data.token);

    // Normalize role
    const role = data.role === 'admin' || data.role === 'user' ? data.role : 'user';

    return {
      token: data.token,
      username: data.username,
      role,
      mustChangePassword: !!data.mustChangePassword,
    };
  },
};

// ============================================================================
// PROJECT API - REFACTORED FOR DTO ALIGNMENT
// ============================================================================

export const projectApi = {
  /**
   * Create project - strict DTO compliance
   * CRITICAL: Uses 'customer' not 'client'
   * @param request - CreateProjectRequest (name, customer, managerId)
   * @returns Created project from backend
   */
  async create(request: CreateProjectRequest): Promise<ProjectResponse> {
    return apiRequest<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: request.name,
        customer: request.customer, // Backend DTO field name
        managerId: request.managerId,
      }),
    });
  },

  /**
   * Update project - strict DTO compliance
   * @param id - Project ID (Guid)
   * @param request - UpdateProjectRequest (optional fields)
   * @returns Updated project from backend
   */
  async update(id: string, request: UpdateProjectRequest): Promise<ProjectResponse> {
    const payload: Record<string, any> = {};
    if (request.name !== undefined) payload.name = request.name;
    if (request.customer !== undefined) payload.customer = request.customer;
    if (request.managerId !== undefined) payload.managerId = request.managerId;
    
    return apiRequest<ProjectResponse>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// RACI API - REFACTORED FOR ENUM COMPLIANCE
// ============================================================================

export const raciApi = {
  /**
   * Get all RACI assignments
   * @returns Array of RaciMatrix with role as RaciRole enum
   */
  async getAll(): Promise<RaciMatrix[]> {
    return apiRequest<RaciMatrix[]>('/raci');
  },

  /**
   * Create RACI assignment - strict enum validation
   * CRITICAL: role MUST be RaciRole enum (R, A, C, I)
   * @param request - CreateRaciRequest (taskId, employeeId, role)
   * @returns Created RACI assignment
   */
  async create(request: CreateRaciRequest): Promise<RaciMatrix> {
    // Runtime validation: ensure role is valid
    if (!isValidRaciRole(request.role)) {
      throw new Error(`Invalid RACI role: ${request.role}. Must be: R, A, C, or I`);
    }
    
    const payload = {
      taskId: request.taskId,
      positionId: request.positionId,
      role: request.role,
    };
    
    return apiRequest<RaciMatrix>('/raci', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update RACI assignment - strict enum validation
   * @param id - RACI assignment ID
   * @param request - UpdateRaciRequest (role)
   * @returns Updated RACI assignment
   */
  async update(id: number | string, request: UpdateRaciRequest): Promise<RaciMatrix> {
    // Runtime validation: ensure role is valid
    if (!isValidRaciRole(request.role)) {
      throw new Error(`Invalid RACI role: ${request.role}. Must be: R, A, C, or I`);
    }
    
    const payload = {
      role: request.role, // Enum: R, A, C, I
    };
    
    return apiRequest<RaciMatrix>(`/raci/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: number | string): Promise<void> {
    return apiRequest<void>(`/raci/${id}`, {
      method: 'DELETE',
    });
  },

  async updateRaciForTask(taskId: string, assignments: RaciMatrix[]): Promise<RaciMatrix[]> {
    const payload = {
      taskId,
      assignments: assignments.map(a => ({
        positionId: a.positionId,
        role: a.role,
        employeeId: a.employeeId,
      })),
    };
    
    return apiRequest<RaciMatrix[]>(`/raci/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export interface CreateDepartmentRequest {
  name: string;
  isActive: boolean;  
}

export interface UpdateDepartmentRequest {
  name: string;      // Changed from optional to required to match backend
  isActive: boolean; // Changed from optional to required to match backend
}

export interface DepartmentDto {
  id: string;
  name: string;
  isActive: boolean;
}

export const departmentApi = {
  async getAll(): Promise<DepartmentDto[]> {
    return apiRequest<DepartmentDto[]>('/departments');
  },

  async create(payload: CreateDepartmentRequest): Promise<DepartmentDto> {
    console.log('[departmentApi.create] Calling POST /departments with payload:', payload);
    const result = await apiRequest<DepartmentDto>('/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('[departmentApi.create] Success:', result);
    return result;
  },

  async update(id: string, payload: UpdateDepartmentRequest): Promise<DepartmentDto> {
    return apiRequest<DepartmentDto>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  },

  async activate(id: string): Promise<DepartmentDto> {
    return apiRequest<DepartmentDto>(`/departments/${id}/activate`, {
      method: 'PATCH',
    });
  },

  async deactivate(id: string): Promise<DepartmentDto> {
    return apiRequest<DepartmentDto>(`/departments/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// ============================================================================
// POSITION API
// ============================================================================

export interface CreatePositionRequest {
  name: string;
  canManage: boolean;
  isActive?: boolean;
}

export interface UpdatePositionRequest {
  name?: string;
  canManage?: boolean;
  isActive?: boolean;
}

export interface PositionDto {
  id: string;
  name: string;
  canManage: boolean;
  isActive: boolean;
}

export const positionApi = {
  async getAll(): Promise<PositionDto[]> {
    return apiRequest<PositionDto[]>('/positions');
  },

  async create(payload: CreatePositionRequest): Promise<PositionDto> {
    return apiRequest<PositionDto>('/positions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdatePositionRequest): Promise<PositionDto> {
    return apiRequest<PositionDto>(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/positions/${id}`, {
      method: 'DELETE',
    });
  },

  async activate(id: string): Promise<PositionDto> {
    return apiRequest<PositionDto>(`/positions/${id}/activate`, {
      method: 'PATCH',
    });
  },

  async deactivate(id: string): Promise<PositionDto> {
    return apiRequest<PositionDto>(`/positions/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// ============================================================================
// EMPLOYEE API
// ============================================================================

export interface ImportEmployeeRow {
  name: string;
  departmentName: string;
  positionName: string;
  positionCanManage: boolean;
  managerName?: string;
}

export interface ImportEmployeesResult {
  departmentsCreated: number;
  positionsCreated: number;
  managersCreated: number;
  employeesCreated: number;
}

export interface CreateBootstrapManagerRequest {
  name: string;
  departmentName: string;
  positionName: string;
}

export interface EmployeeWithAccountDto {
  id: string;
  name: string;
  department: string;
  position: string;
  managerId?: string;
  hasUserAccount?: boolean;
}

export interface EmployeeUsernameDto {
  employeeId: string;
  employeeName: string;
  username: string;
  hasUserAccount: boolean;
  passwordHint?: string;
}

export const employeeApi = {
  /**
   * Bulk import employees from CSV/Excel data.
   * Creates missing Departments, Positions, and Managers automatically.
   * @param rows - Array of employee rows to import
   * @returns Import result with counts of created entities
   */
  async import(rows: ImportEmployeeRow[]): Promise<ImportEmployeesResult> {
    return apiRequest<ImportEmployeesResult>('/employees/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  /**
   * Create a bootstrap Manager employee.
   * Used when no Manager exists yet and user needs to create one before importing.
   * @param request - CreateBootstrapManagerRequest (name, departmentId, positionId)
   * @returns Created employee DTO
   */
  async createBootstrapManager(request: CreateBootstrapManagerRequest): Promise<any> {
    return apiRequest<any>('/employees/bootstrap-manager', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get all employees (sorted by name).
   * Requires authentication.
   * @returns List of employees with optional User flag
   */
  async getAll(): Promise<EmployeeWithAccountDto[]> {
    return apiRequest<EmployeeWithAccountDto[]>('/employees');
  },

  /**
   * Activate an employee account (ADMIN ONLY).
   * Creates User linked to employee with provided password.
   * @param employeeId - Employee ID
   * @param password - Initial password (min 6 chars)
   * @returns Created username
   */
  async activateAccount(employeeId: string, password: string): Promise<{ username: string }> {
    return apiRequest<{ username: string }>(`/employees/${employeeId}/activate-account`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  /**
   * Get list of all employee usernames (ADMIN ONLY).
   * Shows employee name and corresponding username.
   * @returns List of employee names and usernames
   */
  async getUsernames(): Promise<EmployeeUsernameDto[]> {
    return apiRequest<EmployeeUsernameDto[]>('/admin/users/employee-usernames');
  },
};

export { apiRequest };
