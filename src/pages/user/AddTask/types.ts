import { Task } from '../../../../types';
import { TaskFrequency } from '../../../../src/types/enums';

export interface EmployeeRoleContext {
  departmentId: string;
  projectId: string;
  mainPositionId: string;
  subPositionId: string;
  lineManagerPositionId: string;
  relatedPositionIds: string[];
}

export interface RaciAssignment {
  responsible?: { positionId: string; name: string } | null;
  accountable?: { positionId: string; name: string } | null;
  consulted?: { positionId: string; name: string } | null;
  informed?: { positionId: string; name: string } | null;
}

export interface TaskRow {
  id: string;
  groupName: string;
  name: string;
  duration: number;
  frequency: TaskFrequency; // Use enum, not union with strings
  raci: RaciAssignment;
  partner?: string;
}

export interface TaskErrors {
  [key: string]: string;
}

export interface AddTaskFormErrors {
  context: Record<string, string>;
  tasks: TaskErrors;
}
