import React, { useState, useEffect } from 'react';
import { Page, Employee, Project, Task, RaciMatrix, UserRole, Department, Position } from './types';
import { loadAll } from './src/services/datastore';
import { taskApi, authApi, clearAuthToken, TOKEN_KEY, setUnauthorizedHandler, raciApi } from './src/services/api';
import { UserRole as UserRoleEnum, RaciRole } from './src/types/enums';
import { isDemoMode, setDemoMode, getDemoUserCredentials, persistDemoOverrides } from './src/services/demoMode';
import { Loader2 } from 'lucide-react';

import { Dashboard } from './pages/Dashboard';
import { TaskManagement } from './pages/TaskManagement';
import { Reports } from './pages/Reports';
import { UserPortal } from './pages/UserPortal';
import { LoginPage } from './pages/LoginPage';
import { ImportEmployees } from './pages/admin/import/ImportEmployees';
import { ImportProjects } from './pages/admin/import/ImportProjects';
import { DepartmentsManagement } from './pages/admin/DepartmentsManagement';
import { PositionsManagement } from './pages/admin/PositionsManagement';
import { ProjectsManagement } from './pages/admin/ProjectsManagement';
import { EmployeeManagementPage } from './pages/admin/EmployeeManagementPage';
import { AddTaskPage } from './src/pages/user/AddTask/AddTaskPage';

