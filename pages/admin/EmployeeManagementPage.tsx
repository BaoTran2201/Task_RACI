import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Shared';
import { EmployeeTable, ActivateEmployeeModal } from '../../components/employees';
import { employeeApi, EmployeeWithAccountDto } from '../../src/services/api';
import { Alert } from '../../components/FormElements';
import { Search } from 'lucide-react';

export const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithAccountDto[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithAccountDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAccountDto | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
        <p className="text-sm text-slate-600 mt-1">
          Quản lý tài khoản đăng nhập cho nhân viên
        </p>
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
    </div>
  );
};
