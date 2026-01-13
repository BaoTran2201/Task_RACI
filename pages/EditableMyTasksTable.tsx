import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { Employee, Project, Task, RaciMatrix, Role } from '../types';
import { RaciRole } from '../src/types/enums';
import { taskApi, raciApi } from '../src/services/api';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { Check, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InlineEditEstimatedHours } from '../components/InlineEditEstimatedHours';
import { EstimatedHoursHistoryDrawer } from '../components/EstimatedHoursHistoryDrawer';

interface EditableMyTasksTableProps {
  currentUser: Employee;
  tasks: Task[];
  projects: Project[];
  employees: Employee[];
  raciData: RaciMatrix[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setRaciData: React.Dispatch<React.SetStateAction<RaciMatrix[]>>;
}

interface DraftTask extends Task {
  _isDirty?: boolean;
}

export const EditableMyTasksTable: React.FC<EditableMyTasksTableProps> = ({
  currentUser,
  tasks,
  projects,
  employees,
  raciData,
  setTasks,
  setRaciData,
}) => {
  // We rely on the parent (UserPortal) to filter tasks if needed, 
  // but EditableMyTasksTable currently filters again. Let's ensure consistency.
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);
  const [draftRaci, setDraftRaci] = useState<RaciMatrix[]>([]);

  // Sync with props
  useEffect(() => {
    setDraftTasks(tasks.filter(t => t.creatorId === currentUser.id).map(t => ({ ...t })));
  }, [tasks, currentUser.id]);

