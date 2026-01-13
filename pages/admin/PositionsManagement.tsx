import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/Shared';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Position } from '../../types';
import { positionApi } from '../../src/services/api';

interface PositionsManagementProps {
  positions: Position[];
  onUpdate: (positions: Position[]) => void;
}

export const PositionsManagement: React.FC<PositionsManagementProps> = ({
  positions,
  onUpdate,
}) => {
  const [list, setList] = useState<Position[]>(positions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCanManage, setFormCanManage] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update list when positions prop changes
  useEffect(() => {
    setList(positions);
  }, [positions]);

  const openForm = (pos?: Position) => {
    if (pos) {
      setEditingId(pos.id);
      setFormName(pos.name);
      setFormCanManage(pos.canManage);
    } else {
      setEditingId(null);
      setFormName('');
      setFormCanManage(false);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormCanManage(false);
  };

  const handleSave = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName) return;

    const existingPos = list.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== editingId
    );
    if (existingPos) {
      alert('Chức vụ này đã tồn tại');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing
        const updated = await positionApi.update(editingId, {
          name: trimmedName,
          canManage: formCanManage,
        });
        const newList = list.map((p) =>
          p.id === editingId ? { id: updated.id, name: updated.name, canManage: updated.canManage, active: updated.isActive } : p
        );
        setList(newList);
        onUpdate(newList);
      } else {
        // Create new
        const created = await positionApi.create({
          name: trimmedName,
          canManage: formCanManage,
          isActive: true,
        });
        const newPos: Position = {
          id: created.id,
          name: created.name,
          canManage: created.canManage,
          active: created.isActive,
        };
        const newList = [...list, newPos];
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
    setLoading(true);
    try {
      await positionApi.deactivate(id);
      // Refresh list from API
      const refreshed = await positionApi.getAll();
      const newList = refreshed.map(p => ({
        id: p.id,
        name: p.name,
        canManage: p.canManage,
        active: p.isActive
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
      await positionApi.activate(id);
      // Refresh list from API
      const refreshed = await positionApi.getAll();
      const newList = refreshed.map(p => ({
        id: p.id,
        name: p.name,
        canManage: p.canManage,
        active: p.isActive
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

  const activePos = list.filter((p) => p.active);
  const inactivePos = list.filter((p) => !p.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Chức vụ</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tổng: {activePos.length} chức vụ đang hoạt động
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => openForm()} size="sm">
            <Plus size={16} className="mr-1" />
            Thêm chức vụ
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              {editingId ? 'Sửa chức vụ' : 'Thêm chức vụ mới'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên chức vụ
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên chức vụ"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="canManage"
                checked={formCanManage}
                onChange={(e) => setFormCanManage(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="canManage" className="text-sm text-slate-700">
                Có quyền quản lý
              </label>
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
                  <th className="px-4 py-3 text-left">Tên chức vụ</th>
                  <th className="px-4 py-3 text-left">Có quyền quản lý</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activePos.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{pos.name}</td>
                    <td className="px-4 py-3">
                      {pos.canManage ? (
                        <span className="text-green-700 font-medium">Có</span>
                      ) : (
                        <span className="text-slate-500">Không</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hoạt động
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openForm(pos)}
                        className="text-blue-600 hover:text-blue-800 p-2 inline-flex"
                        title="Sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(pos.id)}
                        className="text-red-600 hover:text-red-800 p-2 inline-flex"
                        title="Deactivate"
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
            {activePos.map((pos) => (
              <div key={pos.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="font-medium text-slate-800">{pos.name}</div>
                <div className="text-sm text-slate-600">
                  Quyền quản lý: {pos.canManage ? 'Có' : 'Không'}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => openForm(pos)}
                    className="text-blue-600 text-sm font-medium"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeactivate(pos.id)}
                    className="text-red-600 text-sm font-medium"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {inactivePos.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Chức vụ đã deactivate</h3>
              <div className="space-y-2">
                {inactivePos.map((pos) => (
                  <div
                    key={pos.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <span className="text-slate-600">{pos.name}</span>
                    <button
                      onClick={() => handleReactivate(pos.id)}
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
    </div>
  );
};
