import React, { useState, useMemo } from 'react';
import { Card, Button } from '../components/Shared';
import { Employee, Project, Task, RaciMatrix, Department } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Filter, Calendar } from 'lucide-react';
import { TaskFrequency, TaskFrequencyLabels } from '../src/types/enums';


interface UserFilterState {
  departmentId: string;
  projectId: string;
  employeeId: string;
}

interface RaciStats {
  count: number;
  hours: number;
}

interface FrequencyStats {
  frequency: TaskFrequency;
  count: number;
  percentage: number;
  hours: number;
}

interface UserReportsProps {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
  departments: Department[];
}

type WorkloadStatus = 'normal' | 'high' | 'overloaded';

const CAPACITY_THRESHOLD_NORMAL = 0.8;
const CAPACITY_THRESHOLD_HIGH = 1.0;
const DEFAULT_CAPACITY_PER_MONTH = 160;

const getWorkloadStatus = (totalHours: number, capacityHours: number = DEFAULT_CAPACITY_PER_MONTH): { status: WorkloadStatus; percentage: number } => {
  const percentage = capacityHours > 0 ? (totalHours / capacityHours) * 100 : 0;
  if (percentage > CAPACITY_THRESHOLD_HIGH * 100) return { status: 'overloaded', percentage };
  if (percentage > CAPACITY_THRESHOLD_NORMAL * 100) return { status: 'high', percentage };
  return { status: 'normal', percentage };
};

const getStatusColor = (status: WorkloadStatus): { bg: string; border: string; text: string; badge: string } => {
  switch (status) {
    case 'overloaded':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
    case 'high':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' };
    default:
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
  }
};



const RACI_COLORS: Record<'R'|'A'|'C'|'I', string> = {
  R: '#DC2626',
  A: '#2563EB',
  C: '#16A34A',
  I: '#64748B',
};

const FREQUENCY_COLORS: Record<TaskFrequency, string> = {
  [TaskFrequency.Daily]: '#3B82F6',   
  [TaskFrequency.Weekly]: '#8B5CF6',    
  [TaskFrequency.Monthly]: '#F59E0B',    
  [TaskFrequency.Quarterly]: '#14B8A6', 
  [TaskFrequency.Yearly]: '#6B7280',     
  [TaskFrequency.AdHoc]: '#EF4444',      
};

const UserFilterPanel: React.FC<{
  departments: Department[];
  projects: Project[];
  employees: Employee[];
  filters: UserFilterState;
  onChange: (f: UserFilterState) => void;
  onGenerate: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  filteredEmployees: Employee[];
}> = ({ departments, projects, employees, filters, onChange, onGenerate, search, onSearchChange, filteredEmployees }) => {
  const canGenerate = filters.departmentId !== '';
  return (
    <Card title="Bộ lọc báo cáo">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="form-group md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Nhân viên</label>
              <input
                type="text"
                placeholder="Tìm tên nhân viên..."
                className="input-base w-48"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <select
              className="input-base"
              value={filters.employeeId}
              onChange={(e) => onChange({ ...filters, employeeId: e.target.value })}
            >
              <option value="">-- Tất cả nhân viên --</option>
              {filteredEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phòng ban <span className="text-red-500">*</span></label>
            <select
              className="input-base"
              value={filters.departmentId}
              onChange={(e) => onChange({ ...filters, departmentId: e.target.value })}
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
 <div className="form-group">
            <label className="form-label">Dự án</label>
            <select
              className="input-base"
              value={filters.projectId}
              onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
            >
              <option value="">-- Tất cả dự án --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
   
        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onGenerate} disabled={!canGenerate}>
            <Filter size={16} className="mr-2"/>
            Xem báo cáo
          </Button>
        </div>
      </div>
    </Card>
  );
};

const WorkloadStatusBadge: React.FC<{ status: WorkloadStatus; percentage: number }> = ({ status, percentage }) => {
  const colors = getStatusColor(status);
  const statusLabel = status === 'overloaded' ? 'Quá Tải' : status === 'high' ? 'Cao' : 'Bình Thường';
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
      <span>{statusLabel}</span>
      <span className="opacity-75">{Math.round(percentage)}%</span>
    </div>
  );
};

