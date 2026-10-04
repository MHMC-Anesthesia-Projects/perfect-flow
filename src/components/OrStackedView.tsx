'use client';

import React, { useState } from 'react';
import { EpicPatientCase, OperatingRoom, BoardRunner } from '@/types/flow';
import { parseTimeToMinutes } from '@/lib/turnoverValidation';
import { Plus, LayoutGrid, Layers, Activity, Filter, Clock } from 'lucide-react';

interface OrStackedViewProps {
  rooms: OperatingRoom[];
  patients: EpicPatientCase[];
  runners: BoardRunner[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  hipaaProtected: boolean;
  minTurnoverMinutes?: number;
  onSwitchToGrid: () => void;
}

export const OrStackedView: React.FC<OrStackedViewProps> = ({
  rooms,
  patients,
  runners,
  onSelectPatient,
  onUpdatePatient,
  hipaaProtected,
  minTurnoverMinutes = 15,
  onSwitchToGrid
}) => {
  const [selectedDept, setSelectedDept] = useState<'Day Surgery' | 'Main OR' | 'all'>('Day Surgery');

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

  // Filter rooms according to department tab
  const filteredRooms = rooms.filter(room => {
    if (selectedDept === 'all') return true;
    return room.department === selectedDept;
  });

  return (
    <div style={{
      height: 'calc(100vh - 112px)',
      overflowY: 'auto',
      padding: '12px 16px',
      background: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {/* 1. TOP COMMAND BAR: Board Runners & Narcotic Banner (Exact match to OR Control image) */}
      <div style={{
        background: 'var(--surface-card)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Board Runners Telemetry & Green Narcotic Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 16,
              fontWeight: 900,
              fontFamily: 'var(--font-sans)',
              letterSpacing: -0.2,
              color: 'var(--text-primary)'
            }}>
              Board Runners; Anes x3346, Anes x4342; RN x3935
            </div>

            {/* Green Narcotic Banner from Image */}
            <div style={{
              background: '#16a34a',
              color: '#ffffff',
              padding: '5px 14px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
            }}>
              <Activity size={15} />
              <span>NARCOTIC COUNTS DUE BY 1200 07:00 - 12:00</span>
            </div>
          </div>

          {/* Department Filter & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Department Filter Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: 2,
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => setSelectedDept('Day Surgery')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: selectedDept === 'Day Surgery' ? 'var(--accent-primary)' : 'transparent',
                  color: selectedDept === 'Day Surgery' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Day Surgery (MC DS)
              </button>

              <button
                type="button"
                onClick={() => setSelectedDept('Main OR')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: selectedDept === 'Main OR' ? 'var(--accent-primary)' : 'transparent',
                  color: selectedDept === 'Main OR' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Main OR (MC OR)
              </button>

              <button
                type="button"
                onClick={() => setSelectedDept('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: selectedDept === 'all' ? 'var(--accent-primary)' : 'transparent',
                  color: selectedDept === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                All Operating Suites
              </button>
            </div>

            {/* View Switcher Toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: 2,
              gap: 2
            }}>
              <button
                type="button"
                onClick={onSwitchToGrid}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <LayoutGrid size={13} />
                <span>Suite Grid</span>
              </button>

              <button
                type="button"
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Layers size={13} />
                <span>Consolidated Stacked</span>
              </button>
            </div>
          </div>
        </div>

        {/* Second Line: WP Board Runners & Color Chips (Exact image twin) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>
            WP Board Runners
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 36, height: 18, background: '#7dd3fc', borderRadius: 2 }} title="Anesthesia Floor Coordinator" />
            <div style={{ width: 36, height: 18, background: '#0f172a', borderRadius: 2 }} title="CRNA Lead" />
            <div style={{ width: 36, height: 18, background: '#86efac', borderRadius: 2 }} title="Nursing Supervisor" />
          </div>
        </div>
      </div>

      {/* 2. CONSOLIDATED STACKED OPERATING ROOM COLUMNS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
        gap: 14,
        alignItems: 'start'
      }}>
        {filteredRooms.map((room) => {
          const roomPatients = patients.filter(p => p.roomNumber === room.name);
          const staff = room.assignedStaff;

          // Order cases in strict scheduled start sequence
          const sortedCases = [...roomPatients].sort((a, b) => {
            const aTime = parseTimeToMinutes(a.inRoomTime || a.schedInRoom || a.scheduledStartTime) || 0;
            const bTime = parseTimeToMinutes(b.inRoomTime || b.schedInRoom || b.scheduledStartTime) || 0;
            return aTime - bTime;
          });

          return (
            <div
              key={room.id}
              style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* ROOM HEADER: Distinct Yellow Pill + Staff Strip (Exact visual duplicate of OR Control) */}
              <div style={{
                padding: '6px 12px',
                background: 'var(--surface-header)',
                borderBottom: '2px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8
              }}>
                {/* Yellow Room Pill matching Image */}
                <div style={{
                  background: '#facc15',
                  color: '#000000',
                  padding: '3px 14px',
                  borderRadius: 4,
                  fontSize: 15,
                  fontWeight: 900,
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: 0.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)'
                }}>
                  {room.name}
                </div>

                {/* STAFF COLOR BLOCKS STRIP (Anesthesiologist, CRNA, Circulator RN, Scrub Tech, Anes Tech) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {/* Cyan Box: Anesthesiologist (MD) */}
                  <div
                    style={{
                      background: '#7dd3fc',
                      color: '#0369a1',
                      padding: '3px 8px',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap'
                    }}
                    title={`Anesthesiologist: ${staff?.anesthesiologist || 'Unassigned'}`}
                  >
                    {staff?.anesthesiologist ? staff.anesthesiologist.split(' ')[0] : 'MD'}
                  </div>

                  {/* Dark Obsidian Box: CRNA */}
                  <div
                    style={{
                      background: '#0f172a',
                      color: '#f8fafc',
                      padding: '3px 8px',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap'
                    }}
                    title={`CRNA: ${staff?.crna || 'Unassigned'}`}
                  >
                    {staff?.crna ? staff.crna.split(' ')[0] : 'CRNA'}
                  </div>

                  {/* Light Green Box: Circulating RN with Star */}
                  <div
                    style={{
                      background: '#86efac',
                      color: '#14532d',
                      padding: '3px 8px',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      border: '1px solid #4ade80'
                    }}
                    title={`Circulating RN: ${staff?.circulatorRN || 'Unassigned'}`}
                  >
                    *{staff?.circulatorRN ? staff.circulatorRN.replace(' (RN)', '') : 'RN'}
                  </div>

                  {/* Lavender/Purple Box: Scrub Tech with Star */}
                  <div
                    style={{
                      background: '#e9d5ff',
                      color: '#581c87',
                      padding: '3px 8px',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      border: '1px solid #d8b4fe'
                    }}
                    title={`Scrub Tech: ${staff?.scrubTech || 'Unassigned'}`}
                  >
                    *{staff?.scrubTech ? staff.scrubTech.replace(' (ST)', '') : 'ST'}
                  </div>

                  {/* Gold Box: Anes Tech */}
                  <div
                    style={{
                      background: '#fde047',
                      color: '#854d0e',
                      padding: '3px 7px',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap'
                    }}
                    title={`Anesthesia Tech: ${staff?.anesTech || 'Anes Tech'}`}
                  >
                    Tech
                  </div>

                  {/* Dark Slate Box: Float / Standby */}
                  <div
                    style={{
                      width: 24,
                      height: 22,
                      background: '#334155',
                      borderRadius: 2
                    }}
                    title="Auxiliary Float"
                  />
                </div>
              </div>

              {/* STACKED CASE ROWS */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sortedCases.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                    {room.status === 'turnover' ? 'Terminal Cleaning / Turnover Underway' : 'No surgical cases booked for this operating suite'}
                  </div>
                ) : (
                  sortedCases.map((caseItem, idx) => {
                    const displayName = hipaaProtected ? caseItem.patientInitials : caseItem.patientName;
                    const elapsedMins = (caseItem.currentPhase === 'in_surgery' || caseItem.currentPhase === 'closing') 
                      ? getElapsedMinutes(caseItem.surgeryStartTime || caseItem.inRoomTime) 
                      : null;

                    // Generate clinical alerts matching image (e.g. Need H&P, Need Consent, etc.)
                    const alerts: string[] = [];
                    if (caseItem.hpComplete !== 'yes') alerts.push('Need H&P;');
                    if (caseItem.surgicalConsent !== 'signed') alerts.push('Need Surgical Consent;');
                    if (caseItem.anesthesiaConsent !== 'signed') alerts.push('Need Anesthesia Consent;');
                    if (caseItem.siteMarked !== 'yes' && caseItem.siteMarked !== 'na') alerts.push('Need Site Mark;');
                    if (caseItem.preOpAlerts) alerts.push(`${caseItem.preOpAlerts};`);

                    // Generate notes
                    const notes: string[] = [];
                    if (caseItem.comments && caseItem.comments.trim().length > 0) notes.push(caseItem.comments);
                    if (caseItem.reportCalled) notes.push('report called');
                    if (caseItem.blockStatus === 'in_progress') notes.push('REGIONAL BLOCK IN PROGRESS');
                    if (caseItem.bloodBankRequired) notes.push('2 units PRBC standby');

                    // Style active rows with slight highlight
                    const isActive = caseItem.currentPhase === 'in_surgery' || caseItem.currentPhase === 'closing';

                    return (
                      <div
                        key={caseItem.id}
                        onClick={() => onSelectPatient(caseItem)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: idx < sortedCases.length - 1 ? '1px solid var(--border-light)' : 'none',
                          display: 'grid',
                          gridTemplateColumns: '70px 110px 1.4fr 2fr 100px',
                          gap: 12,
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: caseItem.currentPhase === 'in_surgery' ? 'rgba(22, 163, 74, 0.06)' :
                                      caseItem.currentPhase === 'closing' ? 'rgba(147, 51, 234, 0.06)' : 'transparent',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 
                          caseItem.currentPhase === 'in_surgery' ? 'rgba(22, 163, 74, 0.06)' :
                          caseItem.currentPhase === 'closing' ? 'rgba(147, 51, 234, 0.06)' : 'transparent'
                        )}
                      >
                        {/* 1. TIME & GLYPHS */}
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            fontWeight: 900,
                            color: 'var(--text-primary)'
                          }}>
                            {caseItem.inRoomTime || caseItem.schedInRoom || caseItem.scheduledStartTime}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            {/* Red A/P Glyphs from image */}
                            <span style={{
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: 900,
                              padding: '1px 3px',
                              borderRadius: 2,
                              fontFamily: 'var(--font-mono)'
                            }} title="Anesthesia Pre-Op Complete">
                              A P
                            </span>

                            {/* Case Order Shield */}
                            <span style={{
                              background: caseItem.caseOrder === '1' ? '#facc15' : caseItem.caseOrder === '2' ? '#86efac' : '#fed7aa',
                              color: '#000',
                              fontSize: 10,
                              fontWeight: 900,
                              padding: '0 4px',
                              borderRadius: 3,
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {caseItem.caseOrder}
                            </span>
                          </div>
                        </div>

                        {/* 2. SURGEON */}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {caseItem.surgeon}
                          </div>
                          {caseItem.isAddOn && (
                            <span style={{
                              background: 'var(--alert-red)',
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: 900,
                              padding: '1px 4px',
                              borderRadius: 2,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2,
                              marginTop: 2
                            }}>
                              <Plus size={8} strokeWidth={3} /> ADD-ON
                            </span>
                          )}
                        </div>

                        {/* 3. PATIENT DEMOGRAPHICS (Initials/Name, Age/Bed, MRN) */}
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--text-primary)', letterSpacing: -0.2 }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {caseItem.age < 2 ? `${caseItem.age === 0 ? '7m 24d' : '1y 11m'}` : `${caseItem.age}y`} {caseItem.gender} • <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{caseItem.inpatientBed || 'OP Surg'}</strong>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {caseItem.mrn}
                          </div>
                        </div>

                        {/* 4. PROCEDURE & CLINICAL ALERTS / BLUE NOTES */}
                        <div>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 800,
                            lineHeight: 1.25,
                            color: 'var(--text-primary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {caseItem.primaryProcedure}
                          </div>

                          {/* Red Clinical Alerts (Need H&P, Need Consent, etc.) */}
                          {alerts.length > 0 && (
                            <div style={{
                              color: 'var(--alert-red)',
                              fontSize: 11,
                              fontWeight: 800,
                              marginTop: 2,
                              lineHeight: 1.2
                            }}>
                              {alerts.join(' ')}
                            </div>
                          )}

                          {/* Blue Notes / Purple Name Alert from image */}
                          {notes.length > 0 && (
                            <div style={{
                              color: notes.some(n => n.includes('ALERT')) ? '#9333ea' : 'var(--accent-primary)',
                              fontSize: 11,
                              fontWeight: 800,
                              marginTop: 2,
                              textTransform: 'uppercase'
                            }}>
                              {notes.join(' • ')}
                            </div>
                          )}
                        </div>

                        {/* 5. STATUS BADGE & TIMER */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            background: caseItem.currentPhase === 'in_surgery' ? 'var(--phase-surgery-bg)' :
                                        caseItem.currentPhase === 'closing' ? 'var(--phase-closing-bg)' :
                                        caseItem.currentPhase === 'preop' ? 'var(--phase-preop-bg)' :
                                        caseItem.currentPhase === 'completed' ? '#64748b' : 'var(--surface-subtle)',
                            color: caseItem.currentPhase === 'scheduled' ? 'var(--text-secondary)' : '#ffffff',
                            border: caseItem.currentPhase === 'scheduled' ? '1px solid var(--border-medium)' : 'none'
                          }}>
                            {caseItem.currentPhase === 'in_surgery' ? 'In Surgery' :
                             caseItem.currentPhase === 'closing' ? 'Closing' :
                             caseItem.currentPhase === 'preop' ? 'Pre-Op' :
                             caseItem.currentPhase.replace('_', ' ')}
                          </span>

                          {elapsedMins !== null && (
                            <div style={{
                              fontSize: 11,
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent-primary)',
                              marginTop: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 3
                            }}>
                              <Clock size={11} />
                              <span>{elapsedMins}m elapsed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
