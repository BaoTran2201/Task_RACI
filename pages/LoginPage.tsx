import React, { useEffect, useState } from 'react';
import { Button } from '../components/Shared';
import { UserRole, Employee } from '../types';
import { Lock, User } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  employees: Employee[];
  errorMessage?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, employees, errorMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(errorMessage || '');
    setIsLoading(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (errorMessage) setError(errorMessage);
  }, [errorMessage]);

  return (
    <div className="min-h-screen w-screen bg-slate-50">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left branding (desktop only) */}
        <div className="relative hidden lg:flex lg:w-1/2 xl:w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-12 xl:p-16 text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 25%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.25), transparent 30%), radial-gradient(circle at 40% 60%, rgba(255,255,255,0.2), transparent 28%)' }} />
          <div className="relative z-10 max-w-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold">R</div>
              <div className="text-sm uppercase tracking-[0.2em] text-white/80">CHECK RACI</div>
            </div>
            <h1 className="text-4xl xl:text-5xl font-semibold leading-tight">Hey, xin chào!</h1>
            <p className="text-base xl:text-lg text-white/80 leading-relaxed max-w-xl">
              Quản lý vai trò, trách nhiệm và phân quyền nhân sự thật trực quan. Đăng nhập để bắt đầu.
            </p>
          </div>
        </div>

        {/* Right login card */}
        <div className="flex flex-1 items-center justify-center px-5 py-10 lg:py-0">
          <div className="w-full max-w-lg">
            <div className="mb-8 lg:mb-10 text-center lg:text-left">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 text-white text-xl font-semibold shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-100">
                R
              </div>
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-sm lg:text-base text-slate-500 mt-1">Đăng nhập để tiếp tục sử dụng hệ thống CHECK NHÂN SỰ RACI.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-indigo-100/60 border border-slate-100 p-7 lg:p-9 space-y-5">
              <div className="form-group">
                <label className="form-label text-sm font-medium text-slate-700">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-base pl-12 h-12 rounded-full bg-slate-50/80 focus:bg-white"
                    placeholder="admin hoặc user"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-sm font-medium text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pl-12 h-12 rounded-full bg-slate-50/80 focus:bg-white"
                    placeholder="••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-full text-base font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors"
                isLoading={isLoading}
              >
                Đăng nhập
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">Đăng nhập bằng tài khoản nội bộ.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