const CapacityBar: React.FC<{ totalHours: number; capacity?: number }> = ({ totalHours, capacity = DEFAULT_CAPACITY_PER_MONTH }) => {
  const { status, percentage } = getWorkloadStatus(totalHours, capacity);
  const colors = getStatusColor(status);
  const capped = Math.min(percentage, 150);
  const barColor = status === 'overloaded' ? 'bg-red-500' : status === 'high' ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>Dung lượng</span>
        <span>{totalHours}h / {capacity}h</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${barColor}`}
          style={{ width: `${capped}%` }}
        />
      </div>
    </div>
  );
};

const RaciPieChart: React.FC<{ stats: { R: RaciStats; A: RaciStats; C: RaciStats; I: RaciStats } }> = ({ stats }) => {
  const chartData = [
    { key: 'R', name: 'R', value: stats.R.count, color: RACI_COLORS.R },
    { key: 'A', name: 'A', value: stats.A.count, color: RACI_COLORS.A },
    { key: 'C', name: 'C', value: stats.C.count, color: RACI_COLORS.C },
    { key: 'I', name: 'I', value: stats.I.count, color: RACI_COLORS.I },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const key = p.name as 'R'|'A'|'C'|'I';
      const hours = stats[key].hours;
      const count = stats[key].count;
      return (
        <div className="bg-white border border-slate-200 px-3 py-2 rounded-md text-xs">
          <div className="font-semibold">{key}</div>
          <div>{count} task</div>
          <div>{hours}h</div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" height={24} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const RaciStatsBlock: React.FC<{
  totalTasks: number;
  totalHours: number;
  stats: { R: RaciStats; A: RaciStats; C: RaciStats; I: RaciStats };
}> = ({ totalTasks, totalHours, stats }) => {
  const calcPct = (hours: number) => totalHours > 0 ? `${((hours / totalHours) * 100).toFixed(0)}%` : '0%';
  return (  
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Responsible</div>
        <div className="text-3xl font-extrabold text-red-700 leading-tight">{stats.R.count}</div>
        <div className="text-xs font-medium text-red-600 mt-1">{stats.R.hours}h ({calcPct(stats.R.hours)})</div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Accountable</div>
        <div className="text-3xl font-extrabold text-blue-700 leading-tight">{stats.A.count}</div>
        <div className="text-xs font-medium text-blue-600 mt-1">{stats.A.hours}h ({calcPct(stats.A.hours)})</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Consulted</div>
        <div className="text-3xl font-extrabold text-green-700 leading-tight">{stats.C.count}</div>
        <div className="text-xs font-medium text-green-600 mt-1">{stats.C.hours}h ({calcPct(stats.C.hours)})</div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Informed</div>
        <div className="text-3xl font-extrabold text-slate-700 leading-tight">{stats.I.count}</div>
        <div className="text-xs font-medium text-slate-600 mt-1">{stats.I.hours}h ({calcPct(stats.I.hours)})</div>
      </div>
    </div>
  );
};

const ImpactCard: React.FC<{
  role: 'A' | 'C' | 'I';
  label: string;
  count: number;
  hours: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = ({ role, label, count, hours, bgColor, textColor, borderColor }) => {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-4 text-center`}>
      <div className={`text-sm font-bold ${textColor} uppercase tracking-wide mb-2`}>{label}</div>
      <div className={`text-3xl font-extrabold ${textColor} leading-tight`}>{count}</div>
      <div className={`text-xs font-medium ${textColor} opacity-75 mt-1`}>{hours}h</div>
    </div>
  );
};