  useEffect(() => {
    setDraftRaci(raciData);
  }, [raciData]);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddPartnerDialog, setShowAddPartnerDialog] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');

  // Drawer State for Estimated Hours History
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);

  const [groupMaster, setGroupMaster] = useState<string[]>([]);
  const [partnerMaster, setPartnerMaster] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tgRes = await fetch('/data/tasks/task-groups.json');
        if (tgRes.ok) {
          const tgJson = await tgRes.json();
          const names = Array.isArray(tgJson?.data) ? tgJson.data.map((g: any) => g.name).filter(Boolean) : [];
          if (!cancelled) setGroupMaster(names);
        }
      } catch { }
      try {
        const pRes = await fetch('/data/master/partners.json');
        if (pRes.ok) {
          const pJson = await pRes.json();
          const names = Array.isArray(pJson?.data) ? pJson.data.map((p: any) => p.name).filter(Boolean) : [];
          if (!cancelled) setPartnerMaster(names);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);

  const groupOptions = useMemo(() => {
    const fromDraft = draftTasks.map(t => t.groupName).filter(Boolean) as string[];
    const uniq = Array.from(new Set([...groupMaster, ...fromDraft]));
    return uniq.map(g => ({ value: g, label: g }));
  }, [draftTasks, groupMaster]);

  const partnerOptions = useMemo(() => {
    const fromDraft = draftTasks.map(t => t.partner).filter(Boolean) as string[];
    const uniq = Array.from(new Set([...partnerMaster, ...fromDraft]));
    return uniq.map(p => ({ value: p, label: p }));
  }, [draftTasks, partnerMaster]);

  const projectOptions = useMemo(() => projects.map(p => ({ value: p.id, label: p.name })), [projects]);

  const frequencyOptions = ['Hàng ngày', 'Hàng tuần', 'Hàng tháng', 'Hàng năm', 'Khi phát sinh'];

  const hasDirtyChanges = useMemo(() => {
    return (
      draftTasks.some(dt => {
        const orig = tasks.find(t => t.id === dt.id);
        return (
          orig &&
          (orig.name !== dt.name ||
            orig.groupName !== dt.groupName ||
            orig.frequency !== dt.frequency ||
            orig.partner !== dt.partner ||
            orig.projectId !== dt.projectId)
        );
      }) ||
      JSON.stringify(draftRaci) !== JSON.stringify(raciData)
    );
  }, [draftTasks, tasks, draftRaci, raciData]);

  const updateDraftTask = (taskId: string, patch: Partial<Task>) => {
    setDraftTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, ...patch, _isDirty: true } : t
      )
    );
  };

  const handleRaciChange = (taskId: string, newRole: Role | '') => {
    const myPosId = currentUser.primaryPositionId || currentUser.positionId || '';
    if (newRole === '') {
      setDraftRaci(prev => prev.filter(r => !(r.taskId === taskId && r.positionId === myPosId)));
    } else {
      setDraftRaci(prev => {
        const filtered = prev.filter(r => !(r.taskId === taskId && r.positionId === myPosId));
        return [...filtered, { taskId, positionId: myPosId, role: newRole }] as RaciMatrix[];
      });
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

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    if (editingTaskId) {
      updateDraftTask(editingTaskId, { groupName: newGroupName.trim() });
    }
    setShowAddGroupDialog(false);
    setNewGroupName('');
    setEditingTaskId(null);
    setEditingCellId(null);
  };

  const handleAddPartner = () => {
    if (!newPartnerName.trim()) return;
    if (editingTaskId) {
      updateDraftTask(editingTaskId, { partner: newPartnerName.trim() });
    }
    setShowAddPartnerDialog(false);
    setNewPartnerName('');
    setEditingTaskId(null);
    setEditingCellId(null);
  };

  const handleSaveAll = async () => {
    try {
      setSaveError(null);
      setSaveSuccess(false);
      setSavingAll(true);

      const changedTasks = draftTasks.filter(dt => {
        const orig = tasks.find(t => t.id === dt.id);
        return (
          orig &&
          (orig.name !== dt.name ||
            orig.groupName !== dt.groupName ||
            orig.frequency !== dt.frequency ||
            orig.partner !== dt.partner ||
            orig.projectId !== dt.projectId)
        );
      });

      for (const task of changedTasks) {
        await taskApi.update(task.id, {
          name: task.name,
          groupName: task.groupName,
          frequency: task.frequency,
          note: task.note,
          partner: task.partner,
          projectId: task.projectId,
        });
      }

      const existingByKey = new Map<string, { id?: string | number; role: Role }>();
      raciData.forEach(r => {
        const key = `${r.taskId}|${r.positionId}`;
        existingByKey.set(key, { id: r.id, role: r.role });
      });

      const desiredKeys = new Set<string>();
      for (const r of draftRaci) {
        const key = `${r.taskId}|${r.positionId}`;
        desiredKeys.add(key);
        const existing = existingByKey.get(key);

        if (existing) {
          if (existing.role !== r.role && existing.id !== undefined) {
            await raciApi.update(existing.id, { role: r.role });
          }
        } else {
          // If we are creating, use positionId from r (which came from handleRaciChange)
          await raciApi.create({
            taskId: r.taskId,
            positionId: r.positionId!,
            role: r.role as RaciRole
          });
        }
      }

      // deletions
      for (const [key, value] of existingByKey.entries()) {
        if (!desiredKeys.has(key) && value.id !== undefined) {
          await raciApi.delete(value.id);
        }
      }

      const [refreshedTasks, refreshedRaci] = await Promise.all([
        taskApi.getAll(),
        raciApi.getAll(),
      ]);
      setTasks(refreshedTasks);
      setRaciData(refreshedRaci);

      localStorage.removeItem('ds_tasks_draft');
      localStorage.removeItem('ds_raci_draft');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setSavingAll(false);
    }
  };

  const getRaciBadgeClass = (role: Role): string => {
    switch (role) {
      case 'R': return 'bg-red-600 text-white';
      case 'A': return 'bg-blue-600 text-white';
      case 'C': return 'bg-green-600 text-white';
      case 'I': return 'bg-slate-600 text-white';
    }
  };

  const renderEditableCell = (
    taskId: string,
    field: 'name' | 'groupName' | 'frequency' | 'partner' | 'projectId',
    value: string | undefined | null
  ) => {
    const cellId = `${taskId}-${field}`;
    const isEditing = editingCellId === cellId;

    if (field === 'name') {
      if (!isEditing) {
        return (
          <td
            onClick={() => setEditingCellId(cellId)}
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold text-slate-800 text-sm">
              {value || '-'}
            </div>
          </td>
        );
      }
      return (
        <td className="px-4 py-3">
          <input
            type="text"
            value={value || ''}
            onChange={e => updateDraftTask(taskId, { name: e.target.value })}
            onBlur={() => setEditingCellId(null)}
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
        </td>
      );
    }

    if (field === 'groupName') {
      if (!isEditing) {
        return (
          <td
            onClick={() => setEditingCellId(cellId)}
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {value || '—'}
            </span>
          </td>
        );
      }

      return (
        <td className="px-4 py-3">
          <Combobox
            value={value || ''}
            onChange={(newValue) => {
              if (newValue === '__add__') {
                setEditingTaskId(taskId);
                setShowAddGroupDialog(true);
              } else {
                updateDraftTask(taskId, { groupName: newValue });
                setEditingCellId(null);
              }
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                displayValue={(val: string) => groupOptions.find(o => o.value === val)?.label || ''}
                autoFocus
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown size={16} className="text-slate-400" />
              </Combobox.Button>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border border-slate-200">
                {[...groupOptions, { value: '__add__', label: '+ Thêm nhóm task' }].map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm ${active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={selected ? 'font-medium' : 'font-normal'}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <Check size={16} />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </td>
      );
    }

    if (field === 'frequency') {
      if (!isEditing) {
        return (
          <td
            onClick={() => setEditingCellId(cellId)}
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {value || '—'}
            </span>
          </td>
        );
      }
      return (
        <td className="px-4 py-3">
          <select
            value={value || ''}
            onChange={e => updateDraftTask(taskId, { frequency: e.target.value as Task['frequency'] })}
            onBlur={() => setEditingCellId(null)}
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          >
            <option value="">-- Chọn --</option>
            {frequencyOptions.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </td>
      );
    }

    if (field === 'partner') {
      if (!isEditing) {
        return (
          <td
            onClick={() => setEditingCellId(cellId)}
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${value ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
              {value || '—'}
            </span>
          </td>
        );
      }

      return (
        <td className="px-4 py-3">
          <Combobox
            value={value || ''}
            onChange={(newValue) => {
              if (newValue === '__add__') {
                setEditingTaskId(taskId);
                setShowAddPartnerDialog(true);
              } else {
                updateDraftTask(taskId, { partner: newValue || null });
                setEditingCellId(null);
              }
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                displayValue={(val: string) => partnerOptions.find(o => o.value === val)?.label || ''}
                autoFocus
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown size={16} className="text-slate-400" />
              </Combobox.Button>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border border-slate-200">
                {[...partnerOptions, { value: '__add__', label: '+ Thêm đối tác' }].map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm ${active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={selected ? 'font-medium' : 'font-normal'}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <Check size={16} />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </td>
      );
    }

    if (field === 'projectId') {
      if (!isEditing) {
        const project = projects.find(p => p.id === value);
        return (
          <td
            onClick={() => setEditingCellId(cellId)}
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {project?.name || '—'}
            </span>
          </td>
        );
      }

      return (
        <td className="px-4 py-3">
          <Combobox
            value={value || ''}
            onChange={(newValue) => {
              updateDraftTask(taskId, { projectId: newValue });
              setEditingCellId(null);
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                displayValue={(val: string) => projectOptions.find(o => o.value === val)?.label || ''}
                autoFocus
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown size={16} className="text-slate-400" />
              </Combobox.Button>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border border-slate-200">
                {projectOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm ${active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={selected ? 'font-medium' : 'font-normal'}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <Check size={16} />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </td>
      );
    }

    return <td className="px-4 py-3 text-slate-400">-</td>;
  };

  return (
    <div className="space-y-4">
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm">{saveError}</span>
        </div>
      )}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700">
          <CheckCircle2 size={20} className="flex-shrink-0" />
          <span className="text-sm">Lưu thành công!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {/* <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100" />
                </th> */}
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Tên task</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nhóm task</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Dự án</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Tần suất</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Đối tác</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Giờ ước tính</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Vai trò của tôi</th>
                <th className="px-4 py-3 text-center font-semibold text-red-700">R</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">A</th>
                <th className="px-4 py-3 text-center font-semibold text-green-700">C</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">I</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {draftTasks.map(task => {
                const myPosId = currentUser.primaryPositionId || currentUser.positionId || '';
                const myRole = draftRaci.find(r => r.taskId === task.id && r.positionId === myPosId)?.role;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100" />
                    </td> */}

                    {renderEditableCell(task.id, 'name', task.name)}
                    {renderEditableCell(task.id, 'groupName', task.groupName)}
                    {renderEditableCell(task.id, 'projectId', task.projectId)}
                    {renderEditableCell(task.id, 'frequency', task.frequency)}
                    {renderEditableCell(task.id, 'partner', task.partner)}

                    <td className="px-4 py-3 text-center">
                      <InlineEditEstimatedHours
                        taskId={task.id}
                        initialValue={task.estimatedHours || 0}
                        canEdit={true}
                        onSave={handleUpdateEstimatedHours}
                        onError={(msg) => setSaveError(msg)}
                        onViewHistory={setHistoryTaskId}
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      {myRole ? (
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold min-w-[40px] ${getRaciBadgeClass(myRole)}`}>
                          {myRole}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        checked={myRole === 'R'}
                        onChange={() => handleRaciChange(task.id, myRole === 'R' ? '' : 'R')}
                        className="w-4 h-4 text-red-600 border-slate-300 focus:ring-2 focus:ring-red-100 cursor-pointer"
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        checked={myRole === 'A'}
                        onChange={() => handleRaciChange(task.id, myRole === 'A' ? '' : 'A')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        checked={myRole === 'C'}
                        onChange={() => handleRaciChange(task.id, myRole === 'C' ? '' : 'C')}
                        className="w-4 h-4 text-green-600 border-slate-300 focus:ring-2 focus:ring-green-100 cursor-pointer"
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        checked={myRole === 'I'}
                        onChange={() => handleRaciChange(task.id, myRole === 'I' ? '' : 'I')}
                        className="w-4 h-4 text-slate-600 border-slate-300 focus:ring-2 focus:ring-slate-100 cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!hasDirtyChanges || savingAll}
          onClick={handleSaveAll}
        >
          {savingAll ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>

      <Transition appear show={showAddGroupDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAddGroupDialog(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900 mb-4">
                    Thêm nhóm task
                  </Dialog.Title>

                  <input
                    type="text"
                    autoFocus
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    placeholder="Tên nhóm task"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                  />

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowAddGroupDialog(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleAddGroup}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={showAddPartnerDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAddPartnerDialog(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900 mb-4">
                    Thêm đối tác
                  </Dialog.Title>

                  <input
                    type="text"
                    autoFocus
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    placeholder="Tên đối tác"
                    value={newPartnerName}
                    onChange={e => setNewPartnerName(e.target.value)}
                  />

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowAddPartnerDialog(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleAddPartner}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <EstimatedHoursHistoryDrawer
        taskId={historyTaskId}
        isOpen={!!historyTaskId}
        onClose={() => setHistoryTaskId(null)}
      />
    </div>
  );
};
