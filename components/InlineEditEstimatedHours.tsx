import React, { useState, useRef } from 'react';
import { Check, X, Pencil, History } from 'lucide-react';

interface InlineEditEstimatedHoursProps {
  taskId: string;
  initialValue: number;
  canEdit: boolean;
  onSave: (taskId: string, newValue: number) => Promise<void>;
  onError?: (error: string) => void;
  onViewHistory?: (taskId: string) => void;
}

export const InlineEditEstimatedHours: React.FC<InlineEditEstimatedHoursProps> = ({
  taskId,
  initialValue,
  canEdit,
  onSave,
  onError,
  onViewHistory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [previousValue, setPreviousValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setPreviousValue(initialValue);
    setInputValue(initialValue.toString());
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(initialValue.toString());
  };

  const handleSave = async () => {
    const numValue = parseFloat(inputValue);

    if (isNaN(numValue)) {
      onError?.('Giá trị không hợp lệ');
      return;
    }

    if (numValue <= 0) {
      onError?.('Giờ công phải lớn hơn 0');
      return;
    }

    if (numValue > 999) {
      onError?.('Giờ công quá lớn (tối đa 999h)');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(taskId, numValue);
      setIsEditing(false);
      setPreviousValue(numValue);
    } catch (err: any) {
      onError?.(err.message || 'Lỗi cập nhật');
      setInputValue(previousValue.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 group">
        <span className="font-medium text-slate-900">{initialValue}h</span>
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-slate-400 hover:text-slate-600"
              title="Chỉnh sửa giờ công"
            >
              <Pencil size={16} />
            </button>
            {onViewHistory && (
              <button
                onClick={() => onViewHistory(taskId)}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="Xem lịch sử thay đổi"
              >
                <History size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        min="0.1"
        step="0.5"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-16 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100"
      />
      <span className="text-xs text-slate-500">h</span>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
        title="Lưu"
      >
        <Check size={16} />
      </button>
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
        title="Hủy"
      >
        <X size={16} />
      </button>
    </div>
  );
};
