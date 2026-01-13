import React from 'react';
import { Menu as MenuIcon, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onLogout: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuOpen,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <div className="flex md:hidden sticky top-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between w-full px-4 py-3">
        <button
          onClick={onMenuOpen}
          className="p-2 text-slate-600 hover:bg-gray-100 rounded transition-colors"
        >
          <MenuIcon size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <div className="font-bold text-slate-800">RACI CHECK</div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-slate-600 hover:bg-gray-100 rounded transition-colors"
          >
            <LogOut size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
