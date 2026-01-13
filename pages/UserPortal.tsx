import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, RaciChip, Modal, Input, Select } from '../components/Shared';
import { Employee, Project, Task, RaciMatrix, Role, Position } from '../types';
import { RaciRole, TaskFrequency, TaskFrequencyLabels } from '../src/types/enums';
import { CheckSquare, Clock, Plus, Edit2, User, Briefcase, Filter, ChevronRight, Users, UserPlus, Search } from 'lucide-react';
import { EditableMyTasksTable } from './EditableMyTasksTable';
import { raciApi, employeeApi } from '../src/services/api';

// --- PROPS INTERFACE ---
interface UserPortalProps {
  currentUser: Employee;
  employees: Employee[];
  positions: Position[];
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setRaciData: React.Dispatch<React.SetStateAction<RaciMatrix[]>>;
  view: 'dashboard' | 'my_tasks' | 'my_raci' | 'profile' | 'employees';
  onNavigate: (view: any) => void;
}

// --- 1. USER DASHBOARD ---
const UserDashboard: React.FC<UserPortalProps> = ({ currentUser, tasks, raciData, onNavigate }) => {
  const userPositionId = currentUser.primaryPositionId || currentUser.positionId || null;
  const myTasks = tasks.filter(t =>
    t.creatorId === currentUser.id ||
    (userPositionId ? t.raciAssignments?.some(r => r.positionId === userPositionId) : false)
  );
  const myRaci = raciData.filter(r => (userPositionId ? r.positionId === userPositionId : false));

  const stats = {
    totalTasks: myTasks.length,
    roleR: myRaci.filter(r => r.role === 'R').length,
    roleA: myRaci.filter(r => r.role === 'A').length,
    hours: myTasks.length * 4 + myRaci.length * 2 // Mock calculation
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Xin chào, {currentUser.name}!</h2>
          <p className="text-slate-500 text-sm">Hôm nay bạn có {stats.roleR} công việc cần thực hiện.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onNavigate('add_task')}><Plus className="w-4 h-4 mr-2" /> Thêm Task Mới</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-slate-500 text-xs font-medium uppercase mb-1">Task Của Tôi</div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalTasks}</div>
        </Card>
        <Card className="p-4">
          <div className="text-red-500 text-xs font-medium uppercase mb-1">Tôi chịu trách nhiệm (R)</div>
          <div className="text-2xl font-bold text-red-700">{stats.roleR}</div>
        </Card>
        <Card className="p-4">
          <div className="text-amber-500 text-xs font-medium uppercase mb-1">Tôi cần duyệt (A)</div>
          <div className="text-2xl font-bold text-amber-700">{stats.roleA}</div>
        </Card>
        <Card className="p-4">
          <div className="text-blue-500 text-xs font-medium uppercase mb-1">Giờ công ước tính</div>
          <div className="text-2xl font-bold text-blue-700">{stats.hours}h</div>
        </Card>
      </div>

      {/* Empty State or Quick List */}
      {myTasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
            <CheckSquare className="text-slate-400" />
          </div>
          <h3 className="text-slate-900 font-medium">Bạn chưa khai báo task nào</h3>
          <p className="text-slate-500 text-sm mb-4">Bắt đầu bằng việc thêm task đầu tiên của bạn.</p>
          <Button variant="secondary" onClick={() => onNavigate('add_task')}>Tạo Task Ngay</Button>
        </div>
      ) : (
        <Card title="Task Gần Đây">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Tần suất</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myTasks.slice(0, 5).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-slate-500">{t.frequency}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onNavigate('my_tasks')} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Chi tiết &rarr;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

const getRaciBadgeColor = (role: Role): string => {
  switch (role) {
    case 'R':
      return '#EF4444';
    case 'A':
      return '#3B82F6';
    case 'C':
      return '#10B981';
    case 'I':
      return '#6B7280';
  }
};

const TabsHeader: React.FC<{ activeTab: 'projects' | 'raci'; onChange: (tab: 'projects' | 'raci') => void }> = ({
  activeTab,
  onChange,
}) => {
  const tabs = [
    { key: 'projects' as const, label: 'Thông tin chung theo dự án' },
    { key: 'raci' as const, label: 'R.A.C.I' },
  ];

  return (
    <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`whitespace - nowrap px - 4 py - 2 text - sm font - semibold rounded - t - lg border - b - 2 transition - colors ${isActive
                ? 'text-blue-600 border-blue-500 bg-blue-50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              } `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const TabProjectsOverview: React.FC<{
  projects: Project[];
  myTasks: Task[];
  onSelectProject: (projectId: string) => void;
}> = ({ projects, myTasks, onSelectProject }) => {
  const projectSummaries = projects
    .map((project) => ({
      project,
      count: myTasks.filter((t) => t.projectId === project.id).length,
    }))
    .filter((item) => item.count > 0);

  if (myTasks.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500">Bạn chưa có task nào. Thêm task để thấy dự án liên quan.</p>
      </div>
    );
  }

  if (projectSummaries.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500">Không tìm thấy dự án nào có task của bạn.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projectSummaries.map(({ project, count }) => (
        <button
          key={project.id}
          onClick={() => onSelectProject(project.id)}
          className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-300 hover:shadow transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">{project.name}</div>
              <div className="text-xs text-slate-500 mt-1">{project.id}</div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
              <span>{count} task</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const RaciPositionSelector: React.FC<{
  taskId: string | null;
  role: 'R' | 'A' | 'C' | 'I' | null;
  positions: Position[];
  employees: Employee[];
  onSelect: (positionId: string, employeeId: string) => void;
  onCancel: () => void;
}> = ({ taskId, role, positions, employees, onSelect, onCancel }) => {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  if (!taskId || !role) return null;

  const roleLabels = {
    'R': 'Người thực hiện',
    'A': 'Người chịu trách nhiệm',
    'C': 'Người tham vấn',
    'I': 'Người được thông báo'
  } as const;

  const relatedPositions = positions;
  const selectedPosition = selectedPositionId
    ? positions.find(p => p.id === selectedPositionId)
    : null;

  const employeesBySelectedPosition = selectedPositionId && selectedPosition
    ? employees.filter(e => {
      const matchById = (e.primaryPositionId === selectedPositionId) || (e.positionId === selectedPositionId);
      const matchByName = e.position === selectedPosition.name;
      return matchById || matchByName;
    })
    : [];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-sm text-slate-500 mb-1">Chọn chức vụ cho vai trò</div>
        <div className="text-base font-semibold text-slate-900">{roleLabels[role]}</div>
      </div>

      {!selectedPositionId ? (
        <div className="max-h-80 overflow-y-auto">
          {relatedPositions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Không có chức vụ khả dụng</div>
          ) : (
            <div className="space-y-1">
              {relatedPositions.map(pos => (
                <button
                  key={pos.id}
                  onClick={() => setSelectedPositionId(pos.id)}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  {pos.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Chọn nhân viên thuộc chức vụ này</div>
            <Button variant="secondary" onClick={() => setSelectedPositionId(null)}>Quay lại</Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {employeesBySelectedPosition.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Không có nhân viên phù hợp</div>
            ) : (
              <div className="space-y-1">
                {employeesBySelectedPosition.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => onSelect(selectedPositionId, emp.id)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.position}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onCancel}>Hủy</Button>
      </div>
    </div>
  );
};

const TabRaciView: React.FC<{
  isMobile: boolean;
  currentUser: Employee;
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
  setRaciData: React.Dispatch<React.SetStateAction<RaciMatrix[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  employees: Employee[];
  positions: Position[];
  handleRaciChange: (taskId: string, newRole: RaciRole | '') => Promise<void>;
  selectedProjectId: string | null;
  period: 'week' | 'month' | 'quarter' | 'year';
  computePeriodHours: (task: Task) => number;
  periodLabel: string;
}> = ({
  isMobile,
  currentUser,
  projects,
  tasks,
  raciData,
  setRaciData: _setRaciData,
  setTasks: _setTasks,
  employees,
  positions = [],
  handleRaciChange,
  selectedProjectId,
  period,
  computePeriodHours,
  periodLabel,
}) => {
    const [raciModal, setRaciModal] = useState<{
      open: boolean;
      taskId: string | null;
      role: 'R' | 'A' | 'C' | 'I' | null;
    }>({
      open: false,
      taskId: null,
      role: null,
    });

    const [optimisticRaciData, setOptimisticRaciData] = useState<RaciMatrix[]>(raciData);
    const [loadingStates, setLoadingStates] = useState<Map<string, Set<string>>>(new Map());
    const [previousStateSnapshot, setPreviousStateSnapshot] = useState<RaciMatrix[]>([]);

    const positionsById = useMemo(() => {
      const map: Record<string, Position> = {};
      (positions || []).forEach(p => { map[p.id] = p; });
      return map;
    }, [positions]);

    useEffect(() => {
      setOptimisticRaciData(raciData);
    }, [raciData]);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const selectedProject = selectedProjectId
      ? projects.find((p) => p.id === selectedProjectId)
      : null;

    const groupedTasks = useMemo(() => {
      const groups: Record<string, Task[]> = {};
      tasks.forEach(task => {
        const groupName = task.groupName || 'Khác';
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(task);
      });
      return groups;
    }, [tasks]);

    const toggleGroup = (groupName: string) => {
      setExpandedGroups(prev => {
        const next = new Set(prev);
        if (next.has(groupName)) {
          next.delete(groupName);
        } else {
          next.add(groupName);
        }
        return next;
      });
    };

    const getPositionsForRole = (task: Task, role: RaciRole) => {
      const taskRaciAssignments = optimisticRaciData.filter(r => r.taskId === task.id);
      return taskRaciAssignments
        .filter(assignment => assignment.role === role)
        .map(assignment => ({
          id: assignment.id,
          positionId: assignment.positionId,
          positionName: assignment.positionName && assignment.positionName.trim().length > 0
            ? assignment.positionName
            : '[Missing Position]',
          role: assignment.role
        }));
    };

    const isTaskRoleLoading = (taskId: string, role: string) => {
      const taskLoading = loadingStates.get(taskId);
      return taskLoading ? taskLoading.has(role) : false;
    };

    const setTaskRoleLoading = (taskId: string, role: string, loading: boolean) => {
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(taskId)) {
          newMap.set(taskId, new Set());
        }
        const roleSet = newMap.get(taskId)!;
        if (loading) {
          roleSet.add(role);
        } else {
          roleSet.delete(role);
          if (roleSet.size === 0) {
            newMap.delete(taskId);
          }
        }
        return newMap;
      });
    };

    const getRoleCount = (taskId: string, role: RaciRole) => {
      return optimisticRaciData.filter(r => r.taskId === taskId && r.role === role).length;
    };

    const canAddRole = (taskId: string, role: RaciRole): boolean => {
      if (role === ('A' as RaciRole)) {
        return getRoleCount(taskId, 'A' as RaciRole) === 0;
      }
      return true;
    };

    const canRemoveRole = (taskId: string, role: RaciRole): boolean => {
      if (role === ('R' as RaciRole)) {
        return getRoleCount(taskId, 'R' as RaciRole) > 1;
      }
      if (role === ('A' as RaciRole)) {
        return getRoleCount(taskId, 'A' as RaciRole) > 1;
      }
      return true;
    };

    const getActionDisabledReason = (taskId: string, role: RaciRole, action: 'add' | 'remove'): string | null => {
      if (action === 'add' && role === ('A' as RaciRole) && getRoleCount(taskId, 'A' as RaciRole) >= 1) {
        return 'Task đã có Người chịu trách nhiệm';
      }
      if (action === 'remove' && role === ('R' as RaciRole) && getRoleCount(taskId, 'R' as RaciRole) <= 1) {
        return 'Task phải có ít nhất 1 Người thực hiện';
      }
      if (action === 'remove' && role === ('A' as RaciRole) && getRoleCount(taskId, 'A' as RaciRole) <= 1) {
        return 'Task phải có đúng 1 Người chịu trách nhiệm';
      }
      return null;
    };

    const addPositionToRole = (taskId: string, role: RaciRole) => {
      setRaciModal({
        open: true,
        taskId,
        role,
      });
    };

    const handleEmployeeAssignment = async (positionId: string, _employeeId: string) => {
      if (!raciModal.taskId || !raciModal.role) return;

      const taskId = raciModal.taskId;
      const role = raciModal.role as RaciRole;

      if (!canAddRole(taskId, role)) {
        setRaciModal({ open: false, taskId: null, role: null });
        return;
      }

      const loadingKey = `${role} -${positionId} `;

      setPreviousStateSnapshot([...optimisticRaciData]);
      setTaskRoleLoading(taskId, loadingKey, true);
      const positionName = positionsById[positionId]?.name || '';
      const tempId = `tmp - ${Date.now()} -${Math.random().toString(36).slice(2, 6)} `;
      setOptimisticRaciData(prev => ([
        ...prev,
        { id: tempId, taskId, positionId, positionName, role: role as RaciRole }
      ]));
      setRaciModal({ open: false, taskId: null, role: null });

      try {
        const created = await raciApi.create({ taskId, positionId, role: role as RaciRole });
        setOptimisticRaciData(prev => prev.map(r => (r.id === tempId ? { ...r, id: created.id, positionName: created.positionName || r.positionName } : r)));

        const refreshed = await raciApi.getAll();
        _setRaciData(refreshed);
      } catch (error) {
        setOptimisticRaciData(previousStateSnapshot);
        alert('Lỗi khi gán RACI. Vui lòng thử lại.');
      } finally {
        setTaskRoleLoading(taskId, loadingKey, false);
      }
    };

    const removeEmployeeFromRole = async (taskId: string, employeeId: string) => {
      const emp = employees.find(e => e.id === employeeId);
      const positionId = emp?.primaryPositionId || emp?.positionId;
      const assignment = raciData.find(r => r.taskId === taskId && r.positionId === positionId);
      if (!assignment?.id) return;

      if (!canRemoveRole(assignment.taskId, assignment.role)) {
        return;
      }

      const loadingKey = `remove - ${positionId} `;
      setPreviousStateSnapshot([...optimisticRaciData]);
      setTaskRoleLoading(assignment.taskId, loadingKey, true);

      setOptimisticRaciData(prev => prev.filter(r => !(r.taskId === taskId && r.positionId === positionId)));

      try {
        await raciApi.delete(assignment.id);
        const refreshed = await raciApi.getAll();
        _setRaciData(refreshed);
      } catch (error) {
        setOptimisticRaciData(previousStateSnapshot);
        alert('Lỗi khi xóa gán RACI. Vui lòng thử lại.');
      } finally {
        setTaskRoleLoading(assignment.taskId, loadingKey, false);
      }
    };

    const removePositionFromRole = async (assignmentId: string | number) => {
      const assignment = raciData.find(r => r.id === assignmentId);
      if (!assignment?.id) return;

      if (!canRemoveRole(assignment.taskId, assignment.role)) {
        return;
      }

      const loadingKey = `remove - ${assignment.id} `;
      setPreviousStateSnapshot([...optimisticRaciData]);
      setTaskRoleLoading(assignment.taskId, loadingKey, true);

      setOptimisticRaciData(prev => prev.filter(r => !(r.id === assignment.id)));

      try {
        await raciApi.delete(assignment.id);
        const refreshed = await raciApi.getAll();
        _setRaciData(refreshed);
      } catch (error) {
        setOptimisticRaciData(previousStateSnapshot);
        alert('Lỗi khi xóa gán RACI. Vui lòng thử lại.');
      } finally {
        setTaskRoleLoading(assignment.taskId, loadingKey, false);
      }
    };

    if (!selectedProjectId) {
      return (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-600">
          Vui lòng chọn dự án ở tab Thông tin chung
        </div>
      );
    }

    if (!selectedProject || tasks.length === 0) {
      return (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-600">
            {selectedProject ? 'Không có task nào trong dự án này.' : 'Không tìm thấy dự án.'}
          </p>
        </div>
      );
    }

    const roleColors = {
      R: '#ef4444',
      A: '#f97316',
      C: '#3b82f6',
      I: '#6b7280'
    };

    if (isMobile) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Dự án:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
              {selectedProject.name}
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="space-y-3">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center gap-3 bg-slate-200 rounded-lg px-4 py-3 hover:bg-slate-300 transition-colors"
                >
                  <span className="text-slate-700 text-lg">
                    {expandedGroups.has(groupName) ? '▼' : '▶'}
                  </span>
                  <h3 className="font-semibold text-slate-800 text-left flex-1">{groupName}</h3>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-700 text-xs font-semibold">
                    {groupTasks.length}
                  </span>
                </button>

                {expandedGroups.has(groupName) && groupTasks.map((task, taskIndex) => (
                  <div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 hover:border-slate-300 hover:shadow-md transition-all">
                    <div>
                      <h4 className="font-semibold text-slate-900">{task.name}</h4>
                      <p className="text-sm text-slate-500">
                        {task.frequency}
                        {task.estimatedHours && task.estimatedHours > 0 && (
                          <span className="ml-2 text-xs text-slate-400">• {task.estimatedHours}h ước tính</span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {(['R', 'A', 'C', 'I'] as RaciRole[]).map((role) => {
                        const assignedPositions = getPositionsForRole(task, role);
                        return (
                          <div key={role} className="space-y-2">
                            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                              {role === 'R' && 'Người thực hiện'}
                              {role === 'A' && 'Người chịu trách nhiệm'}
                              {role === 'C' && 'Người tham vấn'}
                              {role === 'I' && 'Người được thông báo'}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {assignedPositions.map((position) => {
                                const disabledReason = getActionDisabledReason(task.id, role, 'remove');
                                return (
                                  <span
                                    key={`${position.id} `}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                                    style={{ backgroundColor: roleColors[role] }}
                                    title={disabledReason || ''}
                                  >
                                    {position.positionName}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removePositionFromRole(position.id!);
                                      }}
                                      disabled={isTaskRoleLoading(task.id, `remove - ${position.id} `) || !!disabledReason}
                                      title={disabledReason || 'Xóa'}
                                      className={`font - bold text - sm leading - none ${isTaskRoleLoading(task.id, `remove-${position.id}`) || disabledReason
                                          ? 'text-white/40 cursor-not-allowed'
                                          : 'text-white/80 hover:text-white cursor-pointer'
                                        } `}
                                      style={{ pointerEvents: 'auto' }}
                                    >
                                      {isTaskRoleLoading(task.id, `remove - ${position.id} `) ? '⋯' : '×'}
                                    </button>
                                  </span>
                                );
                              })}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addPositionToRole(task.id, role);
                                }}
                                disabled={isTaskRoleLoading(task.id, `${role} -add`) || !canAddRole(task.id, role)}
                                title={getActionDisabledReason(task.id, role, 'add') || 'Thêm'}
                                className={`inline - flex items - center justify - center w - 7 h - 7 rounded - full border - 2 border - dashed transition - colors font - bold ${isTaskRoleLoading(task.id, `${role}-add`) || !canAddRole(task.id, role)
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 cursor-pointer'
                                  } `}
                                style={{ pointerEvents: 'auto', zIndex: 10 }}
                              >
                                {isTaskRoleLoading(task.id, `${role} -add`) ? '⋯' : '+'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <Modal
            isOpen={raciModal.open}
            onClose={() => setRaciModal({ open: false, taskId: null, role: null })}
            title={`Gán ${raciModal.role} cho Task`}
            maxWidth="max-w-md"
          >
            <RaciPositionSelector
              taskId={raciModal.taskId}
              role={raciModal.role}
              positions={positions}
              employees={employees}
              onSelect={handleEmployeeAssignment}
              onCancel={() => setRaciModal({ open: false, taskId: null, role: null })}
            />
          </Modal>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Dự án:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
            {selectedProject.name}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/4">Công việc</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/8">Tần suất</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/8">Giờ/{periodLabel}</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/8">Người thực hiện (R)</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/8">Người chịu trách nhiệm (A)</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/8">Người tham vấn (C)</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700 text-sm uppercase tracking-wide w-1/8">Người được thông báo (I)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <React.Fragment key={groupName}>
                  <tr className="bg-slate-200 hover:bg-slate-300 cursor-pointer transition-colors border-t border-b border-slate-300">
                    <td colSpan={7} className="px-6 py-4">
                      <button
                        onClick={() => toggleGroup(groupName)}
                        className="flex items-center gap-3 font-semibold text-slate-800 w-full hover:text-slate-900"
                      >
                        <span className="text-slate-700">
                          {expandedGroups.has(groupName) ? '▼' : '▶'}
                        </span>
                        <span className="uppercase tracking-wide text-sm">{groupName}</span>
                        <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-700 text-xs font-semibold">
                          {groupTasks.length}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {expandedGroups.has(groupName) && groupTasks.map((task, index) => (
                    <tr key={task.id} className={`hover: bg - blue - 50 transition - colors ${index !== groupTasks.length - 1 ? 'border-b border-slate-100' : 'border-b border-slate-200'} `}>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <div>
                          <div className="font-semibold text-slate-900">{task.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-slate-100">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {TaskFrequencyLabels[task.frequency as TaskFrequency] || task.frequency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-slate-100">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          ~{computePeriodHours(task).toFixed(1)}h
                        </span>
                      </td>
                      {(['R', 'A', 'C', 'I'] as RaciRole[]).map((role) => {
                        const assignedPositions = getPositionsForRole(task, role);
                        return (
                          <td key={role} className="px-6 py-4 text-center border-r border-slate-100">
                            <div className="flex flex-wrap justify-center gap-2">
                              {assignedPositions.map((position) => {
                                const disabledReason = getActionDisabledReason(task.id, role, 'remove');
                                return (
                                  <span
                                    key={`${position.id} `}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm group"
                                    style={{ backgroundColor: roleColors[role] }}
                                    title={disabledReason || ''}
                                  >
                                    {position.positionName}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removePositionFromRole(position.id!);
                                      }}
                                      disabled={isTaskRoleLoading(task.id, `remove - ${position.id} `) || !!disabledReason}
                                      title={disabledReason || 'Xóa'}
                                      className={`ml - 1 font - bold text - sm leading - none ${isTaskRoleLoading(task.id, `remove-${position.id}`) || disabledReason
                                          ? 'text-white/40 cursor-not-allowed'
                                          : 'text-white/80 hover:text-white cursor-pointer'
                                        } `}
                                      style={{ pointerEvents: 'auto' }}
                                    >
                                      {isTaskRoleLoading(task.id, `remove - ${position.id} `) ? '⋯' : '×'}
                                    </button>
                                  </span>
                                );
                              })}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addPositionToRole(task.id, role);
                                }}
                                disabled={isTaskRoleLoading(task.id, `${role} -add`) || !canAddRole(task.id, role)}
                                title={getActionDisabledReason(task.id, role, 'add') || 'Thêm'}
                                className={`inline - flex items - center justify - center w - 7 h - 7 rounded - full border - 2 border - dashed transition - colors font - bold ${isTaskRoleLoading(task.id, `${role}-add`) || !canAddRole(task.id, role)
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 cursor-pointer'
                                  } `}
                                style={{ pointerEvents: 'auto', zIndex: 10 }}
                              >
                                {isTaskRoleLoading(task.id, `${role} -add`) ? '⋯' : '+'}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={raciModal.open}
          onClose={() => setRaciModal({ open: false, taskId: null, role: null })}
          title={`Gán ${raciModal.role} cho Task`}
          maxWidth="max-w-md"
        >
          <RaciPositionSelector
            taskId={raciModal.taskId}
            role={raciModal.role}
            positions={positions}
            employees={employees}
            onSelect={handleEmployeeAssignment}
            onCancel={() => setRaciModal({ open: false, taskId: null, role: null })}
          />
        </Modal>
      </div>
    );
  };

// --- 2. MY TASKS (CRUD + Wizard) ---
const MyTasks: React.FC<UserPortalProps> = ({ currentUser, projects, tasks, positions, setTasks, employees, raciData, setRaciData, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'raci'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isRaciModalOpen, setIsRaciModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [frequencyFilter, setFrequencyFilter] = useState<TaskFrequency | 'all'>('all');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const userPositionId = currentUser.primaryPositionId || currentUser.positionId || null;
  const myTasks = tasks.filter(t =>
    t.creatorId === currentUser.id ||
    (userPositionId ? t.raciAssignments?.some(r => r.positionId === userPositionId) : false)
  );

  const filteredByFrequency = frequencyFilter === 'all'
    ? myTasks
    : myTasks.filter(t => t.frequency === frequencyFilter);

  const projectsWithMyTasks = projects.filter((p) => filteredByFrequency.some((t) => t.projectId === p.id));
  const filteredTasks = selectedProjectId
    ? filteredByFrequency.filter((t) => t.projectId === selectedProjectId)
    : filteredByFrequency;

  const openRaciEditor = (task: Task) => {
    setEditingTask(task);
    setIsRaciModalOpen(true);
  };

  const handleRaciChange = async (taskId: string, newRole: RaciRole | '') => {
    try {
      const myPosId = currentUser.primaryPositionId || currentUser.positionId;
      const existing = raciData.find(r => r.taskId === taskId && r.positionId === myPosId);

      if (newRole === '') {
        if (existing?.id !== undefined) {
          await raciApi.delete(existing.id);
        }
      } else if (!existing) {
        await raciApi.create({ taskId, positionId: myPosId!, role: newRole as RaciRole });
      } else if (existing.id !== undefined && existing.role !== newRole) {
        await raciApi.update(existing.id, { role: newRole as RaciRole });
      }

      const refreshed = await raciApi.getAll();
      setRaciData(refreshed);
    } catch (error) {
      // No-op
    }
  };

  const periodLabel: Record<typeof period, string> = {
    week: 'tuần',
    month: 'tháng',
    quarter: 'quý',
    year: 'năm',
  };

  const computePeriodHours = (task: Task) => {
    const hoursPerExecution = Number(task.estimatedHours ?? 0);
    const freq = task.frequency as TaskFrequency;
    const multipliers: Record<TaskFrequency, Record<typeof period, number>> = {
      [TaskFrequency.Daily]: { week: 5, month: 22, quarter: 65, year: 260 },
      [TaskFrequency.Weekly]: { week: 1, month: 4.33, quarter: 13, year: 52 },
      [TaskFrequency.Monthly]: { week: 0.25, month: 1, quarter: 3, year: 12 },
      [TaskFrequency.Quarterly]: { week: 0.0769, month: 0.333, quarter: 1, year: 4 },
      [TaskFrequency.Yearly]: { week: 0.0192, month: 0.0833, quarter: 0.25, year: 1 },
      [TaskFrequency.AdHoc]: { week: 1, month: 1, quarter: 1, year: 1 },
    };
    const multiplier = multipliers[freq]?.[period] ?? 0;
    return hoursPerExecution * multiplier;
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-slate-800">Quản lý Task Của Tôi</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-600">Tần suất:</label>
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter((e.target.value as TaskFrequency) || 'all')}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">Tất cả</option>
            {Object.entries(TaskFrequencyLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <label className="text-sm text-slate-600">Kỳ xem:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
            <option value="quarter">Theo quý</option>
            <option value="year">Theo năm</option>
          </select>
          <Button onClick={() => onNavigate('add_task')}><Plus className="w-4 h-4 mr-2" /> Thêm Task</Button>
        </div>
      </div>

      <TabsHeader activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'projects' ? (
        <TabProjectsOverview
          projects={projectsWithMyTasks}
          myTasks={myTasks}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            setActiveTab('raci');
          }}
        />
      ) : (
        <TabRaciView
          isMobile={isMobile}
          currentUser={currentUser}
          projects={projects}
          tasks={filteredTasks}
          raciData={raciData}
          setRaciData={setRaciData}
          setTasks={setTasks}
          employees={employees}
          positions={positions}
          handleRaciChange={handleRaciChange}
          selectedProjectId={selectedProjectId}
          period={period}
          computePeriodHours={computePeriodHours}
          periodLabel={periodLabel[period]}
        />
      )}

      <Modal isOpen={isRaciModalOpen} onClose={() => setIsRaciModalOpen(false)} title={`Gán RACI: ${editingTask?.name} `} maxWidth="max-w-2xl">
        {editingTask && (
          <RaciEditor task={editingTask} currentUser={currentUser} employees={employees} raciData={raciData} setRaciData={setRaciData} onClose={() => setIsRaciModalOpen(false)} />
        )}
      </Modal>
    </div>
  );
};

// --- 3. MY RACI (View Only) ---
const MyRaci: React.FC<UserPortalProps> = ({ currentUser, tasks, raciData, projects }) => {
  const [activeTab, setActiveTab] = useState<Role>('R');

  const myRaciRows = raciData.filter(r => r.positionId === (currentUser.primaryPositionId || currentUser.positionId) && r.role === activeTab);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Vai Trò Của Tôi (RACI Matrix)</h2>

      {/* Role Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-1">
        {(['R', 'A', 'C', 'I'] as Role[]).map(role => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`px - 6 py - 2 text - sm font - bold rounded - t - lg transition - colors border - b - 2 ${activeTab === role
                ? (role === 'R' ? 'text-red-600 border-red-500 bg-red-50' : role === 'A' ? 'text-amber-600 border-amber-500 bg-amber-50' : role === 'C' ? 'text-cyan-600 border-cyan-500 bg-cyan-50' : 'text-slate-600 border-slate-500 bg-slate-50')
                : 'text-slate-500 border-transparent hover:text-slate-700'
              } `}
          >
            {role === 'R' && 'Responsible (Người làm)'}
            {role === 'A' && 'Accountable (Người duyệt)'}
            {role === 'C' && 'Consulted (Tham vấn)'}
            {role === 'I' && 'Informed (Được báo)'}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {myRaciRows.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic">Không có task nào bạn đóng vai trò này.</div>
        ) : (
          myRaciRows.map((r, idx) => {
            const task = tasks.find(t => t.id === r.taskId);
            const project = projects.find(p => p.id === task?.projectId);
            if (!task) return null;

            return (
              <Card key={idx} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="w-12 shrink-0">
                  <RaciChip role={activeTab} className="w-10 h-10 text-lg" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">{project?.name}</div>
                  <div className="text-lg font-medium text-slate-900">{task.name}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {task.frequency} • {task.groupId}
                    {task.estimatedHours && task.estimatedHours > 0 && (
                      <span className="ml-2">• {task.estimatedHours}h</span>
                    )}
                  </div>
                </div>
                <div className="text-sm bg-slate-100 px-3 py-2 rounded-lg text-slate-600 max-w-xs">
                  {activeTab === 'R' && "Bạn chịu trách nhiệm chính thực hiện task này."}
                  {activeTab === 'A' && "Bạn chịu trách nhiệm giải trình và phê duyệt kết quả."}
                  {activeTab === 'C' && "Bạn cần cung cấp thông tin/tư vấn khi được hỏi."}
                  {activeTab === 'I' && "Bạn sẽ nhận được thông báo về tiến độ/kết quả."}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- 4. USER PROFILE ---
const UserProfile: React.FC<UserPortalProps> = ({ currentUser, employees }) => {
  const manager = employees.find(e => e.id === currentUser.managerId);
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white flex items-center gap-6 shadow-lg">
        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/50">
          {currentUser.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{currentUser.name}</h2>
          <p className="opacity-90">{currentUser.position} • {currentUser.department}</p>
        </div>
      </div>

      <Card title="Thông tin chi tiết">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
            <div className="text-slate-500 text-sm">Mã nhân viên</div>
            <div className="col-span-2 font-medium text-slate-900">{currentUser.id}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
            <div className="text-slate-500 text-sm">Phòng ban</div>
            <div className="col-span-2 font-medium text-slate-900">{currentUser.department}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
            <div className="text-slate-500 text-sm">Chức vụ</div>
            <div className="col-span-2 font-medium text-slate-900">{currentUser.position}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 pb-1">
            <div className="text-slate-500 text-sm">Quản lý trực tiếp</div>
            <div className="col-span-2 font-medium text-slate-900">
              {manager ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                    {manager.name.charAt(0)}
                  </div>
                  {manager.name}
                </div>
              ) : 'N/A'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- 5. USER EMPLOYEES VIEW ---
const UserEmployeesView: React.FC<UserPortalProps & { onRefresh: () => void }> = ({ employees, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', position: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await employeeApi.create(form);
      setIsAddModalOpen(false);
      setForm({ name: '', department: '', position: '' });
      onRefresh();
    } catch (error) {
      alert('Lỗi khi thêm nhân viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Danh sách nhân viên</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức vụ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm nhân viên mới">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Họ tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phòng ban" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          <Input label="Chức vụ" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting}>Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- HELPER COMPONENT: RACI EDITOR FOR USER ---
const RaciEditor = ({ task, currentUser, employees, raciData, setRaciData, onClose }: { task: Task, currentUser: Employee, employees: Employee[], raciData: RaciMatrix[], setRaciData: any, onClose: () => void }) => {
  const [localRaci, setLocalRaci] = useState<RaciMatrix[]>(raciData.filter(r => r.taskId === task.id));

  const updateRole = (posId: string, role: Role | 'NONE') => {
    // Only allow editing if I am the creator (Already filtered by parent, but safety check)
    // In this simpler User view, we let them edit anyone's role for THEIR task.
    if (role === 'NONE') {
      setLocalRaci(prev => prev.filter(r => r.positionId !== posId));
    } else {
      setLocalRaci(prev => {
        const others = prev.filter(r => r.positionId !== posId);
        const positionName = employees.find(e => e.primaryPositionId === posId || e.positionId === posId)?.position || '';
        return [...others, { taskId: task.id, positionId: posId, positionName, role: role as RaciRole }];
      });
    }
  };

  const handleSave = async () => {
    try {
      const existing = raciData.filter(r => r.taskId === task.id);
      const existingByPos = new Map<string, RaciMatrix>();
      existing.forEach(r => existingByPos.set(r.positionId, r));

      const desiredPos = new Set<string>();

      for (const r of localRaci) {
        desiredPos.add(r.positionId!);
        const curr = existingByPos.get(r.positionId!);
        if (!curr) {
          await raciApi.create({ taskId: r.taskId, positionId: r.positionId!, role: r.role });
        } else if (curr.id !== undefined && curr.role !== r.role) {
          await raciApi.update(curr.id, { role: r.role });
        }
      }

      for (const curr of existing) {
        if (!desiredPos.has(curr.positionId) && curr.id !== undefined) {
          await raciApi.delete(curr.id);
        }
      }

      const refreshed = await raciApi.getAll();
      setRaciData(refreshed);
    } catch (error) {
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-2">
        Bạn đang gán RACI cho task: <strong>{task.name}</strong>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-2 border-t border-b py-2">
        {employees.map(emp => {
          const empPosId = emp.primaryPositionId || emp.positionId;
          const currentRole = localRaci.find(r => r.positionId === empPosId)?.role || 'NONE';
          const isMe = emp.id === currentUser.id;
          return (
            <div key={emp.id} className={`flex items - center justify - between p - 2 rounded ${isMe ? 'bg-slate-50 border border-slate-200' : 'hover:bg-white'} `}>
              <div>
                <div className="font-medium text-sm flex items-center">
                  {emp.name} {isMe && <span className="ml-2 text-[10px] bg-slate-200 px-1 rounded text-slate-600">YOU</span>}
                </div>
                <div className="text-xs text-gray-500">{emp.position}</div>
              </div>
              <div className="flex space-x-1 scale-90 origin-right">
                {['R', 'A', 'C', 'I'].map((role) => (
                  <button
                    key={role}
                    onClick={() => updateRole(emp.primaryPositionId || emp.positionId || emp.id, currentRole === role ? 'NONE' : role as Role)}
                    className={`w - 8 h - 8 rounded - full text - xs font - bold transition - all ${currentRole === role ?
                        (role === 'R' ? 'bg-red-500 text-white shadow-md scale-110' : role === 'A' ? 'bg-amber-500 text-white shadow-md scale-110' : role === 'C' ? 'bg-cyan-500 text-white shadow-md scale-110' : 'bg-slate-500 text-white shadow-md scale-110')
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      } `}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave}>Lưu Cập Nhật</Button>
      </div>
    </div>
  );
};


// --- MAIN EXPORT ---
export const UserPortal: React.FC<UserPortalProps> = (props) => {
  const { view } = props;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      {view === 'dashboard' && <UserDashboard {...props} />}
      {view === 'my_tasks' && <MyTasks {...props} />}
      {view === 'my_raci' && <MyRaci {...props} />}
      {view === 'profile' && <UserProfile {...props} />}
      {view === 'employees' && (
        <UserEmployeesView
          {...props}
          onRefresh={async () => {
            // This is a hack to refresh data in the parent App.tsx
            // In a real app, we'd use a context or global state
            window.location.reload();
          }}
        />
      )}
      {!['dashboard', 'my_tasks', 'my_raci', 'profile', 'employees'].includes(view) && <div>Page not found</div>}
    </div>
  );
};
