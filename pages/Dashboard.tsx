import React from 'react';
import { Role } from '../types';
import { Card, Button, Badge, RaciChip } from '../components/Shared';
import { Page, Task, Employee, Project, RaciMatrix } from '../types';
import { Users, Briefcase, Clock, CheckSquare } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  stats: {
    tasks: number;
    employees: number;
    projects: number;
    hours: number;
  };
  recentTasks: { task: Task; project: Project | undefined; creator: Employee | undefined; role: string }[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, stats, recentTasks }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Tổng quan hệ thống quản lý RACI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Tổng số Task" 
          value={stats.tasks} 
          icon={<CheckSquare size={24} />} 
          color="blue"
        />
        <StatCard 
          title="Nhân sự Active" 
          value={stats.employees} 
          icon={<Users size={24} />} 
          color="green"
        />
        <StatCard 
          title="Dự án đang chạy" 
          value={stats.projects} 
          icon={<Briefcase size={24} />} 
          color="purple"
        />
        <StatCard 
          title="Ước tính giờ công" 
          value={`${stats.hours}h`} 
          icon={<Clock size={24} />} 
          color="amber"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => onNavigate(Page.ADMIN_TASKS)}>
          + Quản lý Task
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onNavigate(Page.ADMIN_IMPORT_EMPLOYEES)}>
          Import Nhân viên
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onNavigate(Page.ADMIN_IMPORT_PROJECTS)}>
          Import Dự án
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onNavigate(Page.ADMIN_REPORT_TASK)}>
          Báo cáo Task
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onNavigate(Page.ADMIN_REPORT_USER)}>
          Báo cáo Nhân sự
        </Button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Task gần đây</h3>
        </div>
        <div className="card-body p-0">
          {recentTasks.length === 0 ? (
            <div className="empty-state m-6">
              <p className="text-slate-500 text-sm mb-6">Chưa có dữ liệu, hãy Import dữ liệu trước</p>
              <Button onClick={() => onNavigate(Page.ADMIN_IMPORT_EMPLOYEES)}>
                → Import Nhân viên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell text-left font-semibold pl-6">Task</th>
                    <th className="table-cell text-left font-semibold">Dự án</th>
                    <th className="table-cell text-left font-semibold">Người tạo</th>
                    <th className="table-cell text-left font-semibold">Tần suất</th>
                    <th className="table-cell text-left font-semibold pr-6">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.map((item, idx) => (
                    <tr key={idx} className="table-row">
                      <td className="table-cell font-medium text-slate-800 pl-6">{item.task.name}</td>
                      <td className="table-cell text-slate-600">{item.project?.name || '-'}</td>
                      <td className="table-cell text-slate-600">{item.creator?.name}</td>
                      <td className="table-cell text-slate-600">
                        <span className="badge-neutral">{item.task.frequency}</span>
                      </td>
                      <td className="table-cell pr-6">
                        <RaciChip role={item.role as Role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'blue' }: { title: string, value: string | number, icon: React.ReactNode, color?: 'blue' | 'green' | 'purple' | 'amber' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100 group-hover:text-green-700',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700',
  };

  return (
    <div className="card p-6 group cursor-default hover:border-slate-300/80 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl transition-colors duration-300 ${colors[color]} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
};