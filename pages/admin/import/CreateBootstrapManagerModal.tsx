import React, { useState } from 'react';
import { Card, Button } from '../../../components/Shared';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Department, Position } from '../../../types';
import { employeeApi } from '../../../src/services/api';

interface CreateBootstrapManagerModalProps {
  departments: Department[];
  positions: Position[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateBootstrapManagerModal: React.FC<CreateBootstrapManagerModalProps> = ({
  departments,
  positions,
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedPosId, setSelectedPosId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter positions that can manage
  const manageablePositions = positions.filter((p) => p.canManage && p.active);

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setErrorMsg('Tên nhân sự không được trống');
      return;
    }

    if (!selectedDeptId) {
      setErrorMsg('Phòng ban không được để trống');
      return;
    }

    if (!selectedPosId) {
      setErrorMsg('Chức vụ không được để trống');
      return;
    }

    setStatus('loading');
    setErrorMsg(null);

    try {
      // Find the selected department and position names
      const selectedDept = departments.find(d => d.id === selectedDeptId);
      const selectedPos = positions.find(p => p.id === selectedPosId);

      if (!selectedDept || !selectedPos) {
        throw new Error('Phòng ban hoặc chức vụ không hợp lệ');
      }

      await employeeApi.createBootstrapManager({
        name: name.trim(),
        departmentName: selectedDept.name,
        positionName: selectedPos.name,
      });

      setStatus('success');
      // Clear form
      setName('');
      setSelectedDeptId('');
      setSelectedPosId('');

      // Wait a moment then call success callback
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tạo nhân sự quản lý thất bại';
      let errorMsg = message;
      try {
        const parsed = JSON.parse(message);
        errorMsg = parsed.message || parsed.error || message;
      } catch {
        // Keep original message
      }
      setErrorMsg(errorMsg);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Tạo nhân sự quản lý</h2>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700"
              disabled={status === 'loading'}
            >
              ✕
            </button>
          </div>

          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
              <CheckCircle size={20} />
              <span>Tạo nhân sự quản lý thành công!</span>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-700">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên nhân sự <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên nhân sự"
                    disabled={status === 'loading'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phòng ban <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    disabled={status === 'loading'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments
                      .filter((d) => d.active)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  {manageablePositions.length === 0 ? (
                    <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                      Không có chức vụ có quyền quản lý. Vui lòng tạo chức vụ trước.
                    </div>
                  ) : (
                    <select
                      value={selectedPosId}
                      onChange={(e) => setSelectedPosId(e.target.value)}
                      disabled={status === 'loading'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      {manageablePositions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreate}
                  disabled={status === 'loading' || manageablePositions.length === 0}
                  className="flex-1"
                >
                  {status === 'loading' ? 'Đang tạo...' : 'Tạo nhân sự quản lý'}
                </Button>
                <button
                  onClick={onCancel}
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
