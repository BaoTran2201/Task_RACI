import { Employee, Project, Task, RaciMatrix } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Nguyễn Văn A', department: 'IT', position: 'Developer', managerId: 'E002' },
  { id: 'E002', name: 'Trần Thị B', department: 'IT', position: 'Tech Lead', managerId: 'E005' },
  { id: 'E003', name: 'Lê Văn C', department: 'Sales', position: 'Sales Executive', managerId: 'E004' },
  { id: 'E004', name: 'Phạm Thị D', department: 'Sales', position: 'Sales Manager', managerId: 'E005' },
  { id: 'E005', name: 'Hoàng Văn E', department: 'Board', position: 'Director' },
  { id: 'E006', name: 'Đỗ Thị F', department: 'Marketing', position: 'Content Creator', managerId: 'E007' },
  { id: 'E007', name: 'Ngô Văn G', department: 'Marketing', position: 'Marketing Lead', managerId: 'E005' },
  { id: 'E008', name: 'Bùi Thị H', department: 'HR', position: 'Recruiter', managerId: 'E009' },
  { id: 'E009', name: 'Vũ Văn I', department: 'HR', position: 'HR Manager', managerId: 'E005' },
  { id: 'E010', name: 'Đặng Thị K', department: 'Finance', position: 'Accountant', managerId: 'E011' },
  { id: 'E011', name: 'Lý Văn L', department: 'Finance', position: 'Chief Accountant', managerId: 'E005' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'P001', name: 'Website E-commerce', client: 'FPT Retail', managerId: 'E002' },
  { id: 'P002', name: 'App Nội bộ HR', client: 'Internal', managerId: 'E002' },
  { id: 'P003', name: 'Marketing Campaign Q3', client: 'VinGroup', managerId: 'E007' },
  { id: 'P004', name: 'Tuyển dụng Fresher', client: 'Internal', managerId: 'E009' },
  { id: 'P005', name: 'Báo cáo tài chính năm', client: 'Internal', managerId: 'E011' },
];

export const MOCK_TASKS: Task[] = [
  { id: 'T001', groupId: 'G01', name: 'Giám sát server uptime', frequency: 'Hàng ngày', creatorId: 'E001', projectId: 'P001' },
  { id: 'T002', groupId: 'G01', name: 'Backup database', frequency: 'Hàng tuần', creatorId: 'E001', projectId: 'P001' },
  { id: 'T003', groupId: 'G02', name: 'Viết content social', frequency: 'Hàng ngày', creatorId: 'E006', projectId: 'P003' },
  { id: 'T004', groupId: 'G03', name: 'Phỏng vấn ứng viên', frequency: 'Khi phát sinh', creatorId: 'E008', projectId: 'P004' },
  { id: 'T005', groupId: 'G04', name: 'Review code', frequency: 'Hàng ngày', creatorId: 'E002', projectId: 'P002' },
  { id: 'T006', groupId: 'G04', name: 'Meeting khách hàng', frequency: 'Hàng tuần', creatorId: 'E004', projectId: 'P001' },
];

// Simple initial RACI data
export const MOCK_RACI: RaciMatrix[] = [
  { taskId: 'T001', employeeId: 'E001', role: 'R' },
  { taskId: 'T001', employeeId: 'E002', role: 'A' },
  { taskId: 'T001', employeeId: 'E005', role: 'I' },
  { taskId: 'T002', employeeId: 'E001', role: 'R' },
  { taskId: 'T002', employeeId: 'E002', role: 'A' },
  { taskId: 'T003', employeeId: 'E006', role: 'R' },
  { taskId: 'T003', employeeId: 'E007', role: 'A' },
  { taskId: 'T003', employeeId: 'E005', role: 'I' },
];
