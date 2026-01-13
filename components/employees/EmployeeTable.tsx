import React from 'react';
import { EmployeeWithAccountDto } from '../../src/services/api';
import { Badge, Button, Spinner } from '../Shared';
import { EmptyState } from '../FormElements';
import { Users } from 'lucide-react';

interface EmployeeTableProps {
  employees: EmployeeWithAccountDto[];
  isLoading: boolean;
  onActivateClick: (employee: EmployeeWithAccountDto) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  isLoading,
  onActivateClick,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="text-blue-600" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={<Users size={48} />}
        title="Không có nhân viên"
        description="Không tìm thấy nhân viên nào phù hợp"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Họ tên
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phòng ban
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Chức vụ
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái tài khoản
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => {
            const hasAccount = employee.hasUserAccount === true;
            return (
              <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {employee.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {employee.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {hasAccount ? (
                    <Badge color="green">Đã kích hoạt</Badge>
                  ) : (
                    <Badge color="red">Chưa kích hoạt</Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {hasAccount ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onActivateClick(employee)}
                    >
                      Kích hoạt
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
