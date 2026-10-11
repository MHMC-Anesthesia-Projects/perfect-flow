'use client';

import React, { useState } from 'react';
import { EpicPatientCase, OperatingRoom, BoardRunner, StaffMember, RoomStaffTeam } from '@/types/journey';
import { parseTimeToMinutes } from '@/lib/turnoverValidation';
import { 
  Clock, Plus, Phone, AlertTriangle, Check, UserCheck, Stethoscope, 
  LayoutGrid, Layers, CalendarRange, X, Shield, ChevronRight 
} from 'lucide-react';
import { StaffPickerModal } from './StaffPickerModal';

interface RoomGridViewProps {
  rooms: OperatingRoom[];
  patients: EpicPatientCase[];
  runners: BoardRunner[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  hipaaProtected: boolean;
  minTurnoverMinutes?: number;
  orSubView?: 'grid' | 'stacked' | 'timeline';
  onSelectOrSubView?: (view: 'grid' | 'stacked' | 'timeline') => void;
  staffRoster?: StaffMember[];
  onUpdateRoomStaff?: (roomId: string, staff: RoomStaffTeam) => void;
}

export const RoomGridView: React.FC<RoomGridViewProps> = ({
  rooms,
  patients,
  runners,
  onSelectPatient,
  onUpdatePatient,
  hipaaProtected,
  minTurnoverMinutes = 15,
  orSubView = 'grid',
  onSelectOrSubView,
  staffRoster = [],
  onUpdateRoomStaff
}) => {
  const [isCommandRosterOpen, setIsCommandRosterOpen] = useState(false);

  // Staff Picker State
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    roomId: string;
    roomName: string;
    roleSlot: 'anesthesiologist' | 'crna' | 'circulatorRN' | 'scrubTech' | 'anesTech';
    roleLabel: string;
    currentStaffName: string;
  } | null>(null);

  const getElapsedMinutes = (startTimeStr?: string) => {
    if (!startTimeStr) return null;
    const parts = startTimeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;

    const now = new Date();
    const start = new Date();
    start.setHours(h, m, 0, 0);

    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? diffMins : 0;
  };

