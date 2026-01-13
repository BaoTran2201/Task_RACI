import { useEffect, useMemo, useState } from 'react';
import { Employee, Position, Project, Task } from '../../../../../types';
import { TaskFrequency, TaskFrequencyLabels, RaciRole } from '../../../../../src/types/enums';
import { AddTaskFormErrors, EmployeeRoleContext, TaskErrors, TaskRow } from '../types';
import { taskApi } from '../../../../../src/services/api';
import { CreateTaskRequest } from '../../../../../src/types/api-dto';

interface UseAddTaskFormProps {
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  positions: Position[];
  onSave: (tasks: Task[]) => Promise<void>;
}

export const useAddTaskForm = ({
  currentUser,
  employees,
  projects,
  positions,
  onSave,
}: UseAddTaskFormProps) => {
  const buildDefaultContext = (): EmployeeRoleContext => ({
    departmentId: currentUser.department,
    projectId: projects[0]?.id || '',
    mainPositionId: currentUser.primaryPositionId || currentUser.positionId || '',
    subPositionId: '',
    lineManagerPositionId: currentUser.managerId || '',
    relatedPositionIds: [],
  });

  const [contextForm, setContextForm] = useState<EmployeeRoleContext>(buildDefaultContext());
  const [taskRows, setTaskRows] = useState<TaskRow[]>([
    {
      id: `row-${Date.now()}`,
      groupName: '',
      name: '',
      duration: 1,
      frequency: TaskFrequency.Daily,
      raci: { responsible: null, accountable: null, consulted: null, informed: null },
      partner: '',
    },
  ]);
  const [errors, setErrors] = useState<AddTaskFormErrors>({ context: {}, tasks: {} });

  const departmentOptions = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))),
    [employees]
  );

  const positionOptions = useMemo(
    () => positions.filter(p => p.active),
    [positions]
  );

  const durationOptions = useMemo(() => {
    const arr: { value: number; label: string }[] = [];
    for (let v = 0.5; v <= 8; v += 0.5) {
      const label = v % 1 === 0 ? `${v} giờ` : `${v} giờ`;
      arr.push({ value: v, label });
    }
    return arr;
  }, []);

  // Map TaskFrequency enum to UI labels
  const frequencyOptions: Array<{ value: TaskFrequency; label: string }> = useMemo(
    () => Object.entries(TaskFrequencyLabels).map(([key, label]) => ({
      value: key as TaskFrequency,
      label,
    })),
    []
  );

  const totalHours = useMemo(
    () => taskRows.reduce((sum, row) => sum + (Number(row.duration) || 0), 0),
    [taskRows]
  );

  const [contextCache, setContextCache] = useState<Record<string, EmployeeRoleContext>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const key = `${contextForm.mainPositionId}_${contextForm.projectId}`;
    const cached = contextCache[key];
    if (cached) {
      setContextForm((prev) => ({ ...prev, ...cached }));
    }
  }, [contextForm.mainPositionId, contextForm.projectId, contextCache]);

  const validateContextForm = (): Record<string, string> => {
    const contextErrors: Record<string, string> = {};
    if (!contextForm.departmentId) contextErrors.departmentId = 'Chọn phòng ban';
    if (!contextForm.projectId) contextErrors.projectId = 'Chọn dự án';
    if (!contextForm.mainPositionId) contextErrors.mainPositionId = 'Chọn chức vụ chính';
    if (!contextForm.subPositionId) contextErrors.subPositionId = 'Chọn chức vụ kiêm nhiệm';
    if (!contextForm.lineManagerPositionId) contextErrors.lineManagerPositionId = 'Chọn quản lý trực tiếp';
    if (!contextForm.relatedPositionIds.length) contextErrors.relatedPositionIds = 'Chọn chức vụ liên quan';
    return contextErrors;
  };

  const validateTaskRows = (): TaskErrors => {
    const rowErrors: TaskErrors = {};
    taskRows.forEach((row, idx) => {
      if (!row.name.trim()) rowErrors[`task-${idx}`] = 'Tên task bắt buộc';
      if (!row.duration || row.duration <= 0) rowErrors[`duration-${idx}`] = 'Số giờ phải > 0';
      if (!row.frequency) {
        rowErrors[`frequency-${idx}`] = 'Chọn tần suất';
      } else if (!Object.values(TaskFrequency).includes(row.frequency)) {
        rowErrors[`frequency-${idx}`] = 'Tần suất không hợp lệ';
      }
    });
    return rowErrors;
  };

  const validateForm = () => {
    const contextValidation = validateContextForm();
    const taskValidation = { ...validateTaskRows() };
    setErrors({ context: contextValidation, tasks: taskValidation });
    return !Object.keys(contextValidation).length && !Object.keys(taskValidation).length;
  };

  const resetForm = () => {
    setContextForm(buildDefaultContext());
    setTaskRows([
      {
        id: `row-${Date.now()}`,
        groupName: '',
        name: '',
        duration: 1,
        frequency: TaskFrequency.Daily,
        raci: { responsible: null, accountable: null, consulted: null, informed: null },
        partner: '',
      },
    ]);
    setErrors({ context: {}, tasks: {} });
  };

  const addTaskRow = () => {
    setTaskRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        groupName: '',
        name: '',
        duration: 1,
        frequency: TaskFrequency.Daily,
        raci: { responsible: null, accountable: null, consulted: null, informed: null },
        partner: '',
      },
    ]);
  };

  const updateTaskRow = (id: string, patch: Partial<TaskRow>) => {
    setTaskRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeTaskRow = (id: string) => {
    setTaskRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const submit = async () => {
    // Guard: prevent double submit
    if (isSubmitting) {
      console.warn('[TASK_SUBMIT] Already submitting, ignoring double click');
      return;
    }

    if (!validateForm()) return;

    // Additional defensive validation: ensure all frequencies are valid enums
    for (let i = 0; i < taskRows.length; i++) {
      const freq = taskRows[i].frequency;
      if (!freq || !Object.values(TaskFrequency).includes(freq)) {
        alert(`Dòng ${i + 1}: Tần suất không hợp lệ. Vui lòng chọn lại.`);
        return;
      }
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn tạo ${taskRows.length} task không?`
    );
    if (!confirmed) return;

    const key = `${contextForm.mainPositionId}_${contextForm.projectId}`;
    setContextCache((prev) => ({ ...prev, [key]: contextForm }));

    const createRequests: CreateTaskRequest[] = taskRows.map((row) => {
      const frequency = row.frequency as TaskFrequency;
      if (!Object.values(TaskFrequency).includes(frequency)) {
        throw new Error(`Invalid frequency for task "${row.name}": ${frequency}`);
      }

      const raciAssignments: Array<{ role: RaciRole; positionId: string; employeeId: string }> = [];
      
      if (row.raci.responsible) {
        raciAssignments.push({ 
          role: RaciRole.R, 
          positionId: row.raci.responsible.positionId, 
          employeeId: ''
        });
      }
      if (row.raci.accountable) {
        raciAssignments.push({ 
          role: RaciRole.A, 
          positionId: row.raci.accountable.positionId, 
          employeeId: ''
        });
      }
      if (row.raci.consulted) {
        raciAssignments.push({ 
          role: RaciRole.C, 
          positionId: row.raci.consulted.positionId, 
          employeeId: ''
        });
      }
      if (row.raci.informed) {
        raciAssignments.push({ 
          role: RaciRole.I, 
          positionId: row.raci.informed.positionId, 
          employeeId: ''
        });
      }

      return {
        name: row.name.trim(),
        frequency,
        projectId: contextForm.projectId,
        groupName: row.groupName?.trim() || undefined,
        note: undefined,
        partner: row.partner?.trim() || undefined,
        estimatedHours: row.duration || 0, // Map duration to EstimatedHours
        raciAssignments: raciAssignments.length > 0 ? raciAssignments : undefined,
      };
    });

    setIsSubmitting(true);
    try {
      console.log('[TASK_SUBMIT] Submitting', { count: taskRows.length });
      const createdTasks = await taskApi.createBulk(createRequests);
      console.log('[TASK_SUBMIT] Success:', { count: createdTasks.length });
      await onSave(createdTasks);
      resetForm();
    } catch (err) {
      console.error('Failed to create tasks:', err);
      alert('Lỗi tạo task: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    contextForm,
    setContextForm,
    taskRows,
    errors,
    departmentOptions,
    positionOptions,
    durationOptions,
    frequencyOptions,
    totalHours,
    addTaskRow,
    updateTaskRow,
    removeTaskRow,
    submit,
    isSubmitting,
  };
};
