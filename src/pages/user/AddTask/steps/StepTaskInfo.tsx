import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  Stack,
  Popover,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Typography,
} from '@mui/material';
import { Plus, ChevronDown, Trash2 } from 'lucide-react';
import { TaskRow, TaskErrors, RaciAssignment } from '../types';
import { Position } from '../../../../../types';

interface StepTaskInfoProps {
  taskRows: TaskRow[];
  taskErrors: TaskErrors;
  durationOptions: { value: number; label: string }[];
  frequencyOptions: { value: TaskRow['frequency']; label: string }[];
  totalHours: number;
  addTaskRow: () => void;
  updateTaskRow: (id: string, patch: Partial<TaskRow>) => void;
  removeTaskRow: (id: string) => void;
  selectedRelatedPositions?: string[];
  positions: Position[];
  selectedRelatedPositionIds?: string[];
}

const RACI_COLORS: Record<string, string> = {
  R: '#d32f2f',
  A: '#1976d2',
  C: '#388e3c',
  I: '#757575',
};

interface TwoStepRaciSelectorProps {
  role: 'responsible' | 'accountable' | 'consulted' | 'informed';
  roleLabel: string;
  value?: { positionId: string; name: string } | null;
  positions: Position[];
  selectedRelatedPositions?: string[];
  selectedRelatedPositionIds?: string[];
  currentRaciAssignments: {
    responsible?: { positionId: string; name: string } | null;
    accountable?: { positionId: string; name: string } | null;
    consulted?: { positionId: string; name: string } | null;
    informed?: { positionId: string; name: string } | null;
  };
  onSelect: (assignment: { positionId: string; name: string } | null) => void;
  isRequired: boolean;
}

