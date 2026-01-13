import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Shared';
import { EmployeeTable, ActivateEmployeeModal } from '../../components/employees';
import { employeeApi, EmployeeWithAccountDto } from '../../src/services/api';
import { Alert } from '../../components/FormElements';
import { Search, UserPlus } from 'lucide-react';
import { Button, Modal, Input } from '../../components/Shared';

export const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithAccountDto[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithAccountDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAccountDto | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({ name: '', department: '', position: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await employeeApi.getAll();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateClick = (employee: EmployeeWithAccountDto) => {
    setSelectedEmployee(employee);
    setIsActivateModalOpen(true);
  };

  const handleActivateSuccess = (username: string) => {
    setSuccessMessage(`Kích hoạt thành công. Username: ${username}`);
    setIsActivateModalOpen(false);
    setSelectedEmployee(null);
    loadEmployees();
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleModalClose = () => {
    setIsActivateModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeForm.name || !newEmployeeForm.department || !newEmployeeForm.position) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      await employeeApi.create(newEmployeeForm);
      setSuccessMessage(`Đã thêm nhân viên ${newEmployeeForm.name} thành công`);
      setIsAddModalOpen(false);
      setNewEmployeeForm({ name: '', department: '', position: '' });
      loadEmployees();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Không thể thêm nhân viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý tài khoản đăng nhập cho nhân viên
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, phòng ban, chức vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10 w-full"
          />
        </div>
      </Card>

      {/* Employee Table */}
      <Card>
        <EmployeeTable
          employees={filteredEmployees}
          isLoading={isLoading}
          onActivateClick={handleActivateClick}
        />
      </Card>

      {/* Activate Modal */}
      {selectedEmployee && (
        <ActivateEmployeeModal
          isOpen={isActivateModalOpen}
          employee={selectedEmployee}
          onClose={handleModalClose}
          onSuccess={handleActivateSuccess}
        />
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm nhân viên mới"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <Input
            label="Họ tên"
            value={newEmployeeForm.name}
            onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })}
            placeholder="VD: Nguyễn Văn A"
            required
          />
          <Input
            label="Phòng ban"
            value={newEmployeeForm.department}
            onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, department: e.target.value })}
            placeholder="VD: IT, Sales..."
            required
          />
          <Input
            label="Chức vụ"
            value={newEmployeeForm.position}
            onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, position: e.target.value })}
            placeholder="VD: Developer, Manager..."
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Xác nhận
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
