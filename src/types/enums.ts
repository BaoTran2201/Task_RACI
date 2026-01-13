/**
 * Frontend Enum Types - Must align with backend DTOs exactly
 * Backend Source: CheckRaci.Application/DTOs
 */

/**
 * RACI Role assignment
 * Values: R (Responsible), A (Accountable), C (Consulted), I (Informed)
 */
export enum RaciRole {
  R = 'R',
  A = 'A',
  C = 'C',
  I = 'I',
}

/**
 * Task Frequency - must match backend enum
 * Daily, Weekly, Monthly, Quarterly, Yearly, AdHoc
 */
export enum TaskFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Yearly = 'Yearly',
  AdHoc = 'AdHoc',
}

/**
 * User Role - system authorization role
 * admin: Full system access
 * user: Limited user access
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

// Type-safe union types for frontend use
export type RaciRoleType = 'R' | 'A' | 'C' | 'I';
export type TaskFrequencyType = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'AdHoc';
export type UserRoleType = 'admin' | 'user';

/**
 * Helper: Map Vietnamese labels to API enum values
 * Used in UI dropdowns → API payloads
 */
export const TaskFrequencyLabels: Record<TaskFrequency, string> = {
  [TaskFrequency.Daily]: 'Hàng ngày',
  [TaskFrequency.Weekly]: 'Hàng tuần',
  [TaskFrequency.Monthly]: 'Hàng tháng',
  [TaskFrequency.Quarterly]: 'Hàng quý',
  [TaskFrequency.Yearly]: 'Hàng năm',
  [TaskFrequency.AdHoc]: 'Khi phát sinh',
};

/**
 * Reverse mapping: Vietnamese label → API enum
 * Used for converting UI selections to API values
 */
export const LabelToTaskFrequency: Record<string, TaskFrequency> = {
  'Hàng ngày': TaskFrequency.Daily,
  'Hàng tuần': TaskFrequency.Weekly,
  'Hàng tháng': TaskFrequency.Monthly,
  'Hàng quý': TaskFrequency.Quarterly,
  'Hàng năm': TaskFrequency.Yearly,
  'Khi phát sinh': TaskFrequency.AdHoc,
};

/**
 * RACI Role display labels
 */
export const RaciRoleLabels: Record<RaciRole, string> = {
  [RaciRole.R]: 'Responsible',
  [RaciRole.A]: 'Accountable',
  [RaciRole.C]: 'Consulted',
  [RaciRole.I]: 'Informed',
};
