import React, { useMemo, useState } from 'react';
import { Card, Button } from '../../../components/Shared';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { read, utils } from 'xlsx';
import { Employee, Project } from '../../../types';
import { ImportPreview, IssueRow } from './ImportPreview';
import { projectApi } from '../../../src/services/api';

type ProjectRow = {
  name: string;
  client: string;
  manager?: string;
};

type Summary = {
  valid: number;
  warning: number;
  error: number;
};

interface ImportProjectsProps {
  employees: Employee[];
  projects: Project[];
}

export const ImportProjects: React.FC<ImportProjectsProps> = ({ employees, projects }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validRows, setValidRows] = useState<ProjectRow[]>([]);
  const [warningRows, setWarningRows] = useState<IssueRow<ProjectRow>[]>([]);
  const [errorRows, setErrorRows] = useState<IssueRow<ProjectRow>[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary>({ valid: 0, warning: 0, error: 0 });
  const [warningsAccepted, setWarningsAccepted] = useState(false);

  const normalizeCell = (value: unknown) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  };

  const normalizeKey = (value: unknown) => normalizeCell(value).toLowerCase();

  const isRowEmpty = (row: unknown[]) => row.every((cell) => normalizeCell(cell) === '');

    const existingEmployeeNames = useMemo(() => new Set(employees.map((e) => normalizeKey(e.name))), [employees]);
    const existingProjectNames = useMemo(() => new Set(projects.map((p) => normalizeKey(p.name))), [projects]);

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
    const nextValid: ProjectRow[] = [];
    const nextWarning: IssueRow<ProjectRow>[] = [];
    const nextError: IssueRow<ProjectRow>[] = [];
    const nextWarnings: string[] = [];
    const nextErrors: string[] = [];
    const seenNames = new Set<string>();

    rows.forEach((row, idx) => {
      const [rawName, rawClient, rawManager] = row;
      const name = normalizeCell(rawName);
      const client = normalizeCell(rawClient);
      const manager = normalizeCell(rawManager);

      const rowData: ProjectRow = { name, client, manager: manager || undefined };
      const rowWarnings: string[] = [];
      const rowErrors: string[] = [];

      if (!name) rowErrors.push(`Dòng ${idx + 1}: Tên dự án không được trống`);
      if (manager && !existingEmployeeNames.has(normalizeKey(manager))) {
        rowErrors.push(`Dòng ${idx + 1}: Trưởng dự án không tồn tại`);
      }

      if (name) {
        if (seenNames.has(normalizeKey(name))) {
          rowWarnings.push(`Dòng ${idx + 1}: Trùng tên dự án trong file`);
        }
        const normalizedName = normalizeKey(name);
        if (existingProjectNames.has(normalizedName)) {
          rowWarnings.push(`Dòng ${idx + 1}: Tên dự án đã tồn tại trong hệ thống`);
        } else {
          rowWarnings.push(`Dòng ${idx + 1}: Dự án chưa tồn tại – sẽ được tạo mới`);
        }
        seenNames.add(normalizedName);
      }

      if (rowErrors.length > 0) {
        nextErrors.push(...rowErrors);
        nextError.push({ rowIndex: idx + 1, data: rowData, messages: rowErrors, type: 'error' });
        return;
      }

      if (rowWarnings.length > 0) {
        nextWarnings.push(...rowWarnings);
        nextWarning.push({ rowIndex: idx + 1, data: rowData, messages: rowWarnings, type: 'warning' });
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

    const rowsToProcess = [...validRows, ...warningRows.map((w) => w.data)];
    const existingNamesSet = new Set(Array.from(existingProjectNames));
    const newProjects: { name: string; client: string }[] = [];

    rowsToProcess.forEach((row) => {
      const normalized = normalizeKey(row.name);
      if (!existingNamesSet.has(normalized)) {
        existingNamesSet.add(normalized);
        newProjects.push({ name: row.name, client: row.client || 'Internal' });
      }
    });

    setStatus('loading');
    try {
      for (const proj of newProjects) {
        await projectApi.create({ name: proj.name, customer: proj.client });
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  const downloadErrorsCsv = (rows: IssueRow<ProjectRow>[]) => {
    const header = ['row', 'messages'];
    const lines = rows.map((r) => `${r.rowIndex},"${r.messages.join('; ')}"`);
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_errors_projects.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const newProjectsCount = useMemo(() => {
    const rowsToProcess = [...validRows, ...warningRows.map((w) => w.data)];
    const existingNamesSet = new Set(Array.from(existingProjectNames));
    let count = 0;
    rowsToProcess.forEach((row) => {
      const normalized = normalizeKey(row.name);
      if (!existingNamesSet.has(normalized)) {
        existingNamesSet.add(normalized);
        count += 1;
      }
    });
    return count;
  }, [validRows, warningRows, existingProjectNames]);

  const canImport = file && summary.error === 0 && validRows.length > 0 && (summary.warning === 0 || warningsAccepted);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Dự án</h1>
          <p className="text-sm text-slate-600 mt-1">Tải lên danh sách dự án từ file CSV hoặc Excel</p>
        </div>
        {canImport && (
          <Button onClick={handleImport} disabled={status === 'loading'} className="whitespace-nowrap">
            {status === 'loading'
              ? 'Đang import...'
              : newProjectsCount > 0
                ? `Import & tạo ${newProjectsCount} dự án mới`
                : 'Import dữ liệu'}
          </Button>
        )}
      </div>

      <Card>
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${file ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onClick={() => document.getElementById('fileUploadProjects')?.click()}
          >
            <input
              type="file"
              accept=".csv,.xlsx"
              id="fileUploadProjects"
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
              <p className="text-xs text-slate-500 mt-1">CSV, Excel (max 5MB)</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Định dạng file yêu cầu:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-start gap-2"><span>•</span><span>Cột 1: Tên dự án</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Cột 2: Tên khách hàng</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Cột 3: Tên trưởng dự án</span></li>
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
            type="project"
            errorRows={errorRows}
            warningRows={warningRows}
            onDownloadErrors={errorRows.length > 0 ? () => downloadErrorsCsv(errorRows) : undefined}
          />
        </Card>
      )}

      {status === 'success' && (
        <Card>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="font-medium">Import thành công!</span>
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card>
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <span className="font-medium">Lỗi định dạng file. Vui lòng kiểm tra lại.</span>
          </div>
        </Card>
      )}
    </div>
  );
};
