import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Employee, Position, Project, Task } from '../../../../types';
import { useAddTaskForm } from './hooks/useAddTaskForm';
import { StepEmployeeInfo } from './steps/StepEmployeeInfo';
import { StepTaskInfo } from './steps/StepTaskInfo';

interface AddTaskPageProps {
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  positions: Position[];
  onSave: (tasks: Task[]) => Promise<void>;
  onNavigateBack: () => void;
}

export const AddTaskPage: React.FC<AddTaskPageProps> = ({
  currentUser,
  employees,
  projects,
  positions,
  onSave,
  onNavigateBack,
}) => {
  const handleSaveTasks = async (tasks: Task[]) => {
    await onSave(tasks);
    onNavigateBack();
  };

  const form = useAddTaskForm({
    currentUser,
    employees,
    projects,
    positions,
    onSave: handleSaveTasks,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          QUAY LẠI TASK CỦA TÔI
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Thêm Task Mới</h2>
        <p className="text-slate-500 text-sm">
          Mô tả ngắn: Tạo nhóm task nội bộ với thông tin nhân sự và danh sách task chi tiết.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Thông tin chức vụ</h3>
        </div>
        <div className="p-6">
          <StepEmployeeInfo
            contextForm={form.contextForm}
            setContextForm={form.setContextForm}
            contextErrors={form.errors.context}
            projects={projects}
            departmentOptions={form.departmentOptions}
            positionOptions={form.positionOptions}
          />
        </div>
      </div>

      <StepTaskInfo
        taskRows={form.taskRows}
        taskErrors={form.errors.tasks}
        durationOptions={form.durationOptions}
        frequencyOptions={form.frequencyOptions}
        totalHours={form.totalHours}
        addTaskRow={form.addTaskRow}
        updateTaskRow={form.updateTaskRow}
        removeTaskRow={form.removeTaskRow}
        selectedRelatedPositions={form.contextForm.relatedPositionIds}
        selectedRelatedPositionIds={form.contextForm.relatedPositionIds}
        positions={positions}
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={onNavigateBack}
          disabled={form.isSubmitting}
          className="px-6 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={form.submit}
          disabled={form.isSubmitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {form.isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  );
};