import { AdminLayout } from './src/layouts/AdminLayout';
import { UserLayout } from './src/layouts/UserLayout';
import { AuthLayout } from './src/layouts/AuthLayout';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [raciData, setRaciData] = useState<RaciMatrix[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [didInitialLoad, setDidInitialLoad] = useState<boolean>(false);
  const [demoMode] = useState<boolean>(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [username, setUsername] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.USER_DASHBOARD);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setIsLoggedIn(false);
      setUserRole('user');
      setCurrentUser(null);
      setAuthError('Phiên đăng nhập đã hết hạn');
      setIsLoadingData(false);
      localStorage.removeItem('raci_user');
      clearAuthToken();
    });
  }, []);

  useEffect(() => {
    const hasUser = localStorage.getItem('raci_user');
    const hasToken = localStorage.getItem(TOKEN_KEY);
    // Disable demo mode whenever a real session exists so data loads from backend
    if (hasUser && hasToken) {
      setDemoMode(false);
    } else {
      setDemoMode(true);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('raci_user');
    const hasToken = localStorage.getItem(TOKEN_KEY);
    if (storedUser && hasToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role as UserRole);
        setUsername(parsed.username || null);
        // Don't set currentUser here - it will be matched from employees
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('raci_user');
        clearAuthToken();
      }
    }
    if (!hasToken) setIsLoadingData(false);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      persistDemoOverrides({ tasks, raciData, projects });
    }
  }, [tasks, raciData, projects]);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    (async () => {
      try {
        const { employees, projects, tasks, raciData, departments, positions } = await loadAll(userRole === UserRoleEnum.Admin);
        setEmployees(employees);
        setProjects(projects);
        setTasks(tasks);
        setRaciData(raciData);
        setDepartments(departments);
        setPositions(positions);
        if (!currentUser && employees.length > 0) {
          console.log('[DEBUG] Matching employee:', { username, employeesCount: employees.length, employeesWithUsername: employees.filter(e => e.username).length });
          const matchedEmployee = username ? employees.find(e => e.username === username) : undefined;
          if (!matchedEmployee && username) {
            console.warn('[WARN] Username found but no employee matched', { username });
          }
          const fallback = matchedEmployee || employees[0];
          console.log('[DEBUG] Matched employee:', fallback ? { id: fallback.id, name: fallback.name, username: fallback.username } : 'NONE');
          setCurrentUser(fallback || null);
        }
        setDidInitialLoad(true);
      } catch (err) {
        setAuthError('Phiên đăng nhập đã hết hạn');
        setIsLoggedIn(false);
        setCurrentUser(null);
        clearAuthToken();
        localStorage.removeItem('raci_user');
      } finally {
        setIsLoadingData(false);
      }
    })();
  }, [isLoggedIn, userRole]);

  const handleLogin = async (username: string, password: string) => {
    setAuthError('');
    setIsLoadingAuth(true);
    setIsLoadingData(true);
    try {
      // Always use real backend API for authentication
      const data = await authApi.login({ username, password });
      const role = (data.role as UserRole) || 'user';

      // Switch off demo data once authenticated
      setDemoMode(false);
      
      // Store authentication data
      setUserRole(role);
      setUsername(data.username);
      setIsLoggedIn(true);
      setCurrentPage(role === 'admin' ? Page.ADMIN_DASHBOARD : Page.USER_DASHBOARD);
      localStorage.setItem('raci_user', JSON.stringify({ role, username: data.username }));
    } catch (err: any) {
      // Show backend error message or fallback to generic message
      const errorMsg = err.message || 'Sai tài khoản hoặc mật khẩu';
      setAuthError(errorMsg);
      setIsLoggedIn(false);
      setIsLoadingData(false);
      setIsLoadingAuth(false);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthError('');
    setIsLoadingData(false);
    clearAuthToken();
    localStorage.removeItem('raci_user');
  };

  if (isLoadingAuth || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AuthLayout>
        <LoginPage
          onLogin={handleLogin}
          employees={employees}
          errorMessage={authError}
        />
      </AuthLayout>
    );
  }

  const renderPageContent = () => {
    if (userRole === UserRoleEnum.Admin) {
      switch (currentPage) {
        case Page.ADMIN_DASHBOARD:
          return (
            <Dashboard
              onNavigate={(p) => setCurrentPage(p as any)}
              stats={{
                tasks: tasks.length,
                employees: employees.length,
                projects: projects.length,
                hours: tasks.length * 20,
              }}
              recentTasks={tasks.slice(0, 5).map(t => {
                const creator = employees.find(e => e.id === t.creatorId);
                const creatorPosId = creator?.primaryPositionId || creator?.positionId;
                const creatorRaciAssignments = creatorPosId
                  ? raciData.filter(r => r.taskId === t.id && r.positionId === creatorPosId)
                  : [];
                let creatorRole = 'N/A';

                if (creatorRaciAssignments.length > 0) {
                  const roleOrder: RaciRole[] = [RaciRole.A, RaciRole.R, RaciRole.C, RaciRole.I];
                  const assignedRoles = creatorRaciAssignments.map(r => r.role);
                  for (const role of roleOrder) {
                    if (assignedRoles.includes(role)) {
                      creatorRole = role;
                      break;
                    }
                  }
                }

                return {
                  task: t,
                  project: projects.find(p => p.id === t.projectId),
                  creator,
                  role: creatorRole,
                };
              })}
            />
          );
        case Page.ADMIN_IMPORT_EMPLOYEES:
          return <ImportEmployees employees={employees} departments={departments} positions={positions} />;
        case Page.ADMIN_IMPORT_PROJECTS:
          return <ImportProjects employees={employees} projects={projects} />;
        case Page.ADMIN_DEPARTMENTS:
          return (
            <DepartmentsManagement
              departments={departments}
              employees={employees}
              onUpdate={setDepartments}
            />
          );
        case Page.ADMIN_POSITIONS:
          return (
            <PositionsManagement
              positions={positions}
              onUpdate={setPositions}
            />
          );
        case Page.ADMIN_PROJECTS:
          return (
            <ProjectsManagement
              projects={projects}
              employees={employees}
              onUpdate={setProjects}
            />
          );
        case Page.ADMIN_TASKS:
          return (
            <TaskManagement
              employees={employees}
              projects={projects}
              tasks={tasks}
              raciData={raciData}
              positions={positions}
              setTasks={setTasks}
              setRaciData={setRaciData}
            />
          );
        case Page.ADMIN_EMPLOYEES:
          return <EmployeeManagementPage />;
        case Page.ADMIN_REPORT_TASK:
        case Page.ADMIN_REPORT_USER:
          return (
            <Reports
              type={currentPage === Page.ADMIN_REPORT_TASK ? 'task' : 'user'}
              employees={employees}
              projects={projects}
              tasks={tasks}
              raciData={raciData}
              departments={departments}
            />
          );
        default:
          return null;
      }
    } else if (userRole === 'user' && currentUser) {
      if (currentPage === Page.USER_ADD_TASK) {
        return (
          <AddTaskPage
            currentUser={currentUser}
            employees={employees}
            projects={projects}
            positions={positions}
            onSave={async (newTasks) => {
              try {
                const refreshedTasks = await taskApi.getAll();
                setTasks(refreshedTasks);
                const refreshedRaci = await raciApi.getAll();
                setRaciData(refreshedRaci);
              } catch (error) {
                alert('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
              }
            }}
            onNavigateBack={() => setCurrentPage(Page.USER_MY_TASKS)}
          />
        );
      }

      return (
        <UserPortal
          view={
            currentPage === Page.USER_DASHBOARD ? 'dashboard' :
            currentPage === Page.USER_MY_TASKS ? 'my_tasks' :
            currentPage === Page.USER_MY_RACI ? 'my_raci' :
            currentPage === Page.USER_PROFILE ? 'profile' : 'dashboard'
          }
          currentUser={currentUser}
          employees={employees}
          positions={positions}
          projects={projects}
          tasks={tasks}
          raciData={raciData}
          setTasks={setTasks}
          setRaciData={setRaciData}
          onNavigate={(view) => {
            if (view === 'my_tasks') setCurrentPage(Page.USER_MY_TASKS);
            else if (view === 'add_task') setCurrentPage(Page.USER_ADD_TASK);
          }}
        />
      );
    }
  };

  const layoutComponent = (content: React.ReactNode) => {
    if (userRole === UserRoleEnum.Admin) {
      return (
        <AdminLayout
          currentUser={currentUser}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
          demoMode={demoMode}
          onResetDemo={() => window.location.reload()}
        >
          {content}
        </AdminLayout>
      );
    } else {
      return (
        <UserLayout
          currentUser={currentUser}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
          demoMode={demoMode}
          onResetDemo={() => window.location.reload()}
        >
          {content}
        </UserLayout>
      );
    }
  };

  return layoutComponent(renderPageContent());
}
