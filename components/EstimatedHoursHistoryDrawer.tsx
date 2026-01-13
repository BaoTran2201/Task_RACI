import React, { useEffect, useState, useCallback } from 'react';
import { X, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { taskApi } from '../src/services/api';
import { EstimatedHoursHistoryResponse, EstimatedHoursAuditEntry } from '../src/types/api-dto';
import { Modal, Button } from './Shared';

// Helper function to format relative time (e.g., "2 hours ago")
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa mới';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  // Fallback to full date
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to format absolute time (e.g., "10/01/2026 14:30:00")
function formatAbsoluteTime(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface EstimatedHoursHistoryDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EstimatedHoursHistoryDrawer: React.FC<EstimatedHoursHistoryDrawerProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<EstimatedHoursAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await taskApi.getEstimatedHoursHistory(taskId);
      setHistory(response.history || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchHistory();
    }
  }, [isOpen, taskId, fetchHistory]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử thay đổi Giờ công"
      maxWidth="max-w-2xl"
    >
      <div className="py-4">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchHistory}
                className="mt-2 gap-2 inline-flex items-center"
              >
                <RotateCcw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Chưa có thay đổi. Lịch sử sẽ xuất hiện khi có thay đổi giờ công.
            </p>
          </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <HistoryEntry key={entry.id || index} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

const HistoryEntry: React.FC<{ entry: EstimatedHoursAuditEntry }> = ({ entry }) => {
  const changedAt = new Date(entry.changedAt);
  const relativeTime = formatRelativeTime(changedAt);
  const absoluteTime = formatAbsoluteTime(changedAt);

  const sourceLabel = entry.source === 'AdminEdit' ? 'Chỉnh sửa bởi Admin' : 'Chỉnh sửa bởi Người tạo';
  const sourceBgColor =
    entry.source === 'AdminEdit' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow">
      {/* Avatar placeholder */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
        {entry.changedByName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900">{entry.changedByName}</p>
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${sourceBgColor}`}>
            {sourceLabel}
          </span>
        </div>

        {/* Hours change */}
        <div className="mb-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-red-600">{entry.oldHours}</span>
            <span className="mx-2 text-gray-400">→</span>
            <span className="font-semibold text-green-600">{entry.newHours}</span>
            <span className="ml-2 text-gray-500">giờ công</span>
          </p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-500" title={absoluteTime}>
          {relativeTime}
        </p>
      </div>
    </div>
  );
};
