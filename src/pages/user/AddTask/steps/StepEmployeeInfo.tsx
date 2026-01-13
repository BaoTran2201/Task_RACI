import React from 'react';
import { Project, Position } from '../../../../../types';
import { EmployeeRoleContext } from '../types';

interface StepEmployeeInfoProps {
  contextForm: EmployeeRoleContext;
  setContextForm: React.Dispatch<React.SetStateAction<EmployeeRoleContext>>;
  contextErrors: Record<string, string>;
  projects: Project[];
  departmentOptions: string[];
  positionOptions: Position[];
}

export const StepEmployeeInfo: React.FC<StepEmployeeInfoProps> = ({
  contextForm,
  setContextForm,
  contextErrors,
  projects,
  departmentOptions,
  positionOptions,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Phòng ban <span className="text-red-500">*</span>
          </label>
          <select
            value={contextForm.departmentId || ''}
            onChange={e => setContextForm(prev => ({ ...prev, departmentId: e.target.value }))}
            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              contextErrors.departmentId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn phòng ban</option>
            {departmentOptions.map(dep => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
          {contextErrors.departmentId && (
            <p className="text-red-500 text-sm mt-1">{contextErrors.departmentId}</p>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Dự án <span className="text-red-500">*</span>
          </label>
          <select
            value={contextForm.projectId || ''}
            onChange={e => setContextForm(prev => ({ ...prev, projectId: e.target.value }))}
            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              contextErrors.projectId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {contextErrors.projectId && (
            <p className="text-red-500 text-sm mt-1">{contextErrors.projectId}</p>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Chức vụ chính <span className="text-red-500">*</span>
          </label>
          <select
            value={contextForm.mainPositionId || ''}
            onChange={e => setContextForm(prev => ({ ...prev, mainPositionId: e.target.value }))}
            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              contextErrors.mainPositionId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn chức vụ</option>
            {positionOptions.map(pos => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
          {contextErrors.mainPositionId && (
            <p className="text-red-500 text-sm mt-1">{contextErrors.mainPositionId}</p>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Chức vụ kiêm nhiệm <span className="text-red-500">*</span>
          </label>
          <select
            value={contextForm.subPositionId || ''}
            onChange={e => setContextForm(prev => ({ ...prev, subPositionId: e.target.value }))}
            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              contextErrors.subPositionId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn chức vụ</option>
            {positionOptions.map(pos => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
          {contextErrors.subPositionId && (
            <p className="text-red-500 text-sm mt-1">{contextErrors.subPositionId}</p>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Quản lý trực tiếp <span className="text-red-500">*</span>
          </label>
          <select
            value={contextForm.lineManagerPositionId || ''}
            onChange={e => setContextForm(prev => ({ ...prev, lineManagerPositionId: e.target.value }))}
            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              contextErrors.lineManagerPositionId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn quản lý</option>
            {positionOptions.map(pos => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
          {contextErrors.lineManagerPositionId && (
            <p className="text-red-500 text-sm mt-1">{contextErrors.lineManagerPositionId}</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Chức vụ liên quan
        </p>
        <div className="flex flex-wrap gap-4">
          {positionOptions.map(pos => (
            <label key={pos.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contextForm.relatedPositionIds.includes(pos.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setContextForm(prev => ({
                      ...prev,
                      relatedPositionIds: [...prev.relatedPositionIds, pos.id]
                    }));
                  } else {
                    setContextForm(prev => ({
                      ...prev,
                      relatedPositionIds: prev.relatedPositionIds.filter(p => p !== pos.id)
                    }));
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{pos.name}</span>
            </label>
          ))}
        </div>
        {contextErrors.relatedPositionIds && (
          <p className="text-red-500 text-sm mt-2">{contextErrors.relatedPositionIds}</p>
        )}
      </div>
    </div>
  );
};
