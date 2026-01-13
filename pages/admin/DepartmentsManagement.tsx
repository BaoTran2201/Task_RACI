import React, { useMemo, useState, useEffect } from 'react';
import { Card, Button } from '../../components/Shared';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Department, Employee } from '../../types';
import { departmentApi } from '../../src/services/api';

interface DepartmentsManagementProps {
  departments: Department[];
  employees: Employee[];
  onUpdate: (departments: Department[]) => void;
}

export const DepartmentsManagement: React.FC<DepartmentsManagementProps> = ({
  departments,
  employees,
  onUpdate,
}) => {
  const [list, setList] = useState<Department[]>(departments);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [loading, setLoading] = useState(false);

  // Update list when departments prop changes
  useEffect(() => {
    setList(departments);
  }, [departments]);

  const departmentUsage = useMemo(() => {
    const usage = new Map<string, number>();
    employees.forEach((emp) => {
      const count = usage.get(emp.department) || 0;
      usage.set(emp.department, count + 1);
    });
    return usage;
  }, [employees]);

  const openForm = (dept?: Department) => {
    if (dept) {
      setEditingId(dept.id);
      setFormName(dept.name);
    } else {
      setEditingId(null);
      setFormName('');
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
  };

  const handleSave = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName) return;

    const existingDept = list.find(
      (d) => d.name.toLowerCase() === trimmedName.toLowerCase() && d.id !== editingId
    );
    if (existingDept) {
      alert('Phòng ban này đã tồn tại');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
     
        const existingDept = list.find(d => d.id === editingId);
        if (!existingDept) {
          alert('Không tìm thấy phòng ban');
          return;
        }
        console.log('[DepartmentsManagement] Updating department:', editingId, trimmedName);
        const updated = await departmentApi.update(editingId, {
          name: trimmedName,
          isActive: existingDept.active,
        });
        const newList = list.map((d) => (d.id === editingId ? { id: updated.id, name: updated.name, active: updated.isActive } : d));
        setList(newList);
        onUpdate(newList);
      } else {
        // Create new
        console.log('[DepartmentsManagement] Creating new department:', trimmedName);
        const created = await departmentApi.create({
          name: trimmedName,
          isActive: true,
        });
        console.log('[DepartmentsManagement] Created department from API:', created);
        const newDept: Department = {
          id: created.id,
          name: created.name,
          active: created.isActive,
        };
        const newList = [...list, newDept];
        setList(newList);
        onUpdate(newList);
      }
      closeForm();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Không lưu được'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    const dept = list.find((d) => d.id === id);
    if (!dept) return;

    const usage = departmentUsage.get(dept.name) || 0;
    if (usage > 0) {
      alert(`Không thể deactivate phòng ban này vì đang được ${usage} nhân viên sử dụng`);
      return;
    }

    setLoading(true);
    try {
      await departmentApi.deactivate(id);
      // Refresh list from API
      const refreshed = await departmentApi.getAll();
      const newList = refreshed.map(d => ({
        id: d.id,
        name: d.name,
        active: d.isActive
      }));
      setList(newList);
      onUpdate(newList);
    } catch (err) {
      console.error('Deactivate failed:', err);
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Không deactivate được'));
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (id: string) => {
    setLoading(true);
    try {
      await departmentApi.activate(id);
      // Refresh list from API
      const refreshed = await departmentApi.getAll();
      const newList = refreshed.map(d => ({
        id: d.id,
        name: d.name,
        active: d.isActive
      }));
      setList(newList);
      onUpdate(newList);
    } catch (err) {
      console.error('Reactivate failed:', err);
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Không kích hoạt được'));
    } finally {
      setLoading(false);
    }
  };

  const activeDepts = list.filter((d) => d.active);
  const inactiveDepts = list.filter((d) => !d.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Phòng ban</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tổng: {activeDepts.length} phòng ban đang hoạt động
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => openForm()} size="sm">
            <Plus size={16} className="mr-1" />
            Thêm phòng ban
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              {editingId ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên phòng ban
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên phòng ban"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-slate-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                disabled={loading}
              >
                Hủy
              </button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </Button>
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
                  <th className="px-4 py-3 text-left">Tên phòng ban</th>
                  <th className="px-4 py-3 text-left">Số nhân viên</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeDepts.map((dept) => {
                  const count = departmentUsage.get(dept.name) || 0;
                  return (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{dept.name}</td>
                      <td className="px-4 py-3 text-slate-600">{count}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Hoạt động
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openForm(dept)}
                          className="text-blue-600 hover:text-blue-800 p-2 inline-flex"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeactivate(dept.id)}
                          className="text-red-600 hover:text-red-800 p-2 inline-flex"
                          title="Deactivate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {activeDepts.map((dept) => {
              const count = departmentUsage.get(dept.name) || 0;
              return (
                <div key={dept.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="font-medium text-slate-800">{dept.name}</div>
                  <div className="text-sm text-slate-600">Nhân viên: {count}</div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => openForm(dept)}
                      className="text-blue-600 text-sm font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeactivate(dept.id)}
                      className="text-red-600 text-sm font-medium"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {inactiveDepts.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Phòng ban đã deactivate</h3>
              <div className="space-y-2">
                {inactiveDepts.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <span className="text-slate-600">{dept.name}</span>
                    <button
                      onClick={() => handleReactivate(dept.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Kích hoạt lại
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {inactiveDepts.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Phòng ban đã deactivate</h3>
          <div className="space-y-2">
            {inactiveDepts.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <span className="text-slate-600">{dept.name}</span>
                <button
                  onClick={() => handleReactivate(dept.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Kích hoạt lại
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
