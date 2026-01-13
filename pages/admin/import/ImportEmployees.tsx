import React, { useMemo, useState } from 'react';
import { Card, Button } from '../../../components/Shared';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { read, utils } from 'xlsx';
import { Employee, Department, Position } from '../../../types';
import { ImportPreview, IssueRow } from './ImportPreview';
import { CreateBootstrapManagerModal } from './CreateBootstrapManagerModal';
import { employeeApi, ImportEmployeeRow } from '../../../src/services/api';

type EmployeeRow = {
  name: string;
  department: string;
  position: string;
  manager?: string;
};

type Summary = {
  valid: number;
  warning: number;
  error: number;
};

interface ImportEmployeesProps {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
}

export const ImportEmployees: React.FC<ImportEmployeesProps> = ({ employees, departments, positions }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validRows, setValidRows] = useState<EmployeeRow[]>([]);
  const [warningRows, setWarningRows] = useState<IssueRow<EmployeeRow>[]>([]);
  const [errorRows, setErrorRows] = useState<IssueRow<EmployeeRow>[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary>({ valid: 0, warning: 0, error: 0 });
  const [warningsAccepted, setWarningsAccepted] = useState(false);
  const [importResult, setImportResult] = useState<{ departmentsCreated: number; positionsCreated: number; managersCreated: number; employeesCreated: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [updatedEmployees, setUpdatedEmployees] = useState(employees);

    const normalizeCell = (value: unknown) => {
      if (value === null || value === undefined) return '';
      return String(value).replace(/\s+/g, ' ').trim();
    };

    const normalizeKey = (value: unknown) => normalizeCell(value).toLowerCase();

    const isRowEmpty = (row: unknown[]) => row.every((cell) => normalizeCell(cell) === '');

  const existingDepartments = useMemo(() => {
    return new Set(departments.filter(d => d.active).map((d) => normalizeKey(d.name)));
  }, [departments]);

  const existingPositions = useMemo(() => {
    return new Set(positions.filter(p => p.active).map((p) => normalizeKey(p.name)));
  }, [positions]);

  const existingEmployeeNames = useMemo(() => {
    return new Set(employees.map((e) => normalizeKey(e.name)));
  }, [employees]);

  const parseFile = async (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase().split('.').pop();
    if (!ext || !['csv', 'xlsx'].includes(ext)) {
      throw new Error('Chỉ hỗ trợ file CSV hoặc XLSX');
    }

    if (ext === 'csv') {
      const text = await selectedFile.text();
      return text
        .split(/\r?\n/)
        .map((line) => line.split(','))
        .filter((row) => !isRowEmpty(row));
    }

    const data = await selectedFile.arrayBuffer();
    const workbook = read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];
    return rows.filter((row) => !isRowEmpty(row));
  };

  const validateRows = (rows: unknown[][]) => {
    const nextValid: EmployeeRow[] = [];
    const nextWarning: IssueRow<EmployeeRow>[] = [];
    const nextError: IssueRow<EmployeeRow>[] = [];
    const nextWarnings: string[] = [];
    const nextErrors: string[] = [];
    const seenNames = new Set<string>();
    let onlyCreationWarnings = true;

    rows.forEach((row, idx) => {
      const [rawName, rawDepartment, rawPosition, rawManager] = row;
      const name = normalizeCell(rawName);
      const department = normalizeCell(rawDepartment);
      const position = normalizeCell(rawPosition);
      const manager = normalizeCell(rawManager);

      const rowData: EmployeeRow = { name, department, position, manager: manager || undefined };
      const rowWarnings: string[] = [];
      const rowErrors: string[] = [];

      if (!name) rowErrors.push(`Dòng ${idx + 1}: Tên nhân viên không được trống`);
      if (!department) rowErrors.push(`Dòng ${idx + 1}: Phòng ban không được trống`);
      if (!position) rowErrors.push(`Dòng ${idx + 1}: Chức vụ không được trống`);

      if (department && !existingDepartments.has(normalizeKey(department))) {
        rowWarnings.push(`Dòng ${idx + 1}: Phòng ban '${department}' chưa tồn tại – sẽ được tạo mới`);
      }

      if (position && !existingPositions.has(normalizeKey(position))) {
        rowWarnings.push(`Dòng ${idx + 1}: Chức vụ '${position}' chưa tồn tại – sẽ được tạo mới`);
      }

      if (manager) {
        // Check if user entered a Position name instead of Employee name
        if (existingPositions.has(normalizeKey(manager))) {
          rowWarnings.push(
            `Dòng ${idx + 1}: '${manager}' là tên CHỨC VỤ, không phải TÊN NHÂN VIÊN. ` +
            `Quản lý trực tiếp phải là tên nhân viên, ví dụ: "Nguyễn Văn A", không phải "Trưởng phòng"`
          );
          onlyCreationWarnings = false;
        } else if (!existingEmployeeNames.has(normalizeKey(manager))) {
          const msg = `Dòng ${idx + 1}: Quản lý trực tiếp '${manager}' chưa tồn tại – sẽ được tạo mới`;
          rowWarnings.push(msg);
        }
      }

      if (name) {
        if (seenNames.has(normalizeKey(name))) {
          rowWarnings.push(`Dòng ${idx + 1}: Trùng tên trong file`);
        }
        if (existingEmployeeNames.has(normalizeKey(name))) {
          rowWarnings.push(`Dòng ${idx + 1}: Tên đã tồn tại trong hệ thống`);
        }
        seenNames.add(normalizeKey(name));
      }

      if (rowErrors.length > 0) {
        nextErrors.push(...rowErrors);
        nextError.push({ rowIndex: idx + 1, data: rowData, messages: rowErrors, type: 'error' });
        return;
      }

      if (rowWarnings.length > 0) {
        nextWarnings.push(...rowWarnings);
        nextWarning.push({ rowIndex: idx + 1, data: rowData, messages: rowWarnings, type: 'warning' });
        rowWarnings.forEach((w) => {
          const isCreationWarning = w.includes('sẽ được tạo mới');
          if (!isCreationWarning) {
            onlyCreationWarnings = false;
          }
        });
        return;
      }

      nextValid.push(rowData);
    });

    setValidRows(nextValid);
    setWarningRows(nextWarning);
    setErrorRows(nextError);
    setWarnings(nextWarnings);
    setErrors(nextErrors);
    setSummary({ valid: nextValid.length, warning: nextWarning.length, error: nextError.length });
    if (nextWarning.length > 0 && onlyCreationWarnings) setWarningsAccepted(true);
  };

  const handleSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('idle');
    setWarningsAccepted(false);
    try {
      const rows = await parseFile(selectedFile);
      if (rows.length === 0) {
        setErrors(['File không có dữ liệu']);
        setSummary({ valid: 0, warning: 0, error: 1 });
        setValidRows([]);
        setWarningRows([]);
        setErrorRows([]);
        return;
      }

      validateRows(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đọc file';
      setErrors([message]);
      setSummary({ valid: 0, warning: 0, error: 1 });
      setValidRows([]);
      setWarningRows([]);
      setErrorRows([]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (summary.error > 0 || validRows.length === 0) return;
    if (summary.warning > 0 && !warningsAccepted) return;

    // Combine valid rows and warning rows (user accepted warnings)
    const rowsToProcess = [...validRows, ...warningRows.map((w) => w.data)];

    // Map FE rows to backend DTO format
    const apiRows: ImportEmployeeRow[] = rowsToProcess.map((row) => {
      // Find position to get canManage flag
      const positionObj = positions.find(
        (p) => p.name.toLowerCase().trim() === row.position.toLowerCase().trim()
      );
      
      return {
        name: row.name,
        departmentName: row.department,
        positionName: row.position,
        positionCanManage: positionObj?.canManage ?? false,
        managerName: row.manager || undefined,
      };
    });

    setStatus('loading');
    setImportError(null);
    setImportResult(null);

    try {
      const result = await employeeApi.import(apiRows);
      setImportResult(result);
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import thất bại';
      // Try to parse backend error message
      let errorMsg = message;
      try {
        const parsed = JSON.parse(message);
        errorMsg = parsed.message || parsed.error || message;
      } catch {
        // Keep original message if not JSON
      }
      setImportError(errorMsg);
      setStatus('error');
    }
  };

  const downloadErrorsCsv = (rows: IssueRow<EmployeeRow>[]) => {
    const header = ['row', 'messages'];
    const lines = rows.map((r) => `${r.rowIndex},"${r.messages.join('; ')}"`);
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_errors_employees.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const departmentCreateCount = useMemo(() => {
    const rowsToProcess = [...validRows, ...warningRows.map((w) => w.data)];
    const existing = new Set(Array.from(existingDepartments));
    let count = 0;
    rowsToProcess.forEach((row) => {
      if (row.department) {
        const key = normalizeKey(row.department);
        if (!existing.has(key)) {
          existing.add(key);
          count += 1;
        }
      }
    });
    return count;
  }, [validRows, warningRows, existingDepartments]);

  const positionCreateCount = useMemo(() => {
    const rowsToProcess = [...validRows, ...warningRows.map((w) => w.data)];
    const existing = new Set(Array.from(existingPositions));
    let count = 0;
    rowsToProcess.forEach((row) => {
      if (row.position) {
        const key = normalizeKey(row.position);
        if (!existing.has(key)) {
          existing.add(key);
          count += 1;
        }
      }
    });
    return count;
  }, [validRows, warningRows, existingPositions]);

  const managerCreateCount = useMemo(() => {
    const rowsToProcess = [...validRows, ...warningRows.map((w) => w.data)];
    const existing = new Set(Array.from(existingEmployeeNames));
    let count = 0;
    rowsToProcess.forEach((row) => {
      if (row.manager) {
        const key = normalizeKey(row.manager);
        if (!existing.has(key)) {
          existing.add(key);
          count += 1;
        }
      }
    });
    return count;
  }, [validRows, warningRows, existingEmployeeNames]);

  const canImport = file && summary.error === 0 && validRows.length > 0 && (summary.warning === 0 || warningsAccepted);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Nhân viên</h1>
          <p className="text-sm text-slate-600 mt-1">Tải lên danh sách nhân viên từ file CSV hoặc Excel</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {updatedEmployees.length === 0 && (
            <Button
              onClick={() => setShowCreateManagerModal(true)}
              className="whitespace-nowrap bg-amber-600 hover:bg-amber-700"
            >
              ➕ Tạo nhân sự quản lý trước
            </Button>
          )}
          {canImport && (
            <Button onClick={handleImport} disabled={status === 'loading'} className="whitespace-nowrap">
              {status === 'loading'
                ? 'Đang import...'
                : (() => {
                    const parts: string[] = [];
                    if (departmentCreateCount > 0) parts.push(`${departmentCreateCount} phòng ban`);
                    if (positionCreateCount > 0) parts.push(`${positionCreateCount} chức vụ`);
                    if (managerCreateCount > 0) parts.push(`${managerCreateCount} quản lý`);
                    return parts.length > 0 ? `Import & tạo ${parts.join(', ')} mới` : 'Import dữ liệu';
                  })()}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${file ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onClick={() => document.getElementById('fileUploadEmployees')?.click()}
          >
            <input
              type="file"
              accept=".csv,.xlsx"
              id="fileUploadEmployees"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleSelectedFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className={`w-12 h-12 mb-3 ${file ? 'text-blue-600' : 'text-slate-400'}`} />
              <p className="text-sm font-medium text-slate-800">
                {file ? file.name : 'Kéo thả file CSV/XLSX vào đây hoặc click để chọn'}
              </p>
              <p className="text-xs text-slate-500 mt-1">CSV, Excel (max 5MB)
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Định dạng file yêu cầu:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-start gap-2"><span>•</span><span>Cột 1: Tên nhân viên</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Cột 2: Phòng ban</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Cột 3: Chức vụ</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Cột 4: <strong>TÊN</strong> nhân viên quản lý trực tiếp (ví dụ: "Nguyễn Văn A")</span></li>
            </ul>
          </div>

          {(file || summary.valid + summary.warning + summary.error > 0) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Tóm tắt kiểm tra</span>
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-semibold">✅ {summary.valid} dòng hợp lệ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 font-semibold">⚠️ {summary.warning} dòng cảnh báo</span>
                  {summary.warning > 0 && !warningsAccepted && (
                    <button
                      onClick={() => setWarningsAccepted(true)}
                      className="text-xs font-semibold text-amber-700 underline"
                    >
                      Tôi chấp nhận tiếp tục
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-700 font-semibold">❌ {summary.error} dòng lỗi</span>
                </div>
              </div>
              {warnings.length > 0 && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  {warnings.slice(0, 3).map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                  {warnings.length > 3 && <div>…</div>}
                </div>
              )}
              {errors.length > 0 && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {errors.slice(0, 3).map((er, i) => (
                    <div key={i}>{er}</div>
                  ))}
                  {errors.length > 3 && <div>…</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {(errorRows.length > 0 || warningRows.length > 0) && (
        <Card>
          <ImportPreview
            type="employee"
            errorRows={errorRows}
            warningRows={warningRows}
            onDownloadErrors={errorRows.length > 0 ? () => downloadErrorsCsv(errorRows) : undefined}
          />
        </Card>
      )}

      {status === 'success' && importResult && (
        <Card>
          <div className="flex flex-col gap-2 text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="font-medium">Import thành công!</span>
            </div>
            <div className="text-sm text-green-600 ml-7">
              <div>• {importResult.employeesCreated} nhân viên được tạo</div>
              {importResult.managersCreated > 0 && <div>• {importResult.managersCreated} quản lý được tạo</div>}
              {importResult.positionsCreated > 0 && <div>• {importResult.positionsCreated} chức vụ được tạo</div>}
              {importResult.departmentsCreated > 0 && <div>• {importResult.departmentsCreated} phòng ban được tạo</div>}
            </div>
            <div className="text-xs text-green-500 ml-7 mt-1">
              Tải lại trang để xem dữ liệu mới.
            </div>
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card>
          <div className="flex flex-col gap-2 text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span className="font-medium">Import thất bại</span>
            </div>
            {importError && (
              <div className="text-sm text-red-600 ml-7 bg-red-50 p-2 rounded border border-red-200">
                {importError}
              </div>
            )}
          </div>
        </Card>
      )}

      {showCreateManagerModal && (
        <CreateBootstrapManagerModal
          departments={departments}
          positions={positions}
          onSuccess={() => {
            setShowCreateManagerModal(false);
            // Refresh the employee list by updating state
            setUpdatedEmployees([...updatedEmployees, { id: 'new', name: '', department: '', position: '' }]);
          }}
          onCancel={() => setShowCreateManagerModal(false)}
        />
      )}
    </div>
  );
};