const TwoStepRaciSelector: React.FC<TwoStepRaciSelectorProps> = ({
  role,
  roleLabel,
  value,
  positions,
  selectedRelatedPositions = [],
  selectedRelatedPositionIds = [],
  currentRaciAssignments,
  onSelect,
  isRequired,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [step, setStep] = useState<'position'>('position');

  const availablePositions = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    if (selectedRelatedPositionIds && selectedRelatedPositionIds.length > 0) {
      const filtered = positions.filter(p => selectedRelatedPositionIds.includes(p.id));
      return filtered.length > 0 ? filtered : positions;
    }

    return positions;
  }, [positions, selectedRelatedPositionIds]);

  const handleOpenDialog = () => {
    if (availablePositions.length === 0) {
      return;
    }
    setDialogOpen(true);
    setStep('position');
    setSelectedPosition(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStep('position');
    setSelectedPosition(null);
  };

  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position);
    onSelect({ positionId: position.id, name: position.name });
    handleCloseDialog();
  };

  const handleClear = () => {
    onSelect(null);
    handleCloseDialog();
  };

  const displayText = value?.name || '—';

  return (
    <>
      <Box
        onClick={handleOpenDialog}
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 0.5,
          cursor: availablePositions.length > 0 ? 'pointer' : 'not-allowed',
          backgroundColor: value ? RACI_COLORS[roleLabel] + '15' : 'transparent',
          border: '1px solid',
          borderColor: 'divider',
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: value ? RACI_COLORS[roleLabel] : 'text.disabled',
          opacity: availablePositions.length > 0 ? 1 : 0.5,
          transition: 'all 0.2s',
          '&:hover': availablePositions.length > 0 ? {
            borderColor: RACI_COLORS[roleLabel],
            backgroundColor: RACI_COLORS[roleLabel] + '20',
          } : {},
        }}
      >
        {displayText}
      </Box>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Chọn {roleLabel}
        </DialogTitle>
        
        <DialogContent>
          {step === 'position' && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Chọn chức vụ
              </Typography>
              {availablePositions.length > 0 ? (
                <List>
                  {availablePositions.map((position) => (
                    <ListItem key={position.id} disablePadding>
                      <ListItemButton onClick={() => handlePositionSelect(position)}>
                        <ListItemText primary={position.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Không còn chức vụ khả dụng cho vai trò này.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          {value && (
            <Button onClick={handleClear} color="error">
              Gỡ bỏ
            </Button>
          )}
          <Button onClick={handleCloseDialog}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

interface TaskRowMobileProps {
  row: TaskRow;
  idx: number;
  taskErrors: TaskErrors;
  frequencyOptions: { value: TaskRow['frequency']; label: string }[];
  durationOptions: { value: number; label: string }[];
  selectedRelatedPositions?: string[];
  updateTaskRow: (id: string, patch: Partial<TaskRow>) => void;
  removeTaskRow: (id: string) => void;
  commonDurations: { value: number; label: string }[];
  advancedDurations: { value: number; label: string }[];
  anchorEl: Record<string, HTMLElement | null>;
  onOpenAdvanced: (rowId: string, e: React.MouseEvent<HTMLElement>) => void;
  onCloseAdvanced: (rowId: string) => void;
  onSelectAdvanced: (rowId: string, value: number) => void;
  groupOptions: string[];
  positions: Position[];
}

const TaskRowMobile: React.FC<TaskRowMobileProps> = ({
  row,
  idx,
  taskErrors,
  frequencyOptions,
  durationOptions,
  selectedRelatedPositions = [],
  updateTaskRow,
  removeTaskRow,
  commonDurations,
  advancedDurations,
  anchorEl,
  onOpenAdvanced,
  onCloseAdvanced,
  onSelectAdvanced,
  groupOptions,
  positions,
}) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <TextField
            label={`Nhóm task ${idx + 1}`}
            value={row.groupName || ''}
            onChange={(e) => updateTaskRow(row.id, { groupName: e.target.value })}
            placeholder="VD: Vận hành hệ thống"
            fullWidth
          />
          <TextField
            label={`Tên task ${idx + 1}`}
            value={row.name}
            onChange={(e) => updateTaskRow(row.id, { name: e.target.value })}
            placeholder="VD: Backup database"
            fullWidth
            error={!!taskErrors[`task-${idx}`]}
            helperText={taskErrors[`task-${idx}`]}
          />

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Tần suất <span className="text-red-500">*</span>
            </label>
            <select
              value={row.frequency}
              onChange={(e) =>
                updateTaskRow(row.id, { frequency: e.target.value as TaskRow['frequency'] })
              }
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                taskErrors[`frequency-${idx}`] ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {frequencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {taskErrors[`frequency-${idx}`] && (
              <p className="text-red-500 text-sm mt-1">
                {taskErrors[`frequency-${idx}`]}
              </p>
            )}
            {!taskErrors[`frequency-${idx}`] && (
              <p className="text-gray-500 text-sm mt-1">Chọn tần suất lặp</p>
            )}
          </div>

          <FormControl fullWidth error={!!taskErrors[`duration-${idx}`]}>
            <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
              Thời gian thực hiện
            </FormLabel>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <ToggleButtonGroup
                value={
                  commonDurations.some((opt) => opt.value === row.duration)
                    ? row.duration
                    : null
                }
                exclusive
                onChange={(_, value) => {
                  if (value !== null) {
                    updateTaskRow(row.id, { duration: value });
                  }
                }}
                size="small"
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  '& .MuiToggleButton-root': {
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 2,
                    py: 0.75,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                {commonDurations.map((opt) => (
                  <ToggleButton key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Button
                size="small"
                variant={row.duration > 3 ? 'contained' : 'outlined'}
                onClick={(e) => onOpenAdvanced(row.id, e)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: row.duration > 3 ? 600 : 500,
                  px: 2,
                  py: 0.75,
                  minWidth: 'auto',
                }}
                endIcon={<ChevronDown size={14} />}
              >
                {row.duration > 3
                  ? durationOptions.find((o) => o.value === row.duration)?.label
                  : 'Khác'}
              </Button>

              <Menu
                anchorEl={anchorEl[row.id]}
                open={Boolean(anchorEl[row.id])}
                onClose={() => onCloseAdvanced(row.id)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                {advancedDurations.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    onClick={() => onSelectAdvanced(row.id, opt.value)}
                    selected={row.duration === opt.value}
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: row.duration === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <FormHelperText>
              {taskErrors[`duration-${idx}`] || 'Chọn theo đơn vị 30 phút'}
            </FormHelperText>
          </FormControl>

          <TextField
            label="Đối tác"
            value={row.partner || ''}
            onChange={(e) => updateTaskRow(row.id, { partner: e.target.value })}
            placeholder="Nhập tên đối tác (tùy chọn)"
            fullWidth
          />

          <Box>
            <FormLabel sx={{ mb: 1.5, fontSize: '0.875rem', fontWeight: 600, display: 'block' }}>
              Phân công (RACI)
            </FormLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  R (Thực hiện)
                </Box>
                <TwoStepRaciSelector
                  role="responsible"
                  roleLabel="R"
                  value={row.raci.responsible}
                  positions={positions}
                  selectedRelatedPositions={selectedRelatedPositions}
                  currentRaciAssignments={row.raci}
                  onSelect={(assignment) =>
                    updateTaskRow(row.id, { raci: { ...row.raci, responsible: assignment } })
                  }
                  isRequired
                />
              </Box>
              <Box>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  A (Chịu trách nhiệm)
                </Box>
                <TwoStepRaciSelector
                  role="accountable"
                  roleLabel="A"
                  value={row.raci.accountable}
                  positions={positions}
                  selectedRelatedPositions={selectedRelatedPositions}
                  currentRaciAssignments={row.raci}
                  onSelect={(assignment) =>
                    updateTaskRow(row.id, { raci: { ...row.raci, accountable: assignment } })
                  }
                  isRequired={false}
                />
              </Box>
              <Box>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  C (Tham khảo)
                </Box>
                <TwoStepRaciSelector
                  role="consulted"
                  roleLabel="C"
                  value={row.raci.consulted}
                  positions={positions}
                  selectedRelatedPositions={selectedRelatedPositions}
                  currentRaciAssignments={row.raci}
                  onSelect={(assignment) =>
                    updateTaskRow(row.id, { raci: { ...row.raci, consulted: assignment } })
                  }
                  isRequired={false}
                />
              </Box>
              <Box>
                <Box sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  I (Thông báo)
                </Box>
                <TwoStepRaciSelector
                  role="informed"
                  roleLabel="I"
                  value={row.raci.informed}
                  positions={positions}
                  selectedRelatedPositions={selectedRelatedPositions}
                  currentRaciAssignments={row.raci}
                  onSelect={(assignment) =>
                    updateTaskRow(row.id, { raci: { ...row.raci, informed: assignment } })
                  }
                  isRequired={false}
                />
              </Box>
            </Box>
            {taskErrors[`raci-${idx}`] && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {taskErrors[`raci-${idx}`]}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => removeTaskRow(row.id)}
              disabled={false}
              startIcon={<Trash2 size={16} />}
            >
              Xóa
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const StepTaskInfo: React.FC<StepTaskInfoProps> = ({
  taskRows,
  taskErrors,
  durationOptions,
  frequencyOptions,
  totalHours,
  addTaskRow,
  updateTaskRow,
  removeTaskRow,
  selectedRelatedPositions = [],
  selectedRelatedPositionIds = [],
  positions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const commonDurations = durationOptions.filter((opt) =>
    [0.5, 1, 1.5, 2, 3].includes(opt.value)
  );
  const advancedDurations = durationOptions.filter((opt) => opt.value > 3);

  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});

  const handleOpenAdvanced = (rowId: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl((prev) => ({ ...prev, [rowId]: event.currentTarget }));
  };

  const handleCloseAdvanced = (rowId: string) => {
    setAnchorEl((prev) => ({ ...prev, [rowId]: null }));
  };

  const handleSelectAdvanced = (rowId: string, value: number) => {
    updateTaskRow(rowId, { duration: value });
    handleCloseAdvanced(rowId);
  };

  const groupOptions = useMemo(
    () => Array.from(new Set(taskRows.map((r) => r.groupName).filter((g): g is string => !!g))),
    [taskRows]
  );

  useEffect(() => {
    if (!selectedRelatedPositionIds || selectedRelatedPositionIds.length === 0) return;

    const selectedPositionIdSet = new Set(selectedRelatedPositionIds);
    taskRows.forEach(row => {
      const updates: Partial<TaskRow> = { raci: { ...row.raci } };
      let hasChanges = false;

      if (row.raci.responsible) {
        const posId = row.raci.responsible.positionId;
        if (!selectedPositionIdSet.has(posId)) {
          updates.raci!.responsible = null;
          hasChanges = true;
        }
      }
      if (row.raci.accountable) {
        const posId = row.raci.accountable.positionId;
        if (!selectedPositionIdSet.has(posId)) {
          updates.raci!.accountable = null;
          hasChanges = true;
        }
      }
      if (row.raci.consulted) {
        const posId = row.raci.consulted.positionId;
        if (!selectedPositionIdSet.has(posId)) {
          updates.raci!.consulted = null;
          hasChanges = true;
        }
      }
      if (row.raci.informed) {
        const posId = row.raci.informed.positionId;
        if (!selectedPositionIdSet.has(posId)) {
          updates.raci!.informed = null;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        updateTaskRow(row.id, updates);
      }
    });
  }, [selectedRelatedPositionIds, taskRows, updateTaskRow]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Danh sách task</h3>
        <button
          onClick={addTaskRow}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          THÊM TASK
        </button>
      </div>
      <div className="p-6">
        {isMobile ? (
          <Stack spacing={2}>
            {taskRows.map((row, idx) => (
              <TaskRowMobile
                key={row.id}
                row={row}
                idx={idx}
                taskErrors={taskErrors}
                frequencyOptions={frequencyOptions}
                durationOptions={durationOptions}
                selectedRelatedPositions={selectedRelatedPositions}
                updateTaskRow={updateTaskRow}
                removeTaskRow={removeTaskRow}
                commonDurations={commonDurations}
                advancedDurations={advancedDurations}
                anchorEl={anchorEl}
                onOpenAdvanced={handleOpenAdvanced}
                onCloseAdvanced={handleCloseAdvanced}
                onSelectAdvanced={handleSelectAdvanced}
                groupOptions={groupOptions}
                positions={positions}
              />
            ))}
          </Stack>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700" style={{ width: '16%' }}>
                    Nhóm task
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700" style={{ width: '20%' }}>
                    Tên task
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700" style={{ width: '12%' }}>
                    Tần suất
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700" style={{ width: '12%' }}>
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700" style={{ width: '14%' }}>
                    Đối tác
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700" style={{ width: '8%' }}>
                    R
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700" style={{ width: '8%' }}>
                    A
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700" style={{ width: '8%' }}>
                    C
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700" style={{ width: '8%' }}>
                    I
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700" style={{ width: '6%' }}>
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {taskRows.map((row, idx) => (
                  <React.Fragment key={row.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.groupName || ''}
                        onChange={(e) => updateTaskRow(row.id, { groupName: e.target.value })}
                        placeholder="Nhập nhóm task"
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateTaskRow(row.id, { name: e.target.value })}
                        placeholder="Task name"
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          taskErrors[`task-${idx}`] ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      {taskErrors[`task-${idx}`] && (
                        <p className="mt-1 text-xs text-red-500">{taskErrors[`task-${idx}`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.frequency}
                        onChange={(e) =>
                          updateTaskRow(row.id, {
                            frequency: e.target.value as TaskRow['frequency'],
                          })
                        }
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          taskErrors[`frequency-${idx}`] ? 'border-red-500' : 'border-slate-200'
                        }`}
                      >
                        {frequencyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                          {commonDurations.slice(0, 3).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateTaskRow(row.id, { duration: opt.value })}
                              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                                row.duration === opt.value
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {opt.value}h
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={(e) => handleOpenAdvanced(row.id, e)}
                          className={`flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                            row.duration > 3
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {row.duration > 3 ? `${row.duration}h` : 'Khác'}
                          <ChevronDown size={12} />
                        </button>
                        <Menu
                          anchorEl={anchorEl[row.id]}
                          open={Boolean(anchorEl[row.id])}
                          onClose={() => handleCloseAdvanced(row.id)}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        >
                          {advancedDurations.map((opt) => (
                            <Box
                              key={opt.value}
                              onClick={() => handleSelectAdvanced(row.id, opt.value)}
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                backgroundColor: row.duration === opt.value ? 'action.selected' : 'transparent',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              {opt.label}
                            </Box>
                          ))}
                        </Menu>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.partner || ''}
                        onChange={(e) => updateTaskRow(row.id, { partner: e.target.value })}
                        placeholder="Tên đối tác"
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TwoStepRaciSelector
                        role="responsible"
                        roleLabel="R"
                        value={row.raci.responsible}
                        positions={positions}
                        selectedRelatedPositions={selectedRelatedPositions}
                        selectedRelatedPositionIds={selectedRelatedPositionIds}
                        currentRaciAssignments={row.raci}
                        onSelect={(assignment) =>
                          updateTaskRow(row.id, {
                            raci: { ...row.raci, responsible: assignment },
                          })
                        }
                        isRequired
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TwoStepRaciSelector
                        role="accountable"
                        roleLabel="A"
                        value={row.raci.accountable}
                        positions={positions}
                        selectedRelatedPositions={selectedRelatedPositions}
                        selectedRelatedPositionIds={selectedRelatedPositionIds}
                        currentRaciAssignments={row.raci}
                        onSelect={(assignment) =>
                          updateTaskRow(row.id, {
                            raci: { ...row.raci, accountable: assignment },
                          })
                        }
                        isRequired={false}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TwoStepRaciSelector
                        role="consulted"
                        roleLabel="C"
                        value={row.raci.consulted}
                        positions={positions}
                        selectedRelatedPositions={selectedRelatedPositions}
                        selectedRelatedPositionIds={selectedRelatedPositionIds}
                        currentRaciAssignments={row.raci}
                        onSelect={(assignment) =>
                          updateTaskRow(row.id, {
                            raci: { ...row.raci, consulted: assignment },
                          })
                        }
                        isRequired={false}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TwoStepRaciSelector
                        role="informed"
                        roleLabel="I"
                        value={row.raci.informed}
                        positions={positions}
                        selectedRelatedPositions={selectedRelatedPositions}
                        selectedRelatedPositionIds={selectedRelatedPositionIds}
                        currentRaciAssignments={row.raci}
                        onSelect={(assignment) =>
                          updateTaskRow(row.id, {
                            raci: { ...row.raci, informed: assignment },
                          })
                        }
                        isRequired={false}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeTaskRow(row.id)}
                        disabled={taskRows.length === 1}
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  {taskErrors[`raci-${idx}`] && (
                    <tr>
                      <td colSpan={10} className="px-4 py-2 text-xs text-red-600 bg-red-50">
                        {taskErrors[`raci-${idx}`]}
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`mt-4 px-4 py-3 rounded-lg ${totalHours > 8 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className="text-sm text-slate-700">
            Tổng số giờ/ngày (EstimatedHours): <strong className="text-slate-900">{totalHours}h</strong>{' '}
            {totalHours > 8 && <span className="text-amber-700">- Vượt 8h, cần cân nhắc lại tải công việc.</span>}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Giá trị này sẽ được lưu vào trường EstimatedHours của mỗi task.
          </p>
        </div>
      </div>
    </div>
  );
};
