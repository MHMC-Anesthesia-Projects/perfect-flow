'use client';

import React, { useState } from 'react';
import { EpicPatientCase, OperatingRoom } from '@/types/journey';
import { 
  CheckCircle2, Clock, AlertTriangle, FileText, Stethoscope, 
  Heart, ShieldAlert, Check, X, ArrowRight, UserCheck, Sparkles, Filter, 
  LayoutGrid, ListFilter, AlertCircle
} from 'lucide-react';

interface SchedulingClearanceViewProps {
  patients: EpicPatientCase[];
  rooms: OperatingRoom[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  hipaaProtected: boolean;
  selectedSubView: 'matrix' | 'roster' | 'urgent';
  onSelectSubView: (view: 'matrix' | 'roster' | 'urgent') => void;
}

export const SchedulingClearanceView: React.FC<SchedulingClearanceViewProps> = ({
  patients,
  rooms,
  onSelectPatient,
  onUpdatePatient,
  hipaaProtected,
  selectedSubView,
  onSelectSubView
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'elective' | 'urgent' | 'emergent'>('all');

  // Filter cases relevant to scheduling & pre-admission testing
  const scheduledCases = patients.filter(p => {
    if (selectedSubView === 'urgent') {
      return p.isAddOn || p.casePriority === 'urgent' || p.casePriority === 'emergent';
    }
    if (priorityFilter !== 'all' && p.casePriority !== priorityFilter) return false;
    return true;
  });

  const getClearanceProgress = (p: EpicPatientCase) => {
    let completed = 0;
    const total = 5;

    if (p.hpComplete === 'yes') completed++;
    if (p.surgicalConsent === 'signed') completed++;
    if (p.anesthesiaConsent === 'signed') completed++;
    if (p.anesthesiaReady) completed++;
    if (p.bloodBankRequired ? p.siteMarked === 'yes' : true) completed++;

    return { completed, total, isFull: completed === total };
  };

  const handleToggleCheck = (patientId: string, field: 'hpComplete' | 'surgicalConsent' | 'anesthesiaConsent' | 'anesthesiaReady') => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    if (field === 'hpComplete') {
      const next = patient.hpComplete === 'yes' ? 'pending' : 'yes';
      onUpdatePatient(patientId, { hpComplete: next }, `Updated H&P status to ${next}`);
    } else if (field === 'surgicalConsent') {
      const next = patient.surgicalConsent === 'signed' ? 'pending' : 'signed';
      onUpdatePatient(patientId, { surgicalConsent: next }, `Updated Surgical Consent to ${next}`);
    } else if (field === 'anesthesiaConsent') {
      const next = patient.anesthesiaConsent === 'signed' ? 'pending' : 'signed';
      onUpdatePatient(patientId, { anesthesiaConsent: next }, `Updated Anesthesia Consent to ${next}`);
    } else if (field === 'anesthesiaReady') {
      const next = !patient.anesthesiaReady;
      onUpdatePatient(patientId, { anesthesiaReady: next }, `Updated Anesthesia Pre-Op Clearance to ${next}`);
    }
  };

  const handleFastTrackToPreop = (patient: EpicPatientCase) => {
    onUpdatePatient(
      patient.id,
      {
        currentPhase: 'preop',
        preOpReady: true,
        preOpReadyTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      },
      `Fast-tracked from Scheduling & Clearance to Pre-Op Holding`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Sub-Bar for Scheduling Environment */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Layout View:
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
              onClick={() => onSelectSubView('matrix')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                border: 'none',
                background: selectedSubView === 'matrix' ? 'var(--accent-primary)' : 'transparent',
                color: selectedSubView === 'matrix' ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <LayoutGrid size={13} />
              <span>Clearance & PAT Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSubView('roster')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                border: 'none',
                background: selectedSubView === 'roster' ? 'var(--accent-primary)' : 'transparent',
                color: selectedSubView === 'roster' ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ListFilter size={13} />
              <span>Master Schedule Roster</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSubView('urgent')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                border: 'none',
                background: selectedSubView === 'urgent' ? 'var(--alert-red)' : 'transparent',
                color: selectedSubView === 'urgent' ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <AlertTriangle size={13} />
              <span>Urgent Add-On Queue ({patients.filter(p => p.isAddOn || p.casePriority === 'urgent' || p.casePriority === 'emergent').length})</span>
            </button>
          </div>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Case Priority:</span>
          {(['all', 'elective', 'urgent', 'emergent'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: priorityFilter === p ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                background: priorityFilter === p ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-subtle)',
                color: priorityFilter === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'capitalize',
                cursor: 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        
        {/* VIEW 1: CLEARANCE & PAT MATRIX */}
        {selectedSubView === 'matrix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
                  Pre-Admission Testing (PAT) & Clearance Gatekeeper Matrix
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Verify diagnostic workups, consents, and clinical clearances before patient day-of-surgery arrival.
                </p>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>
                {scheduledCases.length} Patients in Scheduling Pipeline
              </div>
            </div>

            <div style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-header)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Patient / Case</th>
                    <th style={{ padding: '12px 14px' }}>Target Suite</th>
                    <th style={{ padding: '12px 14px' }}>Surgeon</th>
                    <th style={{ padding: '12px 14px' }}>Procedure</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>H&P (30d)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Surg Consent</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Anes Consent</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Anes PAT Eval</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Clearance Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledCases.map((patient) => {
                    const { completed, total, isFull } = getClearanceProgress(patient);
                    return (
                      <tr 
                        key={patient.id} 
                        style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                        onClick={() => onSelectPatient(patient)}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                            {hipaaProtected ? patient.patientInitials : patient.patientName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            MRN: {patient.mrn} • Age {patient.age}{patient.gender}
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-subtle)',
                            border: '1px solid var(--border-medium)',
                            fontSize: 12
                          }}>
                            {patient.roomNumber}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          Dr. {patient.surgeon}
                        </td>

                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {patient.primaryProcedure}
                        </td>

                        {/* H&P Checkbox */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'hpComplete'); }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: patient.hpComplete === 'yes' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                            color: patient.hpComplete === 'yes' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${patient.hpComplete === 'yes' ? '#22c55e' : '#ef4444'}`
                          }}>
                            {patient.hpComplete === 'yes' ? <Check size={16} /> : <X size={14} />}
                          </span>
                        </td>

                        {/* Surgical Consent */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'surgicalConsent'); }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: patient.surgicalConsent === 'signed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                            color: patient.surgicalConsent === 'signed' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${patient.surgicalConsent === 'signed' ? '#22c55e' : '#ef4444'}`
                          }}>
                            {patient.surgicalConsent === 'signed' ? <Check size={16} /> : <X size={14} />}
                          </span>
                        </td>

                        {/* Anesthesia Consent */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'anesthesiaConsent'); }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: patient.anesthesiaConsent === 'signed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                            color: patient.anesthesiaConsent === 'signed' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${patient.anesthesiaConsent === 'signed' ? '#22c55e' : '#ef4444'}`
                          }}>
                            {patient.anesthesiaConsent === 'signed' ? <Check size={16} /> : <X size={14} />}
                          </span>
                        </td>

                        {/* Anesthesia Ready */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'anesthesiaReady'); }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: patient.anesthesiaReady ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                            color: patient.anesthesiaReady ? '#22c55e' : '#ef4444',
                            border: `1px solid ${patient.anesthesiaReady ? '#22c55e' : '#ef4444'}`
                          }}>
                            {patient.anesthesiaReady ? <Check size={16} /> : <X size={14} />}
                          </span>
                        </td>

                        {/* Visual Progress Bar */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: isFull ? '#22c55e' : 'var(--text-secondary)'
                            }}>
                              {completed}/{total} Criteria
                            </div>
                            <div style={{
                              width: 80,
                              height: 6,
                              borderRadius: 3,
                              background: 'var(--surface-subtle)',
                              overflow: 'hidden',
                              border: '1px solid var(--border-light)'
                            }}>
                              <div style={{
                                width: `${(completed / total) * 100}%`,
                                height: '100%',
                                background: isFull ? '#22c55e' : 'var(--accent-primary)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </td>

                        {/* Action: Fast Track to Pre-Op */}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleFastTrackToPreop(patient)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              background: isFull ? '#22c55e' : 'var(--accent-primary)',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>Send to Pre-Op</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: MASTER SCHEDULE ROSTER */}
        {selectedSubView === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
                  Daily Master Perioperative Schedule Roster
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Chronological surgical case line-up by room, order, and scheduled incision milestones.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {scheduledCases.map((patient) => {
                const { completed, total, isFull } = getClearanceProgress(patient);
                return (
                  <div
                    key={patient.id}
                    onClick={() => onSelectPatient(patient)}
                    style={{
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-medium)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent-primary)',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {patient.roomNumber}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>
                          Case #{patient.caseOrder}
                        </span>
                      </div>

                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        background: patient.casePriority === 'emergent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: patient.casePriority === 'emergent' ? '#ef4444' : 'var(--accent-primary)',
                        textTransform: 'uppercase'
                      }}>
                        {patient.casePriority}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {hipaaProtected ? patient.patientInitials : patient.patientName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {patient.primaryProcedure}
                      </div>
                    </div>

                    <div style={{
                      padding: '8px 10px',
                      background: 'var(--surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <div>Surgeon: <strong>Dr. {patient.surgeon}</strong></div>
                      <div>Sched: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.schedInRoom || patient.scheduledStartTime}</strong></div>
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                        PAT Clearance: <strong>{completed}/{total}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleFastTrackToPreop(patient); }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: 'none',
                          background: 'var(--accent-primary)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Advance to Pre-Op
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: URGENT ADD-ON QUEUE */}
        {selectedSubView === 'urgent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase' }}>
                  Urgent & Emergent Add-On Triage Queue
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Prioritized surgical cases booked outside the elective schedule requiring expedited clearances and room assignments.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scheduledCases.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontWeight: 900,
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {patient.roomNumber}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>
                          {hipaaProtected ? patient.patientInitials : patient.patientName}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#ef4444', color: '#fff', fontWeight: 900 }}>
                          ADD-ON
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {patient.primaryProcedure} • Dr. {patient.surgeon} • {patient.anesthesiaType} Anes
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target Time</div>
                      <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {patient.schedInRoom || patient.scheduledStartTime}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleFastTrackToPreop(patient); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Clear & Admit to Holding
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
