import React, { useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label: string };

type Mode = 'text' | 'select';

interface InlineEditCellProps {
  mode: Mode;
  value: string | null | undefined;
  placeholder?: string;
  options?: Option[];
  allowAdd?: boolean;
  onAddOption?: (label: string) => Promise<Option> | Option;
  onSave: (next: string | null) => void;
  className?: string;
  display?: (val: string | null | undefined) => React.ReactNode;
}

export const InlineEditCell: React.FC<InlineEditCellProps> = ({
  mode,
  value,
  placeholder,
  options = [],
  allowAdd = false,
  onAddOption,
  onSave,
  className = '',
  display,
}) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? '');
  const [selectVal, setSelectVal] = useState(value ?? '');
  const [adding, setAdding] = useState(false);
  const [addText, setAddText] = useState('');
  const ref = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    setText(value ?? '');
    setSelectVal(value ?? '');
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const normalizedOptions = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach(o => map.set(o.value, o.label));
    return Array.from(map.entries()).map(([v, l]) => ({ value: v, label: l }));
  }, [options]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => { setEditing(false); setAdding(false); setAddText(''); };

  const saveText = () => { onSave(text.trim() === '' ? null : text.trim()); cancelEdit(); };
  const saveSelect = () => { onSave(selectVal.trim() === '' ? null : selectVal.trim()); cancelEdit(); };

  const handleAdd = async () => {
    if (!allowAdd || !onAddOption) return;
    const label = addText.trim();
    if (!label) return;
    const created = await onAddOption(label);
    setAdding(false);
    setAddText('');
    setSelectVal(created.value);
    onSave(created.value);
    cancelEdit();
  };

  const renderDisplay = () => {
    if (display) return <span className="truncate">{display(value)}</span>;
    if (!value) return <span className="text-slate-400 italic">-</span>;
    return <span className="truncate">{value}</span>;
  };

  return (
    <td className={`cursor-pointer hover:bg-blue-50 transition-colors ${className}`} onClick={() => !editing && startEdit()}>
      {!editing && (
        <div className="inline-block px-1 rounded">
          {renderDisplay()}
        </div>
      )}
      {editing && mode === 'text' && (
        <div className="flex items-center gap-1.5">
          <input
            ref={ref as any}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder || ''}
            className="input-base w-48"
            onKeyDown={(e) => { if (e.key === 'Enter') saveText(); if (e.key === 'Escape') cancelEdit(); }}
          />
          <button className="text-xs font-medium text-blue-600 hover:text-blue-700" onClick={saveText}>Lưu</button>
          <button className="text-xs font-medium text-slate-500 hover:text-slate-600" onClick={cancelEdit}>Huỷ</button>
        </div>
      )}
      {editing && mode === 'select' && !adding && (
        <div className="flex items-center gap-1.5">
          <select
            ref={ref as any}
            value={selectVal}
            onChange={(e) => setSelectVal(e.target.value)}
            className="input-base w-48"
          >
            <option value="">-- Chọn --</option>
            {normalizedOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            {allowAdd && <option value="__add__">+ Thêm mới…</option>}
          </select>
          {allowAdd && selectVal === '__add__' && (
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700" onClick={() => setAdding(true)}>Tiếp tục</button>
          )}
          {!allowAdd || selectVal !== '__add__' ? (
            <>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700" onClick={saveSelect}>Lưu</button>
              <button className="text-xs font-medium text-slate-500 hover:text-slate-600" onClick={cancelEdit}>Huỷ</button>
            </>
          ) : null}
        </div>
      )}
      {editing && mode === 'select' && adding && (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="Nhập giá trị mới"
            className="input-base w-48"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') cancelEdit(); }}
          />
          <button className="text-xs font-medium text-blue-600 hover:text-blue-700" onClick={handleAdd}>Thêm</button>
          <button className="text-xs font-medium text-slate-500 hover:text-slate-600" onClick={cancelEdit}>Huỷ</button>
        </div>
      )}
    </td>
  );
}