  const formatTimeNow = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleStaffSelected = (displayName: string) => {
    if (!pickerState || !onUpdateRoomStaff) return;
    const room = rooms.find(r => r.id === pickerState.roomId);
    if (!room) return;

    const currentStaff: RoomStaffTeam = room.assignedStaff || {
      anesthesiologist: '',
      crna: '',
      circulatorRN: '',
      scrubTech: '',
      anesTech: ''
    };

    const updatedStaff: RoomStaffTeam = {
      ...currentStaff,
      [pickerState.roleSlot]: displayName
    };

    onUpdateRoomStaff(room.id, updatedStaff);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-app)',
      position: 'relative'
    }}>
      {/* Top Header Bar for OR Suites */}
      <div style={{
        padding: '10px 20px',
        background: 'var(--surface-header)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            OPERATING SUITES COMMAND VIEW ({rooms.length} Suites)
          </div>

          {/* Reworked Command Roster Button */}
          <button
            type="button"
            onClick={() => setIsCommandRosterOpen(prev => !prev)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: isCommandRosterOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
              background: isCommandRosterOpen ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-subtle)',
              color: isCommandRosterOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isCommandRosterOpen ? '0 0 8px rgba(59, 130, 246, 0.3)' : 'none'
            }}
            title="Click to toggle Periop Command Roster & Logistics panel"
          >
            <Phone size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Periop Command Roster ({runners.length})</span>
          </button>
        </div>

        {/* View Switcher Tabs: Grid, Stacked, Timeline */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-subtle)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: 3,
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => onSelectOrSubView && onSelectOrSubView('grid')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: orSubView === 'grid' ? 'var(--accent-primary)' : 'transparent',
              color: orSubView === 'grid' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: orSubView === 'grid' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <LayoutGrid size={13} />
            <span>Suite Grid</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectOrSubView && onSelectOrSubView('stacked')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: orSubView === 'stacked' ? 'var(--accent-primary)' : 'transparent',
              color: orSubView === 'stacked' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: orSubView === 'stacked' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <Layers size={13} />
            <span>Consolidated Stacked</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectOrSubView && onSelectOrSubView('timeline')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: orSubView === 'timeline' ? 'var(--accent-primary)' : 'transparent',
              color: orSubView === 'timeline' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: orSubView === 'timeline' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <CalendarRange size={13} />
            <span>Gantt Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Suite Columns Area (100% full width!) */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 14,
        padding: 14,
        overflowX: 'auto',
        overflowY: 'auto'
      }}>
        {rooms.map((room) => {
          const roomPatients = patients.filter(p => p.roomNumber === room.name);
          const activeCase = roomPatients.find(p => p.currentPhase === 'in_surgery' || p.currentPhase === 'closing');
          const queuedCases = roomPatients.filter(p => p.id !== activeCase?.id && p.currentPhase !== 'completed' && p.currentPhase !== 'pacu' && p.currentPhase !== 'phase2');

          const elapsedMins = activeCase ? getElapsedMinutes(activeCase.surgeryStartTime || activeCase.inRoomTime) : null;
          const staff = room.assignedStaff;

          return (
            <div
              key={room.id}
              style={{
                minWidth: 330,
                maxWidth: 350,
                flex: '0 0 330px',
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Room Header Banner */}
              <div style={{
                padding: '10px 14px',
                background: activeCase?.currentPhase === 'in_surgery' ? 'var(--phase-surgery-bg)' :
                            activeCase?.currentPhase === 'closing' ? 'var(--phase-closing-bg)' :
                            room.status === 'turnover' ? '#d97706' : 'var(--surface-subtle)',
                color: activeCase || room.status === 'turnover' ? '#ffffff' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-medium)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {room.name}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>
                    {room.department}
                  </span>
                </div>

                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {activeCase?.currentPhase ? activeCase.currentPhase.replace('_', ' ') : 
                   room.status === 'turnover' ? 'ROOM TURNOVER' : 'AVAILABLE'}
                </div>
              </div>

              {/* Clickable Assigned Staff Strip */}
              <div style={{
                padding: '4px 8px',
                background: 'var(--surface-subtle)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                overflowX: 'auto'
              }}>
                {/* MD */}
                <button
                  type="button"
                  onClick={() => setPickerState({
                    isOpen: true,
                    roomId: room.id,
                    roomName: room.name,
                    roleSlot: 'anesthesiologist',
                    roleLabel: 'Anesthesiologist',
                    currentStaffName: staff?.anesthesiologist || ''
                  })}
                  title={`Anesthesiologist: ${staff?.anesthesiologist || 'Unassigned (Tap to assign)'}`}
                  style={{
                    padding: '2px 5px',
                    borderRadius: 3,
                    border: '1px solid #3b82f6',
                    background: '#1d4ed8',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {staff?.anesthesiologist ? staff.anesthesiologist.split(' ')[0] : '+ MD'}
                </button>

                {/* CRNA */}
                <button
                  type="button"
                  onClick={() => setPickerState({
                    isOpen: true,
                    roomId: room.id,
                    roomName: room.name,
                    roleSlot: 'crna',
                    roleLabel: 'CRNA',
                    currentStaffName: staff?.crna || ''
                  })}
                  title={`CRNA: ${staff?.crna || 'Unassigned (Tap to assign)'}`}
                  style={{
                    padding: '2px 5px',
                    borderRadius: 3,
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {staff?.crna ? staff.crna.split(' ')[0] : '+ CRNA'}
                </button>

                {/* Circulator RN */}
                <button
                  type="button"
                  onClick={() => setPickerState({
                    isOpen: true,
                    roomId: room.id,
                    roomName: room.name,
                    roleSlot: 'circulatorRN',
                    roleLabel: 'Circulating RN',
                    currentStaffName: staff?.circulatorRN || ''
                  })}
                  title={`Circulating RN: ${staff?.circulatorRN || 'Unassigned (Tap to assign)'}`}
                  style={{
                    padding: '2px 5px',
                    borderRadius: 3,
                    border: '1px solid #4ade80',
                    background: '#86efac',
                    color: '#14532d',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  *{staff?.circulatorRN ? staff.circulatorRN.replace(' (RN)', '').split(' ')[0] : '+ RN'}
                </button>

                {/* Scrub Tech */}
                <button
                  type="button"
                  onClick={() => setPickerState({
                    isOpen: true,
                    roomId: room.id,
                    roomName: room.name,
                    roleSlot: 'scrubTech',
                    roleLabel: 'Scrub Tech',
                    currentStaffName: staff?.scrubTech || ''
                  })}
                  title={`Scrub Tech: ${staff?.scrubTech || 'Unassigned (Tap to assign)'}`}
                  style={{
                    padding: '2px 5px',
                    borderRadius: 3,
                    border: '1px solid #d8b4fe',
                    background: '#e9d5ff',
                    color: '#581c87',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  *{staff?.scrubTech ? staff.scrubTech.replace(' (ST)', '').split(' ')[0] : '+ ST'}
                </button>

                {/* Anes Tech */}
                <button
                  type="button"
                  onClick={() => setPickerState({
                    isOpen: true,
                    roomId: room.id,
                    roomName: room.name,
                    roleSlot: 'anesTech',
                    roleLabel: 'Anesthesia Tech',
                    currentStaffName: staff?.anesTech || ''
                  })}
                  title={`Anes Tech: ${staff?.anesTech || 'Unassigned (Tap to assign)'}`}
                  style={{
                    padding: '2px 5px',
                    borderRadius: 3,
                    border: '1px solid #fbbf24',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {staff?.anesTech ? staff.anesTech.split(' ')[0] : '+ AT'}
                </button>
              </div>

              {/* Room Body Container */}
              <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {/* 1. PROMINENT ACTIVE IN-ROOM CASE */}
                {activeCase ? (
                  <div
                    onClick={() => onSelectPatient(activeCase)}
                    style={{
                      background: 'var(--surface-subtle)',
                      border: '2px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative'
                    }}
                  >
                    {/* Active Top Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--accent-primary)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          CASE #{activeCase.caseOrder}
                        </span>
                        {activeCase.isAddOn && (
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 900
                          }}>
                            ADD-ON
                          </span>
                        )}
                      </div>

                      {elapsedMins !== null && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 900,
                          color: 'var(--accent-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--phase-surgery-bg)', display: 'inline-block' }} />
                          <Clock size={12} />
                          <span>{elapsedMins}m in cut</span>
                        </div>
                      )}
                    </div>

                    {/* Patient Name & Primary Procedure */}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)' }}>
                        {hipaaProtected ? activeCase.patientInitials : activeCase.patientName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>
                        {activeCase.primaryProcedure}
                      </div>
                    </div>

                    {/* Clinical Team Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 4,
                      background: 'var(--surface-card)',
                      padding: 6,
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      <div>Surgeon: <strong>Dr. {activeCase.surgeon}</strong></div>
                      <div>Anes: <strong>{activeCase.anesthesiologist}</strong></div>
                      <div>RN: <strong>{activeCase.circulatorRN || '—'}</strong></div>
                      <div>Tech: <strong>{activeCase.scrubTech || '—'}</strong></div>
                    </div>

                    {/* Rapid Milestones */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 2 }}>
                      {activeCase.currentPhase === 'in_surgery' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePatient(activeCase.id, {
                              currentPhase: 'closing',
                              surgeryEndTime: formatTimeNow()
                            }, 'Surgical Closing Initiated');
                          }}
                          style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: 'var(--phase-closing-bg)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Closing
                        </button>
                      )}

                      {(activeCase.currentPhase === 'in_surgery' || activeCase.currentPhase === 'closing') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePatient(activeCase.id, {
                              currentPhase: 'pacu',
                              outRoomTime: formatTimeNow(),
                              pacuArrivalTime: formatTimeNow(),
                              pacuLocation: `PACU Bay 0${Math.floor(Math.random() * 6) + 1}`
                            }, 'Transferred to PACU Phase I Recovery');
                          }}
                          style={{
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: 'var(--phase-pacu-bg)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Send to PACU
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border-medium)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {room.status === 'turnover' ? 'Room Turnover in progress...' : 'Suite ready for next case'}
                  </div>
                )}

                {/* 2. QUEUED UPCOMING CASES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Follow-On Cases ({queuedCases.length})
                  </div>

                  {queuedCases.map((queued) => (
                    <div
                      key={queued.id}
                      onClick={() => onSelectPatient(queued)}
                      style={{
                        padding: 8,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          Case #{queued.caseOrder} • {queued.schedInRoom || queued.scheduledStartTime}
                        </span>
                        <span style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: queued.preOpReady ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: queued.preOpReady ? '#22c55e' : '#ca8a04',
                          fontWeight: 800
                        }}>
                          {queued.preOpReady ? 'Pre-Op Cleared' : 'In Holding'}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 800 }}>
                        {hipaaProtected ? queued.patientInitials : queued.patientName}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {queued.primaryProcedure} (Dr. {queued.surgeon})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-Out Periop Command Roster Drawer */}
      {isCommandRosterOpen && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            bottom: 0,
            width: 320,
            background: 'var(--surface-header)',
            borderLeft: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={16} style={{ color: 'var(--accent-primary)' }} />
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>
                Periop Command Roster
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCommandRosterOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {runners.map((runner) => {
              let badgeColor = 'var(--surface-card)';
              let borderColor = 'var(--border-light)';
              let textColor = 'var(--text-primary)';

              if (runner.role === 'anes') {
                badgeColor = 'rgba(2, 132, 199, 0.12)';
                borderColor = 'var(--accent-primary)';
                textColor = 'var(--accent-primary)';
              } else if (runner.role === 'late') {
                badgeColor = 'rgba(147, 51, 234, 0.1)';
                borderColor = 'var(--phase-closing-bg)';
              } else if (runner.role === 'float') {
                badgeColor = 'rgba(22, 163, 74, 0.1)';
                borderColor = 'var(--phase-surgery-bg)';
              }

              return (
                <div
                  key={runner.id}
                  style={{
                    background: badgeColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <div style={{
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: textColor
                  }}>
                    {runner.title}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {runner.staffName}
                  </div>
                  {runner.pagerOrPhone && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {runner.pagerOrPhone}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Picker Modal */}
      {pickerState && (
        <StaffPickerModal
          isOpen={pickerState.isOpen}
          onClose={() => setPickerState(null)}
          roomId={pickerState.roomId}
          roomName={pickerState.roomName}
          roleSlot={pickerState.roleSlot}
          roleLabel={pickerState.roleLabel}
          currentStaffName={pickerState.currentStaffName}
          staffRoster={staffRoster}
          onSelectStaff={handleStaffSelected}
        />
      )}
    </div>
  );
};
