import React, { useState } from 'react';
import { Card, Button } from '../components/Shared';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

export const ImportData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'projects'>('employees');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
    }
  };

  const handleImport = () => {
    if (!file) return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab('employees'); setFile(null); setStatus('idle'); }}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'employees' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Import Nhân viên
        </button>
        <button
          onClick={() => { setActiveTab('projects'); setFile(null); setStatus('idle'); }}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Import Dự án
        </button>
      </div>

      <Card title={`Import ${activeTab === 'employees' ? 'Nhân viên' : 'Dự án'}`}>
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${file ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onClick={() => document.getElementById('fileUpload')?.click()}
          >
            <input type="file" id="fileUpload" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) {
                 setFile(e.target.files[0]);
                 setStatus('idle');
              }
            }} />
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className={`w-12 h-12 mb-3 ${file ? 'text-blue-600' : 'text-slate-400'}`} />
              <p className="text-sm font-medium text-slate-800">
                {file ? file.name : 'Kéo thả file CSV vào đây hoặc click để chọn'}
              </p>
              <p className="text-xs text-slate-500 mt-1">CSV, Excel (max 5MB)</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Định dạng file yêu cầu:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {activeTab === 'employees' ? (
                <>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 1: Tên nhân viên</span></li>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 2: Phòng ban</span></li>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 3: Chức vụ</span></li>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 4: Chức vụ quản lý trực tiếp</span></li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 1: Tên dự án</span></li>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 2: Tên khách hàng</span></li>
                  <li className="flex items-start gap-2"><span>•</span><span>Cột 3: Tên trưởng dự án</span></li>
                </>
              )}
            </ul>
          </div>

          {file && status !== 'loading' && (
            <div className="card overflow-hidden">
              <div className="card-header text-xs font-semibold text-slate-500 uppercase">Preview Dữ Liệu</div>
              <div className="card-body overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 font-medium">
                      <th className="pb-2">Cột 1</th>
                      <th className="pb-2">Cột 2</th>
                      <th className="pb-2">Cột 3</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    <tr><td className="py-1">Data mẫu 1</td><td className="py-1">Data mẫu 2</td><td className="py-1">Data mẫu 3</td></tr>
                    <tr><td className="py-1">Data mẫu 1</td><td className="py-1">Data mẫu 2</td><td className="py-1">Data mẫu 3</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
               {status === 'success' && (
                  <span className="flex items-center text-sm text-green-700 font-medium gap-1.5">
                    <CheckCircle size={16} />
                    Import thành công!
                  </span>
               )}
               {status === 'error' && (
                  <span className="flex items-center text-sm text-red-700 font-medium gap-1.5">
                    <AlertTriangle size={16} />
                    Lỗi định dạng file. Vui lòng kiểm tra lại.
                  </span>
               )}
            </div>
            <Button 
              onClick={handleImport} 
              disabled={!file || status === 'success'} 
              isLoading={status === 'loading'}
            >
              Xác nhận Import
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
