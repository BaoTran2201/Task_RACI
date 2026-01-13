import React from 'react';
import { Spinner } from './Shared';

interface Column {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface RaciTableProps {
  columns: Column[];
  data: any[];
  onRowHover?: (index: number | null) => void;
  renderCell?: (value: any, column: Column, row: any, rowIndex: number) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const RaciTable: React.FC<RaciTableProps> = ({
  columns,
  data,
  onRowHover,
  renderCell,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
}) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-10 flex flex-col items-center gap-2" aria-live="polite">
          <Spinner />
          <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12" aria-live="polite">
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="table-header">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-cell font-semibold text-left px-4 py-3 text-slate-700 ${col.width ? `w-[${col.width}]` : ''}`}
                  style={{
                    width: col.width,
                    textAlign: col.align,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="table-row transition-colors hover:bg-blue-50/60"
                onMouseEnter={() => onRowHover?.(rowIndex)}
                onMouseLeave={() => onRowHover?.(null)}
              >
                {columns.map((col) => (
                  <td
                    key={`${rowIndex}-${col.key}`}
                    className="table-cell px-4 py-3 align-middle"
                    style={{
                      width: col.width,
                      textAlign: col.align,
                    }}
                  >
                    {renderCell ? renderCell(row[col.key], col, row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
