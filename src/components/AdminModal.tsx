'use client';

import React, { useState } from 'react';
import { User, UserRole, EmrApiConfig, Department, StaffMember, StaffRole } from '@/types/journey';
import { 
  X, Users, Key, ShieldCheck, Globe, Clock, Check, 
  AlertTriangle, RefreshCw, Plus, Trash2, Edit2, Shield, Radio, CheckCircle2,
  Building2, UserCheck, Phone, Stethoscope, Eye, EyeOff
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSaveDepartments: (departments: Department[]) => void;
  users: User[];
  onSaveUsers: (users: User[]) => void;
  staffRoster: StaffMember[];
  onSaveStaffRoster: (roster: StaffMember[]) => void;
  emrConfig: EmrApiConfig;
  onSaveEmrConfig: (config: EmrApiConfig) => void;
  onSimulateEpicCase: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSaveDepartments,
  users,
  onSaveUsers,
  staffRoster,
  onSaveStaffRoster,
  emrConfig,
  onSaveEmrConfig,
  onSimulateEpicCase
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'departments' | 'users' | 'roster' | 'emr' | 'turnover'>('departments');
  const [localDepartments, setLocalDepartments] = useState<Department[]>(departments);
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [localStaff, setLocalStaff] = useState<StaffMember[]>(staffRoster);
  const [localEmrConfig, setLocalEmrConfig] = useState<EmrApiConfig>(emrConfig);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string; pingMs?: number }>({ status: 'idle' });

  // === DEPARTMENT FORM STATE ===
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptActive, setDeptActive] = useState(true);

  // === USER ACCOUNT FORM STATE ===
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('board_runner');
  const [userPin, setUserPin] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userActive, setUserActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // === STAFF ROSTER FORM STATE ===
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffDisplayName, setStaffDisplayName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('Circulator RN');
  const [staffHome, setStaffHome] = useState('Main OR');
  const [staffCell, setStaffCell] = useState('');
  const [staffActive, setStaffActive] = useState(true);
  const [rosterFilterRole, setRosterFilterRole] = useState<string>('all');

  // --- Department Handlers ---
  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    if (editingDeptId) {
      const updated = localDepartments.map(d => 
        d.id === editingDeptId 
          ? { ...d, name: deptName.trim(), code: deptCode.trim().toUpperCase(), description: deptDesc.trim(), active: deptActive }
          : d
      );
      setLocalDepartments(updated);
      onSaveDepartments(updated);
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        description: deptDesc.trim(),
        active: deptActive,
        displayOrder: localDepartments.length + 1
      };
      const updated = [...localDepartments, newDept];
      setLocalDepartments(updated);
      onSaveDepartments(updated);
    }

    setEditingDeptId(null);
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    setDeptActive(true);
  };

  const handleEditDept = (dept: Department) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDesc(dept.description || '');
    setDeptActive(dept.active);
  };

  const handleDeleteDept = (deptId: string) => {
    if (deptId === 'dept-all') return; // Cannot delete All Departments
    const updated = localDepartments.filter(d => d.id !== deptId);
    setLocalDepartments(updated);
    onSaveDepartments(updated);
    if (editingDeptId === deptId) setEditingDeptId(null);
  };

  // --- User Account Handlers ---
  const handleSaveUserAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDisplayName.trim()) return;

    const formattedUsername = userUsername.trim() || userDisplayName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (editingUserId) {
      const updated = localUsers.map(u => 
        u.id === editingUserId 
          ? { 
              ...u, 
              displayName: userDisplayName.trim(), 
              username: formattedUsername, 
              role: userRole, 
              pin: userPin.trim(), 
              password: userPassword.trim() || undefined,
              active: userActive 
            }
          : u
      );
      setLocalUsers(updated);
      onSaveUsers(updated);
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        username: formattedUsername,
        displayName: userDisplayName.trim(),
        role: userRole,
        pin: userPin.trim(),
        password: userPassword.trim() || undefined,
        active: userActive
      };
      const updated = [...localUsers, newUser];
      setLocalUsers(updated);
      onSaveUsers(updated);
    }

    setEditingUserId(null);
    setUserDisplayName('');
    setUserUsername('');
    setUserRole('board_runner');
    setUserPin('');
    setUserPassword('');
    setUserActive(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserDisplayName(user.displayName);
    setUserUsername(user.username);
    setUserRole(user.role);
    setUserPin(user.pin || '');
    setUserPassword(user.password || '');
    setUserActive(user.active !== false);
  };

  const handleDeleteUser = (userId: string) => {
    const updated = localUsers.filter(u => u.id !== userId);
    setLocalUsers(updated);
    onSaveUsers(updated);
    if (editingUserId === userId) setEditingUserId(null);
  };

  // --- Staff Roster Handlers ---
  const handleSaveStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const formattedDisplayName = staffDisplayName.trim() || staffName.trim();

    if (editingStaffId) {
      const updated = localStaff.map(s => 
        s.id === editingStaffId
          ? {
              ...s,
              staffName: staffName.trim(),
              displayName: formattedDisplayName,
              role: staffRole,
              environmentHome: staffHome,
              cell: staffCell.trim(),
              active: staffActive
            }
          : s
      );
      setLocalStaff(updated);
      onSaveStaffRoster(updated);
    } else {
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        staffName: staffName.trim(),
        displayName: formattedDisplayName,
        role: staffRole,
        environmentHome: staffHome,
        cell: staffCell.trim(),
        active: staffActive
      };
      const updated = [...localStaff, newStaff];
      setLocalStaff(updated);
      onSaveStaffRoster(updated);
    }

    setEditingStaffId(null);
    setStaffName('');
    setStaffDisplayName('');
    setStaffRole('Circulator RN');
    setStaffHome('Main OR');
    setStaffCell('');
    setStaffActive(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setStaffName(staff.staffName);
    setStaffDisplayName(staff.displayName);
    setStaffRole(staff.role);
    setStaffHome(staff.environmentHome);
    setStaffCell(staff.cell);
    setStaffActive(staff.active !== false);
  };

  const handleDeleteStaff = (staffId: string) => {
    const updated = localStaff.filter(s => s.id !== staffId);
    setLocalStaff(updated);
    onSaveStaffRoster(updated);
    if (editingStaffId === staffId) setEditingStaffId(null);
  };

  // --- EMR Gateway Ping ---
  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    const startTime = performance.now();
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/journey';
    try {
      const res = await fetch(`${basePath}/api/epic/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true })
      });
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          status: 'success',
          message: `Connected successfully to Epic OpTime Gateway (${data.service}). Latency: ${elapsed}ms.`,
          pingMs: elapsed
        });
        const updatedConfig = { ...localEmrConfig, status: 'connected' as const, lastPingTime: new Date().toLocaleTimeString() };
        setLocalEmrConfig(updatedConfig);
        onSaveEmrConfig(updatedConfig);
      } else {
        setTestResult({ status: 'error', message: 'Connection failed with HTTP ' + res.status });
      }
    } catch (err: any) {
      setTestResult({ status: 'error', message: err?.message || 'Network unreachable' });
    }
  };

  const filteredStaff = rosterFilterRole === 'all'
    ? localStaff
    : localStaff.filter(s => s.role === rosterFilterRole);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 940, height: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--accent-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Perfect Journey Command & Admin Center
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Departments • User Accounts & Roles • Site Staff Roster • Epic OpTime Gateway • Turnover Rules
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '0 20px',
          gap: 12,
          overflowX: 'auto'
        }}>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'departments' ? '3px solid var(--accent-primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'departments' ? 800 : 600,
              color: activeTab === 'departments' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13
            }}
          >
            <Building2 size={16} />
            <span>Departments ({localDepartments.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'users' ? '3px solid var(--accent-primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'users' ? 800 : 600,
              color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13
            }}
          >
            <Users size={16} />
            <span>User Accounts & Roles ({localUsers.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'roster' ? '3px solid var(--accent-primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'roster' ? 800 : 600,
              color: activeTab === 'roster' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13
            }}
          >
            <UserCheck size={16} />
            <span>Site Staff Roster ({localStaff.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'emr' ? 'active' : ''}`}
            onClick={() => setActiveTab('emr')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'emr' ? '3px solid var(--accent-primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'emr' ? 800 : 600,
              color: activeTab === 'emr' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13
            }}
          >
            <Globe size={16} />
            <span>EMR & OpTime Gateway</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'turnover' ? 'active' : ''}`}
            onClick={() => setActiveTab('turnover')}
            style={{
              padding: '12px 14px',
              borderBottom: activeTab === 'turnover' ? '3px solid var(--accent-primary)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'turnover' ? 800 : 600,
              color: activeTab === 'turnover' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13
            }}
          >
            <Clock size={16} />
            <span>OR Turnover Rules</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          
          {/* ========================================================================= */}
          {/* 1. DEPARTMENTS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>Perioperative Systems & Departments</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Configure the hospital departments accessible via the top-tier Department Switcher.
                  </p>
                </div>
              </div>

              {/* Add / Edit Form */}
              <form onSubmit={handleSaveDepartment} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {editingDeptId ? 'Edit Department' : 'Add New Department'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Department Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main OR, Ortho OR"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Department Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MAIN_OR, ORTHO"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Description / Scope
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Inpatient surgical suites"
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={deptActive}
                      onChange={(e) => setDeptActive(e.target.checked)}
                    />
                    <span>Active in Department Switcher</span>
                  </label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {editingDeptId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeptId(null);
                          setDeptName('');
                          setDeptCode('');
                          setDeptDesc('');
                          setDeptActive(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          background: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Plus size={14} />
                      <span>{editingDeptId ? 'Update Department' : 'Add Department'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Department Table */}
              <div style={{
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-header)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Department</th>
                      <th style={{ padding: '10px 14px' }}>Code</th>
                      <th style={{ padding: '10px 14px' }}>Scope / Description</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localDepartments.map((dept) => (
                      <tr key={dept.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {dept.name}
                          {dept.id === 'dept-all' && (
                            <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-card)', color: 'var(--accent-primary)', border: '1px solid var(--border-medium)' }}>
                              GLOBAL
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {dept.code}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
                          {dept.description || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: dept.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: dept.active ? '#22c55e' : '#ef4444'
                          }}>
                            {dept.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleEditDept(dept)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-primary)' }}
                              title="Edit department"
                            >
                              <Edit2 size={13} />
                            </button>
                            {dept.id !== 'dept-all' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDept(dept.id)}
                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', cursor: 'pointer', color: '#ef4444' }}
                                title="Remove department"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. USER ACCOUNTS & ROLES TAB */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>User Accounts & Access Levels</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Manage accounts with 4-digit PIN access for rapid touchscreen login, or optional password authentication.
                </p>
              </div>

              {/* Add / Edit User Form */}
              <form onSubmit={handleSaveUserAccount} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {editingUserId ? 'Edit User Account' : 'Add New User Account'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Display Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Peter Alaniz"
                      value={userDisplayName}
                      onChange={(e) => setUserDisplayName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. palaniz"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      System Access Role *
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as UserRole)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    >
                      <option value="board_runner">Board Runner (Ext & Logistics)</option>
                      <option value="anesthesia">Anesthesiologist (Staff MD)</option>
                      <option value="charge_rn">Charge RN (Perioperative Lead)</option>
                      <option value="circulator">Circulating RN / Scrub</option>
                      <option value="superuser">OR Director (Superuser)</option>
                      <option value="basic_viewer">Basic Viewer (Clinical Display Only)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      4-Digit PIN (Fast Login)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={userPin}
                      onChange={(e) => setUserPin(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Password (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Optional password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 32px 8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--surface-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 13
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userActive}
                      onChange={(e) => setUserActive(e.target.checked)}
                    />
                    <span>Account Active</span>
                  </label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(null);
                          setUserDisplayName('');
                          setUserUsername('');
                          setUserRole('board_runner');
                          setUserPin('');
                          setUserPassword('');
                          setUserActive(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          background: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Plus size={14} />
                      <span>{editingUserId ? 'Update User' : 'Save User Account'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Users Table */}
              <div style={{
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-header)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Display Name</th>
                      <th style={{ padding: '10px 14px' }}>Username</th>
                      <th style={{ padding: '10px 14px' }}>Access Role</th>
                      <th style={{ padding: '10px 14px' }}>PIN</th>
                      <th style={{ padding: '10px 14px' }}>Password</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {u.displayName}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {u.username}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 11,
                            fontWeight: 700,
                            background: u.role === 'superuser' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: u.role === 'superuser' ? 'var(--phase-closing-bg)' : 'var(--accent-primary)'
                          }}>
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {u.pin ? '•••• (' + u.pin + ')' : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                          {u.password ? 'Configured' : 'PIN Only'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: u.active !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: u.active !== false ? '#22c55e' : '#ef4444'
                          }}>
                            {u.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleEditUser(u)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-primary)' }}
                              title="Edit user"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', cursor: 'pointer', color: '#ef4444' }}
                              title="Delete user"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SITE STAFF ROSTER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'roster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>Site Staff Roster</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Clinical staff directory used for room staffing assignments, Gantt staff boxes, and communications.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Role Filter:</span>
                  <select
                    value={rosterFilterRole}
                    onChange={(e) => setRosterFilterRole(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      fontSize: 12
                    }}
                  >
                    <option value="all">All Roles ({localStaff.length})</option>
                    <option value="Anesthesiologist">Anesthesiologists</option>
                    <option value="CRNA">CRNAs</option>
                    <option value="Circulator RN">Circulators (RN)</option>
                    <option value="Scrub Tech">Scrub Techs</option>
                    <option value="Anes Tech">Anes Techs</option>
                    <option value="Pre-Op RN">Pre-Op Nurses</option>
                    <option value="PACU RN">PACU Nurses</option>
                  </select>
                </div>
              </div>

              {/* Add / Edit Staff Form */}
              <form onSubmit={handleSaveStaffMember} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {editingStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Full Staff Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Peter Alaniz, MD"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Display Name (Board)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alaniz, P (MD)"
                      value={staffDisplayName}
                      onChange={(e) => setStaffDisplayName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Clinical Role *
                    </label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    >
                      <option value="Anesthesiologist">Anesthesiologist (MD)</option>
                      <option value="CRNA">CRNA</option>
                      <option value="Circulator RN">Circulator RN</option>
                      <option value="Scrub Tech">Scrub Tech (CST)</option>
                      <option value="Anes Tech">Anesthesia Tech</option>
                      <option value="Pre-Op RN">Pre-Op RN</option>
                      <option value="PACU RN">PACU RN</option>
                      <option value="Phase II RN">Phase II RN</option>
                      <option value="Board Runner">Board Runner</option>
                      <option value="Other">Other Clinical Staff</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Environment Home *
                    </label>
                    <select
                      value={staffHome}
                      onChange={(e) => setStaffHome(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    >
                      {localDepartments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      <option value="Pre-Op Holding">Pre-Op Holding</option>
                      <option value="PACU">PACU (Phase I)</option>
                      <option value="Phase II">Phase II / Lounge</option>
                      <option value="All Environments">All Environments (Float)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Cell / Pager
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. x5501 / (713) 555-0101"
                      value={staffCell}
                      onChange={(e) => setStaffCell(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={staffActive}
                      onChange={(e) => setStaffActive(e.target.checked)}
                    />
                    <span>Active on Roster</span>
                  </label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {editingStaffId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffId(null);
                          setStaffName('');
                          setStaffDisplayName('');
                          setStaffRole('Circulator RN');
                          setStaffHome('Main OR');
                          setStaffCell('');
                          setStaffActive(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          background: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Plus size={14} />
                      <span>{editingStaffId ? 'Update Staff Member' : 'Save Staff Member'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Staff Table */}
              <div style={{
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-header)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Staff Name</th>
                      <th style={{ padding: '10px 14px' }}>Display (Board)</th>
                      <th style={{ padding: '10px 14px' }}>Role</th>
                      <th style={{ padding: '10px 14px' }}>Environment Home</th>
                      <th style={{ padding: '10px 14px' }}>Cell / Contact</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {staff.staffName}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {staff.displayName}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 11,
                            fontWeight: 700,
                            background: staff.role.includes('MD') || staff.role === 'Anesthesiologist' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: staff.role.includes('MD') || staff.role === 'Anesthesiologist' ? 'var(--accent-primary)' : '#10b981'
                          }}>
                            {staff.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                          {staff.environmentHome}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {staff.cell || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: staff.active !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: staff.active !== false ? '#22c55e' : '#ef4444'
                          }}>
                            {staff.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleEditStaff(staff)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-primary)' }}
                              title="Edit staff member"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', cursor: 'pointer', color: '#ef4444' }}
                              title="Delete staff member"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. EMR & OPTIME GATEWAY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'emr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Hospital EMR Integration (Epic OpTime Gateway)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Connect Perfect Journey directly to Epic OpTime HL7 SIU/ADT or FHIR R4 interfaces for live surgical telemetry.
                </p>
              </div>

              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>Gateway Connection Status</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Facility: {localEmrConfig.facilityCode}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testResult.status === 'testing'}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <RefreshCw size={14} className={testResult.status === 'testing' ? 'spin' : ''} />
                    <span>{testResult.status === 'testing' ? 'Testing Link...' : 'Test Epic Gateway Link'}</span>
                  </button>
                </div>

                {testResult.message && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 600,
                    background: testResult.status === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: testResult.status === 'success' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${testResult.status === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    {testResult.message}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={onSimulateEpicCase}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--surface-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Radio size={14} style={{ color: 'var(--alert-red)' }} />
                    <span>Simulate Inbound Epic HL7 Add-On Case</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. OR TURNOVER RULES TAB */}
          {/* ========================================================================= */}
          {activeTab === 'turnover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Operating Room Turnover Buffer Rules</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Enforce minimum room decontamination and setup time intervals between consecutive surgical cases.
                </p>
              </div>

              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Mandatory Minimum Room Turnover Buffer (Minutes)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={5}
                      value={localEmrConfig.minTurnoverBufferMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        const updated = { ...localEmrConfig, minTurnoverBufferMinutes: val };
                        setLocalEmrConfig(updated);
                        onSaveEmrConfig(updated);
                      }}
                      style={{
                        width: 100,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Minutes required between Wheels Out of previous case and Wheels In of next case.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
