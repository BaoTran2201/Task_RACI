import React from 'react';
import { Search, Bell, LogOut, RefreshCw } from 'lucide-react';
import { Employee, UserRole, Page } from '../../../types';
import { UserRole as UserRoleEnum } from '../../types/enums';

interface TopbarProps {
  currentUser: Employee | null;
  userRole: UserRole;
  currentPage: Page;
  onLogout: () => void;
  showSearch?: boolean;
  demoMode?: boolean;
  onResetDemo?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  userRole,
  currentPage,
  onLogout,
  showSearch = false,
  demoMode = false,
  onResetDemo,
}) => {
  const getPageTitle = (): string => {
    const titleMap: Record<Page, string> = {
      [Page.ADMIN_DASHBOARD]: 'Dashboard Tổng Quan',
      [Page.ADMIN_IMPORT_EMPLOYEES]: 'Import Nhân viên',
      [Page.ADMIN_IMPORT_PROJECTS]: 'Import Dự án',
      [Page.ADMIN_DEPARTMENTS]: 'Quản lý Phòng ban',
      [Page.ADMIN_POSITIONS]: 'Quản lý Chức vụ',
      [Page.ADMIN_PROJECTS]: 'Quản lý Dự án',
      [Page.ADMIN_TASKS]: 'Quản Lý Task (Toàn công ty)',
      [Page.ADMIN_REPORT_TASK]: 'Báo Cáo Theo Task',
      [Page.ADMIN_REPORT_USER]: 'Báo Cáo Theo Nhân Sự',
      [Page.USER_DASHBOARD]: 'Tổng Quan Của Tôi',
      [Page.USER_MY_TASKS]: 'Task Của Tôi',
      [Page.USER_MY_RACI]: 'Vai Trò (RACI) Của Tôi',
      [Page.USER_PROFILE]: 'Hồ Sơ Cá Nhân',
      [Page.USER_ADD_TASK]: 'Thêm Task Mới',
    };
    return titleMap[currentPage] || '';
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="hidden md:flex flex-1 max-w-80 items-center gap-4">
          {showSearch && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex-1">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none flex-1"
              />
            </div>
          )}

          {demoMode && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
              DEMO MODE
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {userRole === UserRoleEnum.Admin && (
            <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
              ADMIN
            </span>
          )}

          <button className="relative p-2 text-slate-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={18} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {demoMode && onResetDemo && (
            <button
              onClick={onResetDemo}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
            >
              <RefreshCw size={14} />
              Reset
            </button>
          )}

          <div className="h-6 border-l border-gray-200"></div>

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold ${
                userRole === UserRoleEnum.Admin ? 'bg-purple-600' : 'bg-blue-600'
              }`}
            >
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-800">
                {currentUser?.name || 'User'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
