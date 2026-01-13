import React from 'react';
import { Employee, Project, Task, RaciMatrix, Department } from '../types';
import { TaskReports } from './TaskReports';
import { UserReports } from './UserReports';

interface ReportsProps {
  type: 'task' | 'user';
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
  departments: Department[];
}

export const Reports: React.FC<ReportsProps> = ({ type, employees, projects, tasks, raciData, departments }) => {
  if (type === 'task') {
    return <TaskReports employees={employees} projects={projects} tasks={tasks} raciData={raciData} departments={departments} />;
  }

  return <UserReports employees={employees} projects={projects} tasks={tasks} raciData={raciData} departments={departments} />;
};
