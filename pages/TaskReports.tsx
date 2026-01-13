import React, { useState, useMemo } from 'react';
import { Card, Button } from '../components/Shared';
import { Employee, Project, Task, RaciMatrix, Department } from '../types';
import { Filter, ChevronDown, ChevronRight } from 'lucide-react';

interface Position {
  id: string;
  name: string;
}

interface FilterState {
  departmentId: string;
  projectId: string;
  positionId: string;
  employeeId: string;
}

interface RaciStats {
  count: number;
  hours: number;
}

interface TaskReportData {
  taskId: string;
  taskName: string;
  frequency: string;
  estimatedHours: number;
  R: RaciStats;
  A: RaciStats;
  C: RaciStats;
  I: RaciStats;
}

interface GroupReportData {
  groupId: string;
  groupName: string;
  tasks: TaskReportData[];
  subtotal: {
    R: RaciStats;
    A: RaciStats;
    C: RaciStats;
    I: RaciStats;
  };
}

interface TaskReportsProps {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
  departments: Department[];
}



const FilterPanel: React.FC<{
  departments: Department[];
  projects: Project[];
  positions: Position[];
  employees: Employee[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onGenerate: () => void;
}> = ({ departments, projects, positions, employees, filters, onFilterChange, onGenerate }) => {
  const filteredEmployees = useMemo(() => {
    const selectedDeptName = departments.find(d => d.id === filters.departmentId)?.name;
    return employees.filter(emp => {
      if (filters.departmentId && emp.department !== (selectedDeptName || '')) return false;
      if (filters.positionId && emp.position !== filters.positionId) return false;
      return true;
    });
  }, [employees, departments, filters.departmentId, filters.positionId]);

  const canGenerate = filters.departmentId !== '';

  return (
    <Card title="Bộ lọc báo cáo">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">
              Phòng ban <span className="text-red-500">*</span>
            </label>
            <select
              className="input-base"
              value={filters.departmentId}
              onChange={(e) => onFilterChange({ ...filters, departmentId: e.target.value })}
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dự án</label>
            <select
              className="input-base"
              value={filters.projectId}
              onChange={(e) => onFilterChange({ ...filters, projectId: e.target.value })}
            >
              <option value="">-- Tất cả dự án --</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Chức vụ</label>
            <select
              className="input-base"
              value={filters.positionId}
              onChange={(e) => onFilterChange({ ...filters, positionId: e.target.value })}
            >
              <option value="">-- Tất cả chức vụ --</option>
              {positions.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nhân viên</label>
            <select
              className="input-base"
              value={filters.employeeId}
              onChange={(e) => onFilterChange({ ...filters, employeeId: e.target.value })}
            >
              <option value="">-- Tất cả nhân viên --</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            <Filter size={16} className="mr-2" />
            Xem báo cáo
          </Button>
        </div>
      </div>
    </Card>
  );
};

const SummaryCards: React.FC<{
  totalTasks: number;
  totalHours: number;
  raciTotals: { R: RaciStats; A: RaciStats; C: RaciStats; I: RaciStats };
}> = ({ totalTasks, totalHours, raciTotals }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-5 text-center">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng task</div>
        <div className="text-3xl font-bold text-slate-800">{totalTasks}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5 text-center">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng giờ</div>
        <div className="text-3xl font-bold text-slate-800">{totalHours}</div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5 text-center">
        <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">R</div>
        <div className="text-2xl font-bold text-red-600">{raciTotals.R.count}</div>
        <div className="text-xs text-red-500 mt-1">{raciTotals.R.hours}h</div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-5 text-center">
        <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">A</div>
        <div className="text-2xl font-bold text-blue-600">{raciTotals.A.count}</div>
        <div className="text-xs text-blue-500 mt-1">{raciTotals.A.hours}h</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-5 text-center">
        <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">C</div>
        <div className="text-2xl font-bold text-green-600">{raciTotals.C.count}</div>
        <div className="text-xs text-green-500 mt-1">{raciTotals.C.hours}h</div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-5 text-center">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">I</div>
        <div className="text-2xl font-bold text-slate-600">{raciTotals.I.count}</div>
        <div className="text-xs text-slate-500 mt-1">{raciTotals.I.hours}h</div>
      </div>
    </div>
  );
};

const GroupRow: React.FC<{
  group: GroupReportData;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ group, isExpanded, onToggle }) => {
  return (
    <div className="mb-6">
      <div 
        className="bg-slate-100 px-4 py-3 rounded-t-xl border-b-2 border-slate-300 cursor-pointer hover:bg-slate-200 transition-colors flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={20} className="text-slate-600" />
          ) : (
            <ChevronRight size={20} className="text-slate-600" />
          )}
          <h3 className="font-bold text-slate-800 text-sm">{group.groupName}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="font-medium">{group.tasks.length} task(s)</span>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Task</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Tần suất</th>
                  <th className="px-4 py-3 text-center font-semibold text-red-700">R</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-700">A</th>
                  <th className="px-4 py-3 text-center font-semibold text-green-700">C</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">I</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {group.tasks.map(task => {
                  const isHighImpact = task.estimatedHours > 20;
                  return (
                  <tr key={task.taskId} className={`${isHighImpact ? 'bg-amber-50 border-l-4 border-amber-400' : 'hover:bg-slate-50'}`}>
                    <td className={`px-4 py-3 font-medium ${isHighImpact ? 'text-amber-900' : 'text-slate-800'}`}>
                      {task.taskName}
                      {isHighImpact && <span className="ml-2 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">High Impact</span>}
                    </td>
                    <td className={`px-4 py-3 ${isHighImpact ? 'text-amber-700' : 'text-slate-600'}`}>{task.frequency}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-red-600 font-semibold">{task.R.count}</div>
                      <div className="text-xs text-red-500">{task.R.hours}h</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-blue-600 font-semibold">{task.A.count}</div>
                      <div className="text-xs text-blue-500">{task.A.hours}h</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-green-600 font-semibold">{task.C.count}</div>
                      <div className="text-xs text-green-500">{task.C.hours}h</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-slate-600 font-semibold">{task.I.count}</div>
                      <div className="text-xs text-slate-500">{task.I.hours}h</div>
                    </td>
                  </tr>
                  );
                })}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-800" colSpan={2}>Subtotal</td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-red-600">{group.subtotal.R.count}</div>
                    <div className="text-xs text-red-500">{group.subtotal.R.hours}h</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-blue-600">{group.subtotal.A.count}</div>
                    <div className="text-xs text-blue-500">{group.subtotal.A.hours}h</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-green-600">{group.subtotal.C.count}</div>
                    <div className="text-xs text-green-500">{group.subtotal.C.hours}h</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-slate-600">{group.subtotal.I.count}</div>
                    <div className="text-xs text-slate-500">{group.subtotal.I.hours}h</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskReportTable: React.FC<{
  groups: GroupReportData[];
  expandedGroups: Set<string>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ groups, expandedGroups, setExpandedGroups }) => {
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm">
        <p className="text-slate-400">Không có dữ liệu phù hợp với bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <GroupRow 
          key={group.groupId} 
          group={group}
          isExpanded={expandedGroups.has(group.groupId)}
          onToggle={() => toggleGroup(group.groupId)}
        />
      ))}
    </div>
  );
};

