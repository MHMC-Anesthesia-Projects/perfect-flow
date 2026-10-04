'use client';

import React, { useState } from 'react';
import { EpicPatientCase } from '@/types/flow';
import { BedDouble, Check, AlertCircle, Clock, CheckCircle2, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';

interface PacuRecoveryViewProps {
  patients: EpicPatientCase[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  hipaaProtected: boolean;
}

export const PacuRecoveryView: React.FC<PacuRecoveryViewProps> = ({
  patients,
  onSelectPatient,
  onUpdatePatient,
  hipaaProtected
}) => {
  const [subView, setSubView] = useState<'all' | 'pacu' | 'phase2'>('all');

  // Patients in PACU or Phase II
  const allRecovery = patients.filter(p => p.currentPhase === 'pacu' || p.currentPhase === 'phase2');
  const pacuCount = allRecovery.filter(p => p.currentPhase === 'pacu').length;
  const phase2Count = allRecovery.filter(p => p.currentPhase === 'phase2').length;

  const recoveryPatients = subView === 'all' 
    ? allRecovery 
    : subView === 'pacu' 
      ? allRecovery.filter(p => p.currentPhase === 'pacu')
      : allRecovery.filter(p => p.currentPhase === 'phase2');

  const formatTimeNow = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getElapsedMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;

    const now = new Date();
    const start = new Date();
    start.setHours(h, m, 0, 0);

    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? diffMins : 0;
  };

  return (
    <div style={{
      height: 'calc(100vh - 112px)',
      overflowY: 'auto',
      padding: '20px',
      background: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-card)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'var(--phase-pacu-bg)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900
          }}>
            <BedDouble size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
              PACU & Phase II Ambulatory Recovery Board
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Length of Stay • Anesthesia Signouts • Inpatient Bed Holds & Floor Transfers
            </div>
          </div>
        </div>

        {/* Sub-view Segmented Toggle: All Recovery | PACU Phase I | Phase II Stepdown */}
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
            onClick={() => setSubView('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: subView === 'all' ? 'var(--accent-primary)' : 'transparent',
              color: subView === 'all' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: subView === 'all' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <span>All Recovery ({allRecovery.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('pacu')}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: subView === 'pacu' ? 'var(--phase-pacu-bg)' : 'transparent',
              color: subView === 'pacu' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: subView === 'pacu' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <span>PACU Phase I ({pacuCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('phase2')}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: subView === 'phase2' ? 'var(--phase-phase2-bg)' : 'transparent',
              color: subView === 'phase2' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: subView === 'phase2' ? '0 2px 4px rgba(13, 148, 136, 0.3)' : 'none'
            }}
          >
            <span>Phase II Discharge ({phase2Count})</span>
          </button>
        </div>
      </div>

      {/* Grid of Recovery Bays */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: 16
      }}>
        {recoveryPatients.map((patient) => {
          const displayName = hipaaProtected ? patient.patientInitials : patient.patientName;
          const isPacu = patient.currentPhase === 'pacu';
          const arrivalTime = isPacu ? patient.pacuArrivalTime : patient.phase2ArrivalTime;
          const losMins = getElapsedMinutes(arrivalTime);

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: patient.pacuToFloorHold ? '2px solid var(--alert-red)' : '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {/* Recovery Station Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: isPacu ? 'var(--phase-pacu-bg)' : 'var(--phase-phase2-bg)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {isPacu ? (patient.pacuLocation || 'PACU Bay 01') : (patient.phase2Location || 'Phase II Station 01')}
                  </span>

                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    From: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{patient.roomNumber}</strong>
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border-light)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--accent-primary)'
                }}>
                  <Clock size={12} />
                  <span>LOS: {losMins}m</span>
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{displayName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {patient.age}y {patient.gender} • Dr. {patient.surgeon}
                  </span>
                </div>

                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginTop: 3,
                  lineHeight: 1.3
                }}>
                  {patient.primaryProcedure}
                </div>

                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                  Recovery RN: <strong>{isPacu ? (patient.pacuRN || 'Bethany K.') : (patient.phase2Nurse || 'Rachel P.')}</strong>
                </div>
              </div>

              {/* Floor Hold Alert */}
              {patient.pacuToFloorHold && (
                <div style={{
                  background: 'var(--alert-red-light)',
                  border: '1px solid var(--alert-red-border)',
                  color: 'var(--alert-red)',
                  padding: '6px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <AlertCircle size={14} />
                  <span>INPATIENT FLOOR HOLD: Target Bed {patient.inpatientBed} Not Ready</span>
                </div>
              )}

              {/* Recovery Status Action Buttons */}
              <div style={{
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Inpatient Target Bed:</span>
                  <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    {patient.inpatientBed || 'Ambulatory Discharge'}
                  </strong>
                </div>

                {isPacu ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePatient(patient.id, {
                          readyForAnesSignout: !patient.readyForAnesSignout,
                          anesSignoutTime: !patient.readyForAnesSignout ? formatTimeNow() : undefined
                        }, 'Toggled Anesthesia Signout');
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: 4,
                        border: '1px solid var(--border-medium)',
                        background: patient.readyForAnesSignout ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-card)',
                        color: patient.readyForAnesSignout ? 'var(--phase-surgery-bg)' : 'var(--text-primary)',
                        fontWeight: 800,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                      <span>{patient.readyForAnesSignout ? `Anes Signed Out (${patient.anesSignoutTime})` : 'Ready for Anes Signout'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePatient(patient.id, {
                          pacuToFloorHold: !patient.pacuToFloorHold
                        });
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 4,
                        border: '1px solid var(--border-medium)',
                        background: patient.pacuToFloorHold ? 'var(--alert-red)' : 'var(--surface-card)',
                        color: patient.pacuToFloorHold ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer'
                      }}
                    >
                      Floor Hold
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {patient.recoveryNeeds || 'Tolerating fluids, vital signs stable, waiting for transportation.'}
                  </div>
                )}
              </div>

              {/* Next Phase Action Button */}
              {isPacu ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const now = formatTimeNow();
                    onUpdatePatient(patient.id, {
                      currentPhase: 'phase2',
                      phase2ArrivalTime: now,
                      phase2Location: 'Phase II Station 01'
                    }, 'Transferred to Phase II');
                  }}
                  style={{
                    padding: '8px 0',
                    borderRadius: 6,
                    background: 'var(--phase-phase2-bg)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span>Transfer to Phase II Recovery</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      currentPhase: 'completed',
                      completedTime: formatTimeNow()
                    }, 'Discharged Patient Home');
                  }}
                  style={{
                    padding: '8px 0',
                    borderRadius: 6,
                    background: 'var(--phase-complete-bg)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Check size={14} />
                  <span>Discharge Patient Home</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
