import React, { useEffect, useMemo, useState } from 'react';

export type IssueType = 'error' | 'warning';

export type IssueRow<T> = {
  rowIndex: number;
  data: T;
  messages: string[];
  type: IssueType;
};

interface ImportPreviewProps<T> {
  type: 'employee' | 'project';
  errorRows: IssueRow<T>[];
  warningRows: IssueRow<T>[];
  onDownloadErrors?: () => void;
}

export function ImportPreview<T>({ type, errorRows, warningRows, onDownloadErrors }: ImportPreviewProps<T>) {
  const hasError = errorRows.length > 0;
  const hasWarning = warningRows.length > 0;
  const showTabs = hasError && hasWarning;
  const [activeTab, setActiveTab] = useState<IssueType>(hasError ? 'error' : 'warning');

  useEffect(() => {
    if (hasError && !hasWarning) {
      setActiveTab('error');
    } else if (hasWarning && !hasError) {
      setActiveTab('warning');
    } else if (hasError && hasWarning && !['error', 'warning'].includes(activeTab)) {
      setActiveTab('error');
    }
  }, [hasError, hasWarning, activeTab]);

  const rows = useMemo(() => {
    if (showTabs) {
      return activeTab === 'error' ? errorRows : warningRows;
    }
    return hasError ? errorRows : warningRows;
  }, [activeTab, errorRows, warningRows, hasError, showTabs]);

  const getVal = (row: IssueRow<T>, key: string) => (row.data as any)?.[key] ?? '';

  const renderTable = () => (
    <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-slate-700 font-semibold">
          <tr>
            <th className="px-4 py-2 text-left">Dòng</th>
            {type === 'employee' ? (
              <>
                <th className="px-4 py-2 text-left">Tên</th>
                <th className="px-4 py-2 text-left">Phòng ban</th>
                <th className="px-4 py-2 text-left">Chức vụ</th>
                <th className="px-4 py-2 text-left">Quản lý</th>
              </>
            ) : (
              <>
                <th className="px-4 py-2 text-left">Tên dự án</th>
                <th className="px-4 py-2 text-left">Khách hàng</th>
                <th className="px-4 py-2 text-left">Trưởng dự án</th>
              </>
            )}
            <th className="px-4 py-2 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, idx) => {
            const bg = row.type === 'error' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300';
            const border = row.type === 'error' ? 'border-red-300' : 'border-amber-300';
            const cells = (
              type === 'employee'
                ? [getVal(row, 'name'), getVal(row, 'department'), getVal(row, 'position'), getVal(row, 'manager')]
                : [getVal(row, 'name'), getVal(row, 'client'), getVal(row, 'manager')]
            );

            return (
              <tr key={`${row.rowIndex}-${idx}`}>
                <td className={`px-4 py-2 align-top border-l ${border} ${bg}`}>{row.rowIndex}</td>
                {cells.map((cell, i) => (
                  <td key={i} className={`px-4 py-2 align-top border-l ${border} ${bg}`}>
                    {cell || '-'}
                  </td>
                ))}
                <td className={`px-4 py-2 align-top border-l ${border} ${bg}`}>
                  <div className="space-y-1 text-sm text-slate-800">
                    {row.messages.map((msg, mi) => (
                      <div key={mi}>{msg}</div>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCards = () => (
    <div className="md:hidden space-y-3">
      {rows.map((row, idx) => {
        const cardBg = row.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
        return (
          <div key={`${row.rowIndex}-${idx}`} className={`border rounded-lg p-3 ${cardBg}`}>
            <div className="text-sm font-semibold text-slate-800">Dòng {row.rowIndex}</div>
            <div className="text-sm text-slate-800 mt-1 space-y-1">
              {row.messages.map((msg, mi) => (
                <div key={mi}>{msg}</div>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-700 space-y-1">
              {type === 'employee' ? (
                <>
                  <div>Tên: {getVal(row, 'name') || '-'}</div>
                  <div>Phòng ban: {getVal(row, 'department') || '-'}</div>
                  <div>Chức vụ: {getVal(row, 'position') || '-'}</div>
                  <div>Quản lý: {getVal(row, 'manager') || '-'}</div>
                </>
              ) : (
                <>
                  <div>Tên dự án: {getVal(row, 'name') || '-'}</div>
                  <div>Khách hàng: {getVal(row, 'client') || '-'}</div>
                  <div>Trưởng dự án: {getVal(row, 'manager') || '-'}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!hasError && !hasWarning) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span>🔍 Xem trước dữ liệu cần xử lý</span>
        </div>
        {hasError && onDownloadErrors && (
          <button
            onClick={onDownloadErrors}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline"
          >
            ⬇️ Tải danh sách dòng lỗi
          </button>
        )}
      </div>

      {showTabs && (
        <div className="inline-flex bg-gray-100 rounded-lg p-1 text-sm font-semibold text-slate-700">
          <button
            onClick={() => setActiveTab('error')}
            className={`px-3 py-1 rounded-md ${activeTab === 'error' ? 'bg-white shadow-sm text-red-700' : 'text-slate-700'}`}
          >
            ❌ Lỗi ({errorRows.length})
          </button>
          <button
            onClick={() => setActiveTab('warning')}
            className={`px-3 py-1 rounded-md ${activeTab === 'warning' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-700'}`}
          >
            ⚠️ Cảnh báo ({warningRows.length})
          </button>
        </div>
      )}

      {renderTable()}
      {renderCards()}
    </div>
  );
}
