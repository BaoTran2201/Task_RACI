import React, { useState } from 'react';
import { Modal, Button, Input } from '../Shared';
import { EmployeeWithAccountDto, employeeApi } from '../../src/services/api';
import { Alert } from '../FormElements';

interface ActivateEmployeeModalProps {
  isOpen: boolean;
  employee: EmployeeWithAccountDto;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export const ActivateEmployeeModal: React.FC<ActivateEmployeeModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password.trim()) {
      setError('Mật khẩu không được để trống');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      const result = await employeeApi.activateAccount(employee.id, password);
      onSuccess(result.username);
    } catch (err: any) {
      const message = err.message || 'Lỗi khi kích hoạt tài khoản';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Kích hoạt tài khoản nhân viên"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Display */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Read-only Employee Info */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Họ tên</label>
            <div className="text-sm font-medium text-gray-900 mt-1">{employee.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Phòng ban</label>
              <div className="text-sm text-gray-700 mt-1">{employee.department}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Chức vụ</label>
              <div className="text-sm text-gray-700 mt-1">{employee.position}</div>
            </div>
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="form-label">
            Mật khẩu khởi tạo <span className="text-red-600">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            className="input-base w-full"
            disabled={isLoading}
            minLength={6}
            required
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Nhân viên sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="flex-1"
          >
            Kích hoạt
          </Button>
        </div>
      </form>
    </Modal>
  );
};
