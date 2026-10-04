'use client';

import React from 'react';
import { EpicPatientCase, OperatingRoom, BoardRunner } from '@/types/flow';
import { parseTimeToMinutes } from '@/lib/turnoverValidation';
import { Clock, Plus, Phone, AlertTriangle, Check, UserCheck, Stethoscope, LayoutGrid, Layers, CalendarRange } from 'lucide-react';

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
  onSelectOrSubView
}) => {
  const getElapsedMinutes = (startTimeStr?: string) => {
    if (!startTimeStr) return null;
    const [h, m] = startTimeStr.split(':').map(Number);
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      height: 'calc(100vh - 112px)',
      overflow: 'hidden',
      background: 'var(--bg-app)'
    }}>
      {/* LEFT SIDEBAR: BOARD RUNNERS, LATE SHIFTS & FLOATS (Exact OR Control twin) */}
      <aside style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-medium)',
        overflowY: 'auto',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          color: 'var(--text-muted)',
          paddingBottom: 6,
          borderBottom: '1px solid var(--border-light)'
        }}>
          PERIOP COMMAND ROSTER
        </div>

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
                padding: '8px 10px',
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
      </aside>

      {/* MAIN OPERATING ROOMS SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* View Switcher Header Bar */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            OPERATING SUITES COMMAND VIEW
          </div>

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

        <main style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          gap: 14
        }}>
        {rooms.map((room) => {
          const roomPatients = patients.filter(p => p.roomNumber === room.name);
          const activeCase = roomPatients.find(p => p.currentPhase === 'in_surgery' || p.currentPhase === 'closing');
          const queuedCases = roomPatients.filter(p => p.id !== activeCase?.id && p.currentPhase !== 'completed' && p.currentPhase !== 'pacu' && p.currentPhase !== 'phase2');

          const elapsedMins = activeCase ? getElapsedMinutes(activeCase.surgeryStartTime || activeCase.inRoomTime) : null;
          const activeEndMins = activeCase ? parseTimeToMinutes(activeCase.outRoomTime || activeCase.schedOutRoom || activeCase.scheduledEndTime) : null;

          return (
            <div
              key={room.id}
              style={{
                minWidth: 320,
                maxWidth: 340,
                flex: '0 0 320px',
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
                    {/* Active Top Row: Case #, Surgeon, Add-On */}
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
                          #{activeCase.caseOrder}
                        </span>

                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {activeCase.surgeon}
                        </span>
                      </div>

                      {activeCase.isAddOn && (
                        <span style={{
                          background: 'var(--alert-red)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '1px 6px',
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <Plus size={10} strokeWidth={3} /> ADD-ON
                        </span>
                      )}
                    </div>

                    {/* Patient Name & Bed */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {hipaaProtected ? activeCase.patientInitials : activeCase.patientName}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {activeCase.age}y • {activeCase.inpatientBed || 'Ambulatory'}
                      </span>
                    </div>

                    {/* Procedure Summary */}
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {activeCase.primaryProcedure}
                    </div>

                    {/* Live Surgical Elapsed Timer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface-card)',
                      padding: '6px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--border-light)',
                      fontSize: 11
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--phase-surgery-bg)', fontWeight: 800 }}>
                        <Clock size={13} />
                        <span>Cut: {activeCase.surgeryStartTime || activeCase.inRoomTime}</span>
                      </div>

                      {elapsedMins !== null && (
                        <div style={{
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-primary)'
                        }}>
                          {elapsedMins} min elapsed
                        </div>
                      )}
                    </div>

                    {/* 1-Tap Quick Action Buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      {activeCase.currentPhase === 'in_surgery' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePatient(activeCase.id, {
                              currentPhase: 'closing',
                              surgeryEndTime: formatTimeNow()
                            }, 'Marked Case Closing');
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 4,
                            background: 'var(--phase-closing-bg)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Closing
                        </button>
                      )}

                      {activeCase.currentPhase === 'closing' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const now = formatTimeNow();
                            onUpdatePatient(activeCase.id, {
                              currentPhase: 'pacu',
                              outRoomTime: now,
                              pacuArrivalTime: now,
                              pacuLocation: 'PACU Bay 01'
                            }, 'Transferred to PACU');
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 4,
                            background: 'var(--phase-pacu-bg)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Send to PACU
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePatient(activeCase.id, {
                            reportCalled: !activeCase.reportCalled,
                            reportCalledTime: !activeCase.reportCalled ? formatTimeNow() : undefined
                          });
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 4,
                          background: activeCase.reportCalled ? 'var(--accent-primary)' : 'var(--surface-card)',
                          color: activeCase.reportCalled ? '#fff' : 'var(--text-secondary)',
                          border: '1px solid var(--border-medium)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Toggle Report Called to PACU/Floor"
                      >
                        <Phone size={11} /> {activeCase.reportCalled ? 'Report Called' : 'Call Report'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    background: 'var(--surface-subtle)',
                    border: '1px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {room.status === 'turnover' ? 'Terminal Cleaning / Room Turnover' : 'No Active Case in Room'}
                  </div>
                )}

                {/* 2. QUEUED UPCOMING CASES STACK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'var(--text-muted)'
                  }}>
                    UPCOMING CASES ({queuedCases.length})
                  </div>

                  {queuedCases.map((queued) => {
                    const queuedStartMins = parseTimeToMinutes(queued.inRoomTime || queued.schedInRoom || queued.scheduledStartTime);
                    const turnoverBuffer = (activeEndMins !== null && queuedStartMins !== null) ? queuedStartMins - activeEndMins : null;
                    const isTurnoverTight = turnoverBuffer !== null && turnoverBuffer < minTurnoverMinutes;

                    return (
                      <div
                        key={queued.id}
                        onClick={() => onSelectPatient(queued)}
                        style={{
                          background: 'var(--surface-card)',
                          border: isTurnoverTight ? '1px solid var(--alert-red)' : '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'border-color var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = isTurnoverTight ? 'var(--alert-red)' : 'var(--border-light)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: 'var(--surface-subtle)',
                              border: '1px solid var(--border-medium)',
                              fontSize: 10,
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)'
                            }}>
                              #{queued.caseOrder}
                            </span>
                            <span style={{ fontWeight: 700 }}>{queued.surgeon}</span>
                          </div>

                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                            {queued.schedInRoom || queued.scheduledStartTime}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {hipaaProtected ? queued.patientInitials : queued.patientName}
                          </span>

                          {queued.preOpBay && (
                            <span style={{ color: 'var(--phase-preop-bg)', fontWeight: 700 }}>
                              {queued.preOpBay}
                            </span>
                          )}
                        </div>

                        {/* Tight Turnover Warning Alert */}
                        {isTurnoverTight && (
                          <div style={{
                            background: 'var(--alert-red-light)',
                            color: 'var(--alert-red)',
                            border: '1px solid var(--alert-red-border)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <AlertTriangle size={11} />
                            <span>Tight Turnover: {turnoverBuffer}m buffer (&lt;{minTurnoverMinutes}m required)</span>
                          </div>
                        )}

                        {/* Readiness gatekeeper dots */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 10 }}>
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: queued.siteMarked === 'yes' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                            color: queued.siteMarked === 'yes' ? 'var(--phase-surgery-bg)' : 'var(--alert-red)',
                            fontWeight: 800
                          }}>
                            {queued.siteMarked === 'yes' ? 'Site Marked' : 'Site Pending'}
                          </span>

                          <span style={{
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: queued.anesthesiaReady ? 'rgba(2, 132, 199, 0.15)' : 'var(--surface-subtle)',
                            color: queued.anesthesiaReady ? 'var(--accent-primary)' : 'var(--text-muted)',
                            fontWeight: 700
                          }}>
                            {queued.anesthesiaReady ? 'Anes Ready' : 'Anes Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  </div>
);
};