const FrequencyBarChart: React.FC<{ frequencies: FrequencyStats[] }> = ({ frequencies }) => {
  const chartData = frequencies.map(f => ({
    name: TaskFrequencyLabels[f.frequency],
    count: f.count,
    percentage: f.percentage,
    color: FREQUENCY_COLORS[f.frequency],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 px-3 py-2 rounded-md text-xs shadow-lg">
          <div className="font-semibold">{data.name}</div>
          <div>{data.count} tasks ({data.percentage.toFixed(1)}%)</div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const FrequencyStatsGrid: React.FC<{ frequencies: FrequencyStats[]; totalTasks: number }> = ({ frequencies, totalTasks }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {frequencies.map((freq) => {
        const label = TaskFrequencyLabels[freq.frequency];
        const color = FREQUENCY_COLORS[freq.frequency];
        const bgOpacity = freq.frequency === TaskFrequency.Daily ? 'bg-opacity-10' : 
                          freq.frequency === TaskFrequency.Weekly ? 'bg-opacity-10' :
                          freq.frequency === TaskFrequency.Monthly ? 'bg-opacity-10' :
                          freq.frequency === TaskFrequency.Quarterly ? 'bg-opacity-10' :
                          freq.frequency === TaskFrequency.Yearly ? 'bg-opacity-10' : 'bg-opacity-10';
        
        return (
          <div 
            key={freq.frequency}
            className="rounded-lg p-3 border-2 transition-all hover:shadow-md"
            style={{ 
              borderColor: color,
              backgroundColor: `${color}15`
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color }}>
              {label}
            </div>
            <div className="text-2xl font-extrabold" style={{ color }}>
              {freq.count}
            </div>
            <div className="text-xs font-medium opacity-75 mt-1" style={{ color }}>
              {freq.percentage.toFixed(1)}% • {freq.hours}h
            </div>
          </div>
        );
      })}
    </div>
  );
};

const UserReportCard: React.FC<{
  employee: Employee;
  stats: { R: RaciStats; A: RaciStats; C: RaciStats; I: RaciStats };
  totalTasks: number;
  totalHours: number;
  related: { A: RaciStats; C: RaciStats; I: RaciStats };
  frequencies: FrequencyStats[];
}> = ({ employee, stats, totalTasks, totalHours, related, frequencies }) => {
  const { status } = getWorkloadStatus(totalHours);
  const colors = getStatusColor(status);
  return (
    <div className={`bg-white rounded-2xl border-2 ${colors.border} shadow-lg overflow-hidden`}>
      <div className={`${colors.bg} px-6 py-5 border-b-2 ${colors.border}`}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{employee.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{employee.position} • {employee.department}</p>
          </div>
          <WorkloadStatusBadge status={status} percentage={(totalHours / DEFAULT_CAPACITY_PER_MONTH) * 100} />
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-extrabold text-slate-900">{totalTasks}</span>
          <span className="text-sm font-medium text-slate-600">tasks</span>
          <span className="ml-auto text-sm font-medium text-slate-600">{totalHours}h total</span>
        </div>
        <div className="mt-4">
          <CapacityBar totalHours={totalHours} />
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-80 flex justify-center">
            <div className="relative w-60 h-60">
              <RaciPieChart stats={stats} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-3xl font-extrabold text-slate-900">{totalTasks}</div>
                <div className="text-xs font-medium text-slate-500">tasks</div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <RaciStatsBlock totalTasks={totalTasks} totalHours={totalHours} stats={stats} />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-6 bg-slate-50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Phân bổ theo Tần suất</h4>
        </div>
        <FrequencyStatsGrid frequencies={frequencies} totalTasks={totalTasks} />
        <div className="mt-6">
          <FrequencyBarChart frequencies={frequencies} />
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-6">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Ảnh hưởng khi người này chịu trách nhiệm (R)</h4>
        <div className="grid grid-cols-3 gap-3">
          <ImpactCard
            role="A"
            label="Accountable"
            count={related.A.count}
            hours={related.A.hours}
            bgColor="bg-blue-50"
            textColor="text-blue-700"
            borderColor="border-blue-200"
          />
          <ImpactCard
            role="C"
            label="Consulted"
            count={related.C.count}
            hours={related.C.hours}
            bgColor="bg-green-50"
            textColor="text-green-700"
            borderColor="border-green-200"
          />
          <ImpactCard
            role="I"
            label="Informed"
            count={related.I.count}
            hours={related.I.hours}
            bgColor="bg-slate-50"
            textColor="text-slate-700"
            borderColor="border-slate-200"
          />
        </div>
      </div>
    </div>
  );
}

export const UserReports: React.FC<UserReportsProps> = ({ employees, projects, tasks, raciData, departments }) => {
  const [userFilters, setUserFilters] = useState<UserFilterState>({
    departmentId: '',
    projectId: '',
    employeeId: '',
  });
  const [userSearch, setUserSearch] = useState('');
  const [showUserReport, setShowUserReport] = useState(false);


  const filteredUserListEmployees = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    const selectedDeptName = departments.find(d => d.id === userFilters.departmentId)?.name;
    return employees.filter(e => {
      if (userFilters.departmentId && e.department !== (selectedDeptName || '')) return false;
      if (term && !e.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [employees, departments, userFilters.departmentId, userSearch]);

  const computeUserReports = useMemo(() => {
    if (!showUserReport || !userFilters.departmentId) return [] as Array<any>;

    const tasksById = new Map(tasks.map(t => [t.id, t] as const));

    const selectedDeptName = departments.find(d => d.id === userFilters.departmentId)?.name;
    const filteredEmployees = employees.filter(e => {
      if (e.department !== (selectedDeptName || '')) return false;
      if (userFilters.employeeId && userFilters.employeeId !== e.id) return false;
      return true;
    });

    const reports: Array<any> = [];

    filteredEmployees.forEach(emp => {
      const empPosId = emp.primaryPositionId || emp.positionId || '';
      const assignments = raciData.filter(r => r.positionId === empPosId).filter(r => {
        const t = tasksById.get(r.taskId);
        if (!t) return false;
        if (userFilters.projectId && t.projectId !== userFilters.projectId) return false;
        return true;
      });

      const stats: { R: RaciStats; A: RaciStats; C: RaciStats; I: RaciStats } = {
        R: { count: 0, hours: 0 },
        A: { count: 0, hours: 0 },
        C: { count: 0, hours: 0 },
        I: { count: 0, hours: 0 },
      };

      const frequencyMap = new Map<TaskFrequency, { count: number; hours: number }>();
      Object.values(TaskFrequency).forEach(freq => {
        frequencyMap.set(freq, { count: 0, hours: 0 });
      });

      let totalTasks = 0;
      let totalHours = 0;

      assignments.forEach(a => {
        const t = tasksById.get(a.taskId)!;
        const h = t.estimatedHours || 0;
        stats[a.role].count += 1;
        stats[a.role].hours += h;
        
        // Track frequency
        const freq = t.frequency as TaskFrequency;
        const freqData = frequencyMap.get(freq);
        if (freqData) {
          freqData.count += 1;
          freqData.hours += h;
        }
        
        totalTasks += 1;
        totalHours += h;
      });

      // Convert frequency map to array with percentages
      const frequencies: FrequencyStats[] = Array.from(frequencyMap.entries())
        .filter(([_, data]) => data.count > 0)
        .map(([frequency, data]) => ({
          frequency,
          count: data.count,
          hours: data.hours,
          percentage: totalTasks > 0 ? (data.count / totalTasks) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const rTasks = assignments.filter(a => a.role === 'R').map(a => tasksById.get(a.taskId)!).filter(Boolean);
      const related = { A:{count:0,hours:0}, C:{count:0,hours:0}, I:{count:0,hours:0} } as {A:RaciStats; C:RaciStats; I:RaciStats};
      rTasks.forEach(t => {
        const h = t.estimatedHours || 0;
        raciData.forEach(rr => {
          if (rr.taskId === t.id && rr.positionId !== empPosId && (rr.role === 'A' || rr.role === 'C' || rr.role === 'I')) {
            related[rr.role as 'A'|'C'|'I'].count += 1;
            related[rr.role as 'A'|'C'|'I'].hours += h;
          }
        });
      });

      if (totalTasks > 0) {
        reports.push({ employee: emp, stats, totalTasks, totalHours, related, frequencies });
      }
    });

    return reports;
  }, [showUserReport, userFilters, employees, tasks, raciData]);

  return (
    <div className="space-y-6">
      <UserFilterPanel
        departments={departments}
        projects={projects}
        employees={employees}
        filters={userFilters}
        onChange={setUserFilters}
        onGenerate={() => setShowUserReport(true)}
        search={userSearch}
        onSearchChange={setUserSearch}
        filteredEmployees={filteredUserListEmployees}
      />

      {showUserReport ? (
        computeUserReports.length > 0 ? (
          <div className="space-y-6">
            {computeUserReports.map((r, idx) => (
              <UserReportCard 
                key={idx} 
                employee={r.employee} 
                stats={r.stats} 
                totalTasks={r.totalTasks} 
                totalHours={r.totalHours} 
                related={r.related}
                frequencies={r.frequencies}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white rounded-lg border border-gray-200">
            <p className="text-slate-500 text-sm">Không có dữ liệu phù hợp</p>
          </div>
        )
      ) : null}
    </div>
  );
};
