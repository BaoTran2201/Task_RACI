import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Modal, Badge, Spinner } from '../components/Shared';
import { Employee, Project, Task, RaciMatrix, Role, Position } from '../types';
import { TaskFrequencyLabels, RaciRole } from '../src/types/enums';
import { Filter, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { InlineEditCell } from '../components/InlineEditCell';
import { InlineEditEstimatedHours } from '../components/InlineEditEstimatedHours';
import { EstimatedHoursHistoryDrawer } from '../components/EstimatedHoursHistoryDrawer';
import { taskApi } from '../src/services/api';

interface TaskManagementProps {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
  positions: Position[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setRaciData: React.Dispatch<React.SetStateAction<RaciMatrix[]>>;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ 
  employees, projects, tasks, raciData, positions, setTasks, setRaciData 
}) => {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [raciSaving, setRaciSaving] = useState(false);

  // Admin View State
  const [filterProject, setFilterProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRaciStatus, setFilterRaciStatus] = useState<string>('all');
  
  // Modal State for RACI
  const [isRaciModalOpen, setIsRaciModalOpen] = useState(false);
  const [activeRaciTask, setActiveRaciTask] = useState<Task | null>(null);

  // Drawer State for Estimated Hours History
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getRaciStatus = (taskId: string): { status: string; label: string; color: string } => {
    const assignments = raciData.filter(r => r.taskId === taskId);
    const rCount = assignments.filter(r => r.role === 'R').length;
    const aCount = assignments.filter(r => r.role === 'A').length;

    if (aCount > 1 || (rCount === 0 && aCount === 0)) {
      return { status: 'danger', label: 'Nguy hiểm', color: 'bg-red-100 text-red-700 border-red-300' };
    }
    if (rCount === 0) {
      return { status: 'missing-r', label: 'Thiếu R', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    }
    if (aCount === 0) {
      return { status: 'missing-a', label: 'Thiếu A', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    }
    return { status: 'ok', label: 'OK', color: 'bg-green-100 text-green-700 border-green-300' };
  };

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
    const matchProject = filterProject === 'all' || t.projectId === filterProject;
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.groupId.toLowerCase().includes(searchTerm.toLowerCase());
    const raciStatus = getRaciStatus(t.id);
    const matchRaciStatus = filterRaciStatus === 'all' || raciStatus.status === filterRaciStatus;
    return matchProject && matchSearch && matchRaciStatus;
  });

  const groupOptions = useMemo(() => {
    const uniq = Array.from(new Set(tasks.map(t => t.groupId))).filter(Boolean);
    return uniq.map(g => ({ value: g, label: g }));
  }, [tasks]);

  const partnerOptions = useMemo(() => {
    const uniq = Array.from(new Set(tasks.map(t => t.partner).filter(Boolean))) as string[];
    return uniq.map(p => ({ value: p, label: p }));
  }, [tasks]);

  const projectOptions = useMemo(() => localProjects.map(p => ({ value: p.id, label: p.name })), [localProjects]);
  const frequencyOptions = useMemo(() => Object.entries(TaskFrequencyLabels).map(([value, label]) => ({ value, label })), []);

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      setSavingTaskId(taskId);
      await taskApi.update(taskId, patch);
      const refreshed = await taskApi.getAll();
      setTasks(refreshed);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleUpdateEstimatedHours = async (taskId: string, newHours: number) => {
    try {
      setSaveError(null);
      await taskApi.update(taskId, { estimatedHours: newHours });
      const refreshed = await taskApi.getAll();
      setTasks(refreshed);
    } catch (err: any) {
      throw new Error(err.message || 'Lỗi cập nhật giờ công');
    }
  };

  const addProjectQuick = async (name: string): Promise<{ value: string; label: string }> => {
    const id = `PRJ_${Date.now()}`;
    const created: Project = { id, name, client: 'Internal', managerId: '' };
    setLocalProjects(prev => [...prev, created]);
    return { value: id, label: name };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-slate-800">Quản lý Task</h2>
          <p className="text-sm text-slate-500">Hiển thị {filteredTasks.length}/{tasks.length} task</p>
        </div>
        <div className="flex gap-2 items-center text-sm text-slate-500">
          {savingTaskId && (
            <span className="inline-flex items-center gap-1 text-blue-600"><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</span>
          )}
          {!savingTaskId && (
            <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" />Đã đồng bộ</span>
          )}
          <Button variant="secondary" size="sm" disabled>Export Excel</Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <div className="card-body space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
             <div className="lg:col-span-1">
                <label className="form-label">Tìm kiếm Task</label>
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                   <input 
                      type="text" 
                      className="input-base pl-11" 
                      placeholder="Tên task, nhóm..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
             <div className="lg:col-span-1">
                <label className="form-label">Dự án</label>
                <select
                   className="input-base"
                   value={filterProject}
                   onChange={e => setFilterProject(e.target.value)}
                >
                   <option value="all">Tất cả</option>
                   {projectOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
             </div>
             <div className="lg:col-span-1">
                <label className="form-label">RACI Status</label>
                <select
                   className="input-base"
                   value={filterRaciStatus}
                   onChange={e => setFilterRaciStatus(e.target.value)}
                >
                   <option value="all">Tất cả</option>
                   <option value="ok">✓ OK</option>
                   <option value="missing-r">⚠ Thiếu R</option>
                   <option value="missing-a">⚠ Thiếu A</option>
                   <option value="danger">⛔ Nguy hiểm</option>
                </select>
             </div>
             <div className="lg:col-span-1 flex items-end">
                <Button 
                   variant="ghost"
                   size="sm"
                   onClick={() => { setSearchTerm(''); setFilterProject('all'); setFilterRaciStatus('all'); }}
                   className="w-full"
                >
                   <Filter size={16} className="mr-1" /> Reset
                </Button>
             </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden shadow-sm">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Không tìm thấy task nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Tên task</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Nhóm task</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Tần suất</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Đối tác</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Dự án</th>
                  <th className="px-4 md:px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Giờ ước tính</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Người tạo</th>
                  <th className="px-4 md:px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Matrix</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => {
                  const creator = employees.find(e => e.id === task.creatorId);
                  const project = localProjects.find(p => p.id === task.projectId);
                  const raciCount = raciData.filter(r => r.taskId === task.id).length;
                  const raciStatus = getRaciStatus(task.id);
                  const hasIssue = raciStatus.status !== 'ok';
                  
                  return (
                    <tr key={task.id} className="hover:bg-blue-50/40">
                      <InlineEditCell
                        mode="text"
                        value={task.name}
                        placeholder="Tên task"
                        onSave={(v) => updateTask(task.id, { name: v || '' })}
                        className="max-w-[240px]"
                        display={(v) => <div className="text-sm font-medium text-gray-900 truncate">{v || '-'}</div>}
                      />
                      <InlineEditCell
                        mode="select"
                        value={task.groupId}
                        options={groupOptions}
                        allowAdd
                        onAddOption={async (label) => ({ value: label, label })}
                        onSave={(v) => updateTask(task.id, { groupId: v || task.groupId })}
                        className="max-w-[160px]"
                      />
                      <InlineEditCell
                        mode="select"
                        value={task.frequency}
                        options={frequencyOptions}
                        onSave={(v) => updateTask(task.id, { frequency: (v || task.frequency) as Task['frequency'] })}
                        className="max-w-[140px]"
                      />
                      <InlineEditCell
                        mode="select"
                        value={task.partner || ''}
                        options={partnerOptions}
                        allowAdd
                        onAddOption={async (label) => ({ value: label, label })}
                        onSave={(v) => updateTask(task.id, { partner: v ?? null })}
                        className="max-w-[160px]"
                        display={(v) => v ? <Badge color="blue">{v}</Badge> : <span className="text-gray-400 italic">-</span>}
                      />
                      <InlineEditCell
                        mode="select"
                        value={task.projectId}
                        options={projectOptions}
                        allowAdd
                        onAddOption={addProjectQuick}
                        onSave={(v) => updateTask(task.id, { projectId: v || task.projectId })}
                        className="max-w-[160px]"
                        display={() => project ? <Badge color="gray">{project.name}</Badge> : <span className="text-gray-400 italic">-</span>}
                      />
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                        <InlineEditEstimatedHours
                          taskId={task.id}
                          initialValue={task.estimatedHours || 0}
                          canEdit={true}
                          onSave={handleUpdateEstimatedHours}
                          onError={(msg) => setSaveError(msg)}
                          onViewHistory={setHistoryTaskId}
                        />
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                         {creator?.name || <span className="text-red-400 italic">Unknown</span>}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center text-sm">
                         <div className="flex flex-col gap-1 items-center">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm ${raciStatus.color}`}>
                             {raciStatus.label}
                           </span>
                           <span className="text-[11px] text-slate-500">
                             {raciCount} assignments
                           </span>
                         </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button 
                          size="sm" 
                          variant={hasIssue ? "primary" : "secondary"} 
                          onClick={() => { setActiveRaciTask(task); setIsRaciModalOpen(true); }}
                          disabled={savingTaskId === task.id}
                        >
                           {savingTaskId === task.id ? <span className="inline-flex items-center gap-2"><Spinner className="w-4 h-4" />Đang lưu</span> : hasIssue ? '⚠ Sửa RACI' : 'Gán RACI'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* RACI Edit Modal (Admin Override) */}
      <Modal isOpen={isRaciModalOpen} onClose={() => setIsRaciModalOpen(false)} title={`Admin Override RACI: ${activeRaciTask?.name}`} maxWidth="max-w-3xl">
         <RaciEditor task={activeRaciTask} positions={positions} employees={employees} raciData={raciData} setRaciData={setRaciData} onClose={() => setIsRaciModalOpen(false)} setSaving={setRaciSaving} saving={raciSaving} />
      </Modal>

      <EstimatedHoursHistoryDrawer
        taskId={historyTaskId}
        isOpen={!!historyTaskId}
        onClose={() => setHistoryTaskId(null)}
      />
    </div>
  );
};

const RaciEditor = ({ task, positions, employees, raciData, setRaciData, onClose, setSaving, saving }: { task: Task | null, positions: Position[], employees: Employee[], raciData: RaciMatrix[], setRaciData: any, onClose: () => void, setSaving: (v: boolean) => void, saving: boolean }) => {
  if (!task) return null;
  const [localRaci, setLocalRaci] = useState<RaciMatrix[]>(raciData.filter(r => r.taskId === task.id));
  const [partnerValue, setPartnerValue] = useState<string>(task.partner || '');
  const [selectedPosition, setSelectedPosition] = useState<{ positionId: string; role: Role } | null>(null);

  const updateRole = (posId: string, role: Role | 'NONE', empId?: string) => {
    if (role === 'NONE') {
      setLocalRaci(prev => prev.filter(r => !(r.positionId === posId && (!empId || r.employeeId === empId))));
    } else {
      if (!empId) {
        setSelectedPosition({ positionId: posId, role });
      } else {
        setLocalRaci(prev => {
          const others = prev.filter(r => !(r.positionId === posId && r.role === role && r.employeeId === empId));
          const position = positions.find(p => p.id === posId);
          const positionName = position?.name || '';
          return [...others, { taskId: task.id, positionId: posId, positionName, role: role as RaciRole, employeeId: empId }];
        });
        setSelectedPosition(null);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { raciApi } = await import('../src/services/api');
      const { taskApi } = await import('../src/services/api');
      
      await taskApi.update(task.id, { partner: partnerValue || null });
      
      await raciApi.updateRaciForTask(task.id, localRaci);
      
      setRaciData((prev: RaciMatrix[]) => {
        const otherTasks = prev.filter(r => r.taskId !== task.id);
        return [...otherTasks, ...localRaci];
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving RACI assignments:', error);
      alert('Lỗi lưu thay đổi: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 p-3 rounded text-sm text-red-700 border border-red-100">
         <strong>Admin Warning:</strong> Bạn đang chỉnh sửa dữ liệu gốc. Mọi thay đổi sẽ áp dụng ngay lập tức cho báo cáo toàn hệ thống.
      </div>
      <div className="space-y-3 border-t border-b py-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Đối tác (không bắt buộc)</label>
          <input
            type="text"
            value={partnerValue}
            onChange={(e) => setPartnerValue(e.target.value)}
            placeholder="Tên đối tác..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-2 border-t border-b py-4">
        {positions.map(pos => {
          const positionAssignments = localRaci.filter(r => r.positionId === pos.id);
          const positionEmployees = employees.filter(e => (e.primaryPositionId || e.positionId) === pos.id);
          
          return (
            <div key={pos.id} className="p-3 hover:bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">{pos.name}</div>
                <div className="flex space-x-1">
                   {['R', 'A', 'C', 'I'].map((role) => {
                     const hasRole = positionAssignments.some(r => r.role === role);
                     return (
                       <button
                         key={role}
                         onClick={() => updateRole(pos.id, role as Role)}
                         className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                           hasRole ? 
                           (role === 'R' ? 'bg-red-500 text-white' : role === 'A' ? 'bg-amber-500 text-white' : role === 'C' ? 'bg-cyan-500 text-white' : 'bg-slate-500 text-white') 
                           : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                         }`}
                       >
                         {role}
                       </button>
                     );
                   })}
                </div>
              </div>
              
              {positionAssignments.length > 0 && (
                <div className="space-y-1 pl-2 border-l-2 border-blue-200">
                  {positionAssignments.map((assignment, idx) => {
                    const emp = employees.find(e => e.id === assignment.employeeId);
                    const roleColor = assignment.role === 'R' ? 'red' : assignment.role === 'A' ? 'amber' : assignment.role === 'C' ? 'cyan' : 'slate';
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-${roleColor}-100 text-${roleColor}-700 font-bold`}>
                            {assignment.role}
                          </span>
                          <span className="text-gray-700">{emp?.name || 'Unknown'}</span>
                        </div>
                        <button
                          onClick={() => updateRole(pos.id, 'NONE', assignment.employeeId)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Chọn nhân viên cho vai trò {selectedPosition.role}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {positions.find(p => p.id === selectedPosition.positionId)?.name}
              </p>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {employees
                .filter(e => (e.primaryPositionId || e.positionId) === selectedPosition.positionId)
                .map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => updateRole(selectedPosition.positionId, selectedPosition.role, emp.id)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium text-sm">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.department}</div>
                  </button>
                ))}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setSelectedPosition(null)} variant="ghost" size="sm">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button onClick={() => handleSave()} variant="danger" disabled={saving}>
          {saving ? <span className="inline-flex items-center gap-2"><Spinner className="w-4 h-4" />Đang lưu...</span> : 'Lưu Thay Đổi (Admin)'}
        </Button>
      </div>
    </div>
  );
};
