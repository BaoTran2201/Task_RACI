import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/Shared';
import { Trash2, Edit2, Plus, X } from 'lucide-react';
import { Project, Employee } from '../../types';
import { projectApi } from '../../src/services/api';
import { loadAll } from '../../src/services/datastore';

interface ProjectsManagementProps {
  projects: Project[];
  employees: Employee[];
  onUpdate: (projects: Project[]) => void;
}

export const ProjectsManagement: React.FC<ProjectsManagementProps> = ({
  projects,
  employees,
  onUpdate,
}) => {
  const [list, setList] = useState<Project[]>(projects);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formManagerId, setFormManagerId] = useState('');

  useEffect(() => {
    setList(projects);
  }, [projects]);

  const openForm = (proj?: Project) => {
    if (proj) {
      setEditingId(proj.id);
      setFormName(proj.name);
      setFormClient(proj.client);
      setFormManagerId(proj.managerId || '');
    } else {
      setEditingId(null);
      setFormName('');
      setFormClient('');
      // Preselect first employee as manager to avoid empty payload
      setFormManagerId(employees[0]?.id || '');
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormClient('');
    setFormManagerId('');
  };

  const handleSave = async () => {
    const trimmedName = formName.trim();
    const trimmedClient = formClient.trim();
    const trimmedManagerId = formManagerId.trim();

    if (!trimmedName) {
      alert('Tên dự án không được trống');
      return;
    }

    if (!trimmedClient) {
      alert('Tên khách hàng không được trống');
      return;
    }

    if (!trimmedManagerId) {
      alert('Vui lòng chọn trưởng dự án');
      return;
    }

    const existingProj = list.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== editingId
    );
    if (existingProj) {
      alert('Dự án này đã tồn tại');
      return;
    }

    try {
      if (editingId) {
        // Update existing project
        await projectApi.update(editingId, {
          name: trimmedName,
          customer: trimmedClient,
          managerId: trimmedManagerId,
        });
      } else {
        // Create new project
        await projectApi.create({
          name: trimmedName,
          customer: trimmedClient,
          managerId: trimmedManagerId,
        });
      }

      // Reload all data to get the updated list
      const { projects: updatedProjects } = await loadAll(true);
      setList(updatedProjects);
      onUpdate(updatedProjects);
      closeForm();
    } catch (error: any) {
      alert(error.message || 'Lỗi khi lưu dự án');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;

    try {
      await projectApi.delete(id);
      
      // Reload all data to get the updated list
      const { projects: updatedProjects } = await loadAll(true);
      setList(updatedProjects);
      onUpdate(updatedProjects);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xóa dự án');
    }
  };

  const getManagerName = (managerId: string) => {
    const manager = employees.find((e) => e.id === managerId);
    return manager ? manager.name : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Dự án</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tổng: {list.length} dự án
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => openForm()} size="sm">
            <Plus size={16} className="mr-1" />
            Thêm dự án
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {editingId ? 'Sửa dự án' : 'Thêm dự án mới'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên dự án <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên dự án"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Khách hàng <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên khách hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trưởng dự án
              </label>
              <select
                value={formManagerId}
                onChange={(e) => setFormManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn trưởng dự án --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.position})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-slate-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <Button onClick={handleSave}>Lưu</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-6">
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Tên dự án</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Trưởng dự án</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((proj) => (
                  <tr key={proj.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{proj.name}</td>
                    <td className="px-4 py-3 text-slate-600">{proj.client}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {proj.managerId ? getManagerName(proj.managerId) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openForm(proj)}
                        className="text-blue-600 hover:text-blue-800 p-2 inline-flex"
                        title="Sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="text-red-600 hover:text-red-800 p-2 inline-flex"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {list.map((proj) => (
              <div key={proj.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="font-medium text-slate-800">{proj.name}</div>
                <div className="text-sm text-slate-600">Khách hàng: {proj.client}</div>
                <div className="text-sm text-slate-600">
                  Trưởng dự án: {proj.managerId ? getManagerName(proj.managerId) : '-'}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => openForm(proj)}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="text-red-600 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {list.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Chưa có dự án nào. Nhấn "Thêm dự án" để bắt đầu.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
