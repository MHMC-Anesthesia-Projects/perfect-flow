'use client';

import React, { useState } from 'react';
import { User, UserRole, EmrApiConfig, EpicPatientCase } from '@/types/flow';
import { 
  X, Users, Key, ShieldCheck, Globe, Clock, Check, 
  AlertTriangle, RefreshCw, Plus, Trash2, Edit2, Shield, Radio, CheckCircle2 
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSaveUsers: (users: User[]) => void;
  emrConfig: EmrApiConfig;
  onSaveEmrConfig: (config: EmrApiConfig) => void;
  onSimulateEpicCase: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  users,
  onSaveUsers,
  emrConfig,
  onSaveEmrConfig,
  onSimulateEpicCase
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'users' | 'emr' | 'turnover'>('users');
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [localEmrConfig, setLocalEmrConfig] = useState<EmrApiConfig>(emrConfig);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string; pingMs?: number }>({ status: 'idle' });

  // Add User Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('board_runner');
  const [newUserPin, setNewUserPin] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || newUserPin.length !== 4) return;

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: newUserName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      displayName: newUserName.trim(),
      role: newUserRole,
      pin: newUserPin
    };

    const updated = [...localUsers, newUser];
    setLocalUsers(updated);
    onSaveUsers(updated);

    setNewUserName('');
    setNewUserPin('');
  };

  const handleUpdatePin = (userId: string, newPin: string) => {
    if (newPin.length <= 4 && /^\d*$/.test(newPin)) {
      const updated = localUsers.map(u => u.id === userId ? { ...u, pin: newPin } : u);
      setLocalUsers(updated);
      onSaveUsers(updated);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = localUsers.filter(u => u.id !== userId);
    setLocalUsers(updated);
    onSaveUsers(updated);
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    const startTime = performance.now();
    try {
      const res = await fetch('/api/epic/sync', {
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 840, height: '85vh', display: 'flex', flexDirection: 'column' }}
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
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--accent-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase' }}>
                Perfect Flow Command & Admin Center
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                User PINs & Roles • Epic OpTime EMR Integration • OR Turnover Buffer Rules
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '0 20px',
          gap: 16
        }}>
          {[
            { id: 'users', label: '1. User Roles & PIN Pad Access', icon: Users },
            { id: 'emr', label: '2. Epic OpTime EMR Gateway', icon: Globe },
            { id: 'turnover', label: '3. Turnover Safety & Scheduling Rules', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '12px 4px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  background: 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* TAB 1: USERS & PIN MANAGEMENT */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Users list table */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--surface-card)',
                  borderBottom: '1px solid var(--border-medium)',
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 60px'
                }}>
                  <span>Staff / Role Name</span>
                  <span>System Role</span>
                  <span>4-Digit Touch PIN</span>
                  <span style={{ textAlign: 'right' }}>Action</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {localUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-light)',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr 60px',
                        alignItems: 'center',
                        fontSize: 13
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {user.displayName}
                      </div>

                      <div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: user.role === 'superuser' ? 'rgba(220, 38, 38, 0.15)' :
                                      user.role === 'board_runner' ? 'rgba(2, 132, 199, 0.15)' :
                                      user.role === 'anesthesia' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-card)',
                          color: user.role === 'superuser' ? 'var(--alert-red)' :
                                 user.role === 'board_runner' ? 'var(--accent-primary)' :
                                 user.role === 'anesthesia' ? 'var(--phase-surgery-bg)' : 'var(--text-secondary)',
                          fontSize: 11,
                          fontWeight: 800
                        }}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <input
                          type="text"
                          maxLength={4}
                          value={user.pin}
                          onChange={(e) => handleUpdatePin(user.id, e.target.value)}
                          placeholder="None"
                          style={{
                            width: 70,
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--border-medium)',
                            background: 'var(--surface-card)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            textAlign: 'center',
                            fontSize: 13
                          }}
                        />
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {user.role !== 'superuser' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--alert-red)',
                              cursor: 'pointer',
                              padding: 4
                            }}
                            title="Remove user"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New User */}
              <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>
                  + Add New Clinical User
                </div>
                <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px auto', gap: 10 }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Schmidt, K (Surgeon)"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  />

                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="board_runner">Board Runner</option>
                    <option value="anesthesia">Anesthesiologist</option>
                    <option value="charge_rn">Charge RN</option>
                    <option value="circulator">Circulator RN</option>
                    <option value="superuser">Superuser</option>
                    <option value="basic_viewer">Basic Viewer</option>
                  </select>

                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="4-digit PIN"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: 13 }}
                  />

                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={15} /> Add User
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: EMR / EPIC OPTIME GATEWAY */}
          {activeTab === 'emr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Connection Status Banner */}
              <div style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: localEmrConfig.status === 'connected' ? 'var(--phase-surgery-bg)' : '#f59e0b',
                    boxShadow: '0 0 8px rgba(22, 163, 74, 0.8)'
                  }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>
                      EMR Interface Status: <span style={{ color: 'var(--phase-surgery-bg)' }}>ONLINE & ACTIVE</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Hospital Facility: {localEmrConfig.facilityCode} • Last Ping: {localEmrConfig.lastPingTime || 'Active'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <RefreshCw size={14} className={testResult.status === 'testing' ? 'animate-spin' : ''} />
                  <span>Test Connection</span>
                </button>
              </div>

              {testResult.message && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: testResult.status === 'success' ? 'rgba(22, 163, 74, 0.15)' : 'var(--alert-red-light)',
                  border: `1px solid ${testResult.status === 'success' ? 'var(--phase-surgery-bg)' : 'var(--alert-red)'}`,
                  color: testResult.status === 'success' ? 'var(--phase-surgery-bg)' : 'var(--alert-red)',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {testResult.message}
                </div>
              )}

              {/* Epic OpTime API Details */}
              <div style={{
                background: 'var(--surface-subtle)',
                padding: 18,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16
              }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>EMR Provider</label>
                  <select
                    value={localEmrConfig.provider}
                    onChange={(e) => {
                      const updated = { ...localEmrConfig, provider: e.target.value as any };
                      setLocalEmrConfig(updated);
                      onSaveEmrConfig(updated);
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="epic_optime">Epic OpTime (FHIR / HL7 Interface)</option>
                    <option value="cerner_surginet">Oracle Cerner SurgiNet</option>
                    <option value="meditech">MEDITECH Expanse OR</option>
                    <option value="custom_fhir">Custom HL7 / FHIR Gateway</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Facility Code</label>
                  <input
                    type="text"
                    value={localEmrConfig.facilityCode}
                    onChange={(e) => {
                      const updated = { ...localEmrConfig, facilityCode: e.target.value };
                      setLocalEmrConfig(updated);
                      onSaveEmrConfig(updated);
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>FHIR / Interconnect Endpoint URL</label>
                  <input
                    type="text"
                    value={localEmrConfig.endpointUrl}
                    onChange={(e) => {
                      const updated = { ...localEmrConfig, endpointUrl: e.target.value };
                      setLocalEmrConfig(updated);
                      onSaveEmrConfig(updated);
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Client Application ID</label>
                  <input
                    type="text"
                    value={localEmrConfig.clientId}
                    onChange={(e) => {
                      const updated = { ...localEmrConfig, clientId: e.target.value };
                      setLocalEmrConfig(updated);
                      onSaveEmrConfig(updated);
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Client Secret (Masked)</label>
                  <input
                    type="text"
                    value={localEmrConfig.clientSecretMasked}
                    disabled
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Simulation Engine Action */}
              <div style={{
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid var(--accent-border)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    Trigger Simulated Epic Incoming Add-On Case
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Simulates an HL7 / FHIR event payload from Epic OpTime creating a new emergency Add-On case on the live board.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSimulateEpicCase();
                    onClose();
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Simulate Epic Ingest
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TURNOVER SAFETY RULES */}
          {activeTab === 'turnover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid var(--alert-red-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                gap: 12
              }}>
                <AlertTriangle size={24} style={{ color: 'var(--alert-red)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--alert-red)' }}>
                    Mandatory 15-Minute Room Turnover Buffer Rule (Active)
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.4 }}>
                    To ensure surgical suite infection control, instrument decontamination, and tray count safety, 
                    the system blocks any case booking or time adjustment that leaves less than <strong>15 minutes</strong> between 
                    the previous case's out-room time and the subsequent case's in-room time in the same room.
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--surface-subtle)',
                padding: 18,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>Minimum Required Room Turnover Buffer</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Threshold in minutes required between consecutive surgical cases</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={localEmrConfig.minTurnoverBufferMinutes}
                      onChange={(e) => {
                        const mins = Math.max(5, Number(e.target.value));
                        const updated = { ...localEmrConfig, minTurnoverBufferMinutes: mins };
                        setLocalEmrConfig(updated);
                        onSaveEmrConfig(updated);
                      }}
                      style={{
                        width: 70,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border-medium)',
                        background: 'var(--surface-card)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        fontWeight: 900,
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Minutes</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    id="enforceTurnover"
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="enforceTurnover" style={{ fontSize: 13, fontWeight: 700 }}>
                    Strict Enforcement: Throw validation error and block saving if turnover is under 15 minutes
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-header)',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
