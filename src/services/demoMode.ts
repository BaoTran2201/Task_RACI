import { Employee, Project, Task, RaciMatrix } from '../../types';

const DEMO_MODE_KEY = 'demo_mode';
const HAS_USER_DATA_KEY = 'has_user_data';
const TASKS_OVERRIDE_KEY = 'ds_tasks_override';
const PROJECTS_OVERRIDE_KEY = 'ds_projects_override';
const RACI_OVERRIDE_KEY = 'ds_raci_override';

export const isDemoMode = (): boolean => {
  const flag = localStorage.getItem(DEMO_MODE_KEY);
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  // Default to true only when flag is absent
  return true;
};

export const setDemoMode = (value: boolean): void => {
  if (value) {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
  } else {
    // Explicitly persist 'false' so subsequent checks disable demo mode
    localStorage.setItem(DEMO_MODE_KEY, 'false');
  }
};

export const hasUserData = (): boolean => {
  return localStorage.getItem(HAS_USER_DATA_KEY) === 'true';
};

export const markUserDataExists = (): void => {
  localStorage.setItem(HAS_USER_DATA_KEY, 'true');
  setDemoMode(false);
};

export const loadDemoData = async (): Promise<{
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  raciData: RaciMatrix[];
}> => {
  try {
    const [empRes, projRes, taskRes, raciRes] = await Promise.all([
      fetch('/data/employees.json'),
      fetch('/data/projects.json'),
      fetch('/data/tasks.json'),
      fetch('/data/raci_assignments.json'),
    ]);

    const employees = await empRes.json();
    const projects = await projRes.json();
    const tasks = await taskRes.json();
    const raciData = await raciRes.json();

    return { employees, projects, tasks, raciData };
  } catch (error) {
    console.error('Failed to load demo data:', error);
    return { employees: [], projects: [], tasks: [], raciData: [] };
  }
};

export const resetDemoData = (): void => {
  localStorage.removeItem(TASKS_OVERRIDE_KEY);
  localStorage.removeItem(RACI_OVERRIDE_KEY);
  localStorage.removeItem(PROJECTS_OVERRIDE_KEY);
  localStorage.removeItem(HAS_USER_DATA_KEY);
  setDemoMode(true);
  window.location.reload();
};

export const loadDemoOverrides = () => {
  const tasks = localStorage.getItem(TASKS_OVERRIDE_KEY);
  const raci = localStorage.getItem(RACI_OVERRIDE_KEY);
  const projects = localStorage.getItem(PROJECTS_OVERRIDE_KEY);
  return {
    tasks: tasks ? JSON.parse(tasks) : null,
    raciData: raci ? JSON.parse(raci) : null,
    projects: projects ? JSON.parse(projects) : null,
  };
};

export const persistDemoOverrides = (data: {
  tasks?: any[];
  raciData?: any[];
  projects?: any[];
}) => {
  if (data.tasks) localStorage.setItem(TASKS_OVERRIDE_KEY, JSON.stringify(data.tasks));
  if (data.raciData) localStorage.setItem(RACI_OVERRIDE_KEY, JSON.stringify(data.raciData));
  if (data.projects) localStorage.setItem(PROJECTS_OVERRIDE_KEY, JSON.stringify(data.projects));
};

export const getDemoUserCredentials = () => {
  return {
    admin: { username: 'admin', password: 'admin' },
    user: { username: 'user', password: 'user' },
  };
};