export const TaskReports: React.FC<TaskReportsProps> = ({ employees, projects, tasks, raciData, departments }) => {
  const [filters, setFilters] = useState<FilterState>({
    departmentId: '',
    projectId: '',
    positionId: '',
    employeeId: '',
  });
  const [showReport, setShowReport] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const positions: Position[] = useMemo(() => {
    const posSet = new Set(employees.map(e => e.position));
    return Array.from(posSet).map(p => ({ id: p, name: p }));
  }, [employees]);

  const reportData = useMemo(() => {
    if (!showReport || !filters.departmentId) return { groups: [], summary: null };

    const selectedDeptName = departments.find(d => d.id === filters.departmentId)?.name;

    // Filter tasks based on project only
    let filteredTasks = tasks.filter(task => {
      if (filters.projectId && task.projectId !== filters.projectId) return false;
      return true;
    });

    const groupMap = new Map<string, GroupReportData>();

    filteredTasks.forEach(task => {
      const groupId = task.groupId || 'ungrouped';
      const groupName = task.groupName || 'Không nhóm';

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          groupName,
          tasks: [],
          subtotal: {
            R: { count: 0, hours: 0 },
            A: { count: 0, hours: 0 },
            C: { count: 0, hours: 0 },
            I: { count: 0, hours: 0 },
          },
        });
      }

      const taskRaci = raciData.filter(r => r.taskId === task.id);
      const taskHours = task.estimatedHours || 0;

      const raciStats: { R: RaciStats; A: RaciStats; C: RaciStats; I: RaciStats } = {
        R: { count: 0, hours: 0 },
        A: { count: 0, hours: 0 },
        C: { count: 0, hours: 0 },
        I: { count: 0, hours: 0 },
      };

      taskRaci.forEach(raci => {
        const emp = employees.find(e => (e.primaryPositionId || e.positionId) === raci.positionId);
        if (!emp) return;

        // Apply filters: compare department NAME (not ID)
        let shouldCount = true;
        if (filters.departmentId && emp.department !== selectedDeptName) shouldCount = false;
        if (filters.positionId && emp.position !== filters.positionId) shouldCount = false;
        if (filters.employeeId && emp.id !== filters.employeeId) shouldCount = false;

        if (shouldCount) {
          raciStats[raci.role].count++;
          raciStats[raci.role].hours += taskHours;
        }
      });

      const taskReport: TaskReportData = {
        taskId: task.id,
        taskName: task.name,
        frequency: task.frequency,
        estimatedHours: taskHours,
        R: raciStats.R,
        A: raciStats.A,
        C: raciStats.C,
        I: raciStats.I,
      };

      const group = groupMap.get(groupId)!;
      group.tasks.push(taskReport);
      group.subtotal.R.count += raciStats.R.count;
      group.subtotal.R.hours += raciStats.R.hours;
      group.subtotal.A.count += raciStats.A.count;
      group.subtotal.A.hours += raciStats.A.hours;
      group.subtotal.C.count += raciStats.C.count;
      group.subtotal.C.hours += raciStats.C.hours;
      group.subtotal.I.count += raciStats.I.count;
      group.subtotal.I.hours += raciStats.I.hours;
    });

    const groups = Array.from(groupMap.values());

    const summary = {
      totalTasks: filteredTasks.length,
      totalHours: filteredTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      raciTotals: groups.reduce(
        (acc, group) => {
          acc.R.count += group.subtotal.R.count;
          acc.R.hours += group.subtotal.R.hours;
          acc.A.count += group.subtotal.A.count;
          acc.A.hours += group.subtotal.A.hours;
          acc.C.count += group.subtotal.C.count;
          acc.C.hours += group.subtotal.C.hours;
          acc.I.count += group.subtotal.I.count;
          acc.I.hours += group.subtotal.I.hours;
          return acc;
        },
        {
          R: { count: 0, hours: 0 },
          A: { count: 0, hours: 0 },
          C: { count: 0, hours: 0 },
          I: { count: 0, hours: 0 },
        }
      ),
    };

    return { groups, summary };
  }, [showReport, filters, tasks, raciData, employees]);

  return (
    <div className="space-y-6">
      <FilterPanel
        departments={departments}
        projects={projects}
        positions={positions}
        employees={employees}
        filters={filters}
        onFilterChange={setFilters}
        onGenerate={() => setShowReport(true)}
      />

      {showReport && reportData.summary && (
        <>
          <SummaryCards
            totalTasks={reportData.summary.totalTasks}
            totalHours={reportData.summary.totalHours}
            raciTotals={reportData.summary.raciTotals}
          />

          <TaskReportTable groups={reportData.groups} expandedGroups={expandedGroups} setExpandedGroups={setExpandedGroups} />
        </>
      )}
    </div>
  );
};
