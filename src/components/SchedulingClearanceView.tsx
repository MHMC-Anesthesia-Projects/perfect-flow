'use client';

import React, { useState } from 'react';
import { EpicPatientCase, OperatingRoom } from '@/types/journey';
import { 
  CheckCircle2, Clock, AlertTriangle, FileText, Stethoscope, 
  Heart, ShieldAlert, Check, X, ArrowRight, UserCheck, Sparkles, Filter, 
  LayoutGrid, ListFilter, AlertCircle, Shield, HeartPulse, TestTube,
  PackageCheck, Phone, ChevronRight, CheckSquare, Eye, ShieldCheck
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
  const [inspectedPatientId, setInspectedPatientId] = useState<string | null>(null);

  // Filter cases relevant to scheduling & pre-admission testing
  const scheduledCases = patients.filter(p => {
    if (selectedSubView === 'urgent') {
      return p.isAddOn || p.casePriority === 'urgent' || p.casePriority === 'emergent';
    }
    // Spotlight patients in scheduled or arrived phase (not yet in intra-op or recovery)
    const isSchedPhase = p.currentPhase === 'scheduled' || p.currentPhase === 'arrived';
    if (!isSchedPhase) return false;
    if (priorityFilter !== 'all' && p.casePriority !== priorityFilter) return false;
    return true;
  });

  const inspectedPatient = patients.find(p => p.id === inspectedPatientId) || null;

  const getClearanceProgress = (p: EpicPatientCase) => {
    let completed = 0;
    const total = 6;

    if (p.hpComplete === 'yes') completed++;
    if (p.surgicalConsent === 'signed') completed++;
    if (p.anesthesiaConsent === 'signed') completed++;
    if (p.anesthesiaReady) completed++;
    if (p.clearance?.cardiacCleared !== false) completed++;
    if (p.clearance?.labsCleared !== false && p.clearance?.ekgCleared !== false) completed++;

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

  const handleToggleClearanceField = (
    patientId: string,
    field: 'cardiacCleared' | 'labsCleared' | 'ekgCleared' | 'implantsVerified' | 'bloodBankRequired'
  ) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    if (field === 'bloodBankRequired') {
      const next = !patient.bloodBankRequired;
      onUpdatePatient(patientId, { bloodBankRequired: next }, `Updated Blood Bank requirement to ${next}`);
      return;
    }

    const currentClearance = patient.clearance || {
      labsCleared: true,
      ekgCleared: true,
      cardiacCleared: true,
      hpInChart: patient.hpComplete === 'yes',
      consentsOnFile: patient.surgicalConsent === 'signed',
      implantsVerified: true
    };

    const nextVal = !currentClearance[field];
    const updatedClearance = { ...currentClearance, [field]: nextVal };

    onUpdatePatient(
      patientId,
      { clearance: updatedClearance },
      `Updated ${field} status to ${nextVal ? 'Cleared' : 'Pending'}`
    );
  };

  const handleFastTrackToPreop = (patient: EpicPatientCase, targetBay = 'Bay 01') => {
    onUpdatePatient(
      patient.id,
      {
        currentPhase: 'preop',
        preOpBay: targetBay,
        preOpReady: true,
        preOpReadyTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      },
      `Cleared and transferred from Scheduling & Clearance to Pre-Op Holding (${targetBay})`
    );
    if (inspectedPatientId === patient.id) {
      setInspectedPatientId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)', position: 'relative' }}>
      {/* Sub-Bar for Scheduling Environment */}
      <div style={{
        padding: '10px 18px',
        background: 'var(--surface-header)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        
        {/* VIEW 1: CLEARANCE & PAT MATRIX */}
        {selectedSubView === 'matrix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                  Pre-Admission Testing (PAT) & Clearance Gatekeeper Matrix
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Verify diagnostic workups, consents, and clinical clearances before patient day-of-surgery arrival.
                </p>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)' }}>
                {scheduledCases.length} Cases in Scheduling Pipeline
              </div>
            </div>

            <div style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-header)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Patient / Case</th>
                    <th style={{ padding: '10px 12px' }}>Target Suite</th>
                    <th style={{ padding: '10px 12px' }}>Surgeon</th>
                    <th style={{ padding: '10px 12px' }}>Procedure</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>H&P (30d)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Surg Consent</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Anes Consent</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Anes PAT Eval</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cardio / Med</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Labs & EKG</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Clearance Meter</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledCases.map((patient) => {
                    const { completed, total, isFull } = getClearanceProgress(patient);
                    const cardiacOk = patient.clearance?.cardiacCleared !== false;
                    const labsOk = patient.clearance?.labsCleared !== false;
                    const ekgOk = patient.clearance?.ekgCleared !== false;

                    return (
                      <tr 
                        key={patient.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-light)', 
                          cursor: 'pointer',
                          background: inspectedPatientId === patient.id ? 'var(--accent-surface)' : 'transparent'
                        }}
                        onClick={() => setInspectedPatientId(patient.id)}
                      >
                        {/* Patient info */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                            {hipaaProtected ? patient.patientInitials : patient.patientName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            MRN: {patient.mrn} • {patient.age}y {patient.gender}
                          </div>
                          {patient.clearance?.asaClass && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-primary)', marginTop: 2, display: 'inline-block' }}>
                              {patient.clearance.asaClass}
                            </span>
                          )}
                        </td>

                        {/* Target suite */}
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-subtle)',
                            border: '1px solid var(--border-medium)',
                            fontSize: 11
                          }}>
                            {patient.roomNumber}
                          </span>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                            In: {patient.schedInRoom || patient.scheduledStartTime}
                          </div>
                        </td>

                        {/* Surgeon */}
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          Dr. {patient.surgeon}
                        </td>

                        {/* Procedure */}
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{patient.primaryProcedure}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patient.anesthesiaType} Anes</div>
                        </td>

                        {/* H&P Checkbox */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'hpComplete'); }}>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: patient.hpComplete === 'yes' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                              color: patient.hpComplete === 'yes' ? '#16a34a' : '#dc2626',
                              border: `1px solid ${patient.hpComplete === 'yes' ? '#22c55e' : '#ef4444'}`,
                              cursor: 'pointer'
                            }}
                            title={patient.clearance?.hpDate ? `Signed ${patient.clearance.hpDate}` : 'Click to toggle H&P status'}
                          >
                            <span style={{ fontSize: 11, fontWeight: 900 }}>
                              {patient.hpComplete === 'yes' ? '✓ In Chart' : '✗ Needed'}
                            </span>
                            {patient.clearance?.hpDate && (
                              <span style={{ fontSize: 9, opacity: 0.8 }}>{patient.clearance.hpDate}</span>
                            )}
                          </button>
                        </td>

                        {/* Surgical Consent */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'surgicalConsent'); }}>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: patient.surgicalConsent === 'signed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                              color: patient.surgicalConsent === 'signed' ? '#16a34a' : '#dc2626',
                              border: `1px solid ${patient.surgicalConsent === 'signed' ? '#22c55e' : '#ef4444'}`,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 900
                            }}
                            title="Click to toggle Surgical Consent"
                          >
                            {patient.surgicalConsent === 'signed' ? '✓ Signed' : '✗ Missing'}
                          </button>
                        </td>

                        {/* Anesthesia Consent */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'anesthesiaConsent'); }}>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: patient.anesthesiaConsent === 'signed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                              color: patient.anesthesiaConsent === 'signed' ? '#16a34a' : '#dc2626',
                              border: `1px solid ${patient.anesthesiaConsent === 'signed' ? '#22c55e' : '#ef4444'}`,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 900
                            }}
                            title="Click to toggle Anesthesia Consent"
                          >
                            {patient.anesthesiaConsent === 'signed' ? '✓ Signed' : '✗ Missing'}
                          </button>
                        </td>

                        {/* Anesthesia Ready */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleCheck(patient.id, 'anesthesiaReady'); }}>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: patient.anesthesiaReady ? 'rgba(34, 197, 94, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                              color: patient.anesthesiaReady ? '#16a34a' : '#d97706',
                              border: `1px solid ${patient.anesthesiaReady ? '#22c55e' : '#d97706'}`,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 900
                            }}
                            title="Click to toggle Anesthesia PAT Clearance"
                          >
                            {patient.anesthesiaReady ? '✓ Evaluated' : '⏳ Pending'}
                          </button>
                        </td>

                        {/* Cardio / Medical Clearance */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleToggleClearanceField(patient.id, 'cardiacCleared'); }}>
                          <button
                            type="button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: cardiacOk ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                              color: cardiacOk ? '#16a34a' : '#dc2626',
                              border: `1px solid ${cardiacOk ? '#22c55e' : '#ef4444'}`,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 900
                            }}
                            title={patient.clearance?.cardiacNotes || 'Cardio clearance status'}
                          >
                            <Shield size={12} />
                            <span>{cardiacOk ? 'Cleared' : 'Pending'}</span>
                          </button>
                        </td>

                        {/* Diagnostic Labs & EKG */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <span 
                              style={{
                                padding: '2px 5px',
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 800,
                                background: labsOk ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                                color: labsOk ? '#16a34a' : '#dc2626',
                                border: `1px solid ${labsOk ? '#22c55e' : '#ef4444'}`
                              }}
                              title={patient.clearance?.labsNotes || 'Labs status'}
                            >
                              Labs: {labsOk ? 'OK' : 'Pend'}
                            </span>
                            <span 
                              style={{
                                padding: '2px 5px',
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 800,
                                background: ekgOk ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                                color: ekgOk ? '#16a34a' : '#dc2626',
                                border: `1px solid ${ekgOk ? '#22c55e' : '#ef4444'}`
                              }}
                              title={patient.clearance?.ekgNotes || 'EKG status'}
                            >
                              EKG: {ekgOk ? 'OK' : 'Pend'}
                            </span>
                          </div>
                        </td>

                        {/* Visual Progress Bar */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: isFull ? '#16a34a' : 'var(--text-secondary)'
                            }}>
                              {completed}/{total}
                            </div>
                            <div style={{
                              width: 70,
                              height: 5,
                              borderRadius: 3,
                              background: 'var(--surface-subtle)',
                              overflow: 'hidden',
                              border: '1px solid var(--border-light)'
                            }}>
                              <div style={{
                                width: `${(completed / total) * 100}%`,
                                height: '100%',
                                background: isFull ? '#16a34a' : 'var(--accent-primary)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td style={{ padding: '10px 12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setInspectedPatientId(patient.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-medium)',
                                background: 'var(--surface-card)',
                                color: 'var(--accent-primary)',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Inspect full PAT Clearance dossier"
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFastTrackToPreop(patient, 'Bay 01')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: isFull ? '#16a34a' : 'var(--accent-primary)',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Advance patient to Pre-Op Holding"
                            >
                              <span>Send Pre-Op</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Daily Master Perioperative Schedule Roster
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Chronological surgical case line-up by room, order, and scheduled incision milestones.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {scheduledCases.map((patient) => {
                const { completed, total, isFull } = getClearanceProgress(patient);
                return (
                  <div
                    key={patient.id}
                    onClick={() => setInspectedPatientId(patient.id)}
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
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {hipaaProtected ? patient.patientInitials : patient.patientName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {patient.primaryProcedure}
                      </div>
                    </div>

                    {/* Clearance badges strip */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        background: patient.hpComplete === 'yes' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: patient.hpComplete === 'yes' ? '#16a34a' : '#dc2626'
                      }}>
                        H&P: {patient.hpComplete === 'yes' ? 'OK' : 'Need'}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        background: patient.clearance?.cardiacCleared !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: patient.clearance?.cardiacCleared !== false ? '#16a34a' : '#dc2626'
                      }}>
                        Cardio: {patient.clearance?.cardiacCleared !== false ? 'Cleared' : 'Pending'}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        background: patient.bloodBankRequired ? 'rgba(220, 38, 38, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                        color: patient.bloodBankRequired ? '#dc2626' : 'var(--text-secondary)'
                      }}>
                        {patient.bloodBankRequired ? '🩸 Blood Bank Cross' : 'No Blood Req'}
                      </span>
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
                      <div>In-Room: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.schedInRoom || patient.scheduledStartTime}</strong></div>
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                        Clearance: <strong>{completed}/{total}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setInspectedPatientId(patient.id); }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--border-medium)',
                            background: 'var(--surface-card)',
                            color: 'var(--accent-primary)',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleFastTrackToPreop(patient, 'Bay 01'); }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            border: 'none',
                            background: isFull ? '#16a34a' : 'var(--accent-primary)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Advance Pre-Op
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: URGENT ADD-ON QUEUE */}
        {selectedSubView === 'urgent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', margin: 0 }}>
                  Urgent & Emergent Add-On Triage Queue
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Expedited surgical add-ons booked outside the elective schedule requiring rapid clearance verification.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scheduledCases.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setInspectedPatientId(patient.id)}
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
                      onClick={(e) => { e.stopPropagation(); handleFastTrackToPreop(patient, 'Bay 01'); }}
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

      {/* =========================================================================
          SLIDE-OUT PAT & CLEARANCE DOSSIER DRAWER
          ========================================================================= */}
      {inspectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(620px, 92vw)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-modal)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-medium)',
          animation: 'slideInRight 0.25s ease'
        }}>
          {/* Drawer Header */}
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
                borderRadius: 6,
                background: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900
              }}>
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
                  Pre-Admission Testing & Clearance Dossier
                </h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Stage 1 Preadmission Workup • Room {inspectedPatient.roomNumber}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedPatientId(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Patient Snapshot Card */}
            <div style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                    {hipaaProtected ? inspectedPatient.patientInitials : inspectedPatient.patientName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    MRN: {inspectedPatient.mrn} • {inspectedPatient.age}y {inspectedPatient.gender} • DOB: {inspectedPatient.dob || '1959-04-18'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {inspectedPatient.roomNumber}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    In: {inspectedPatient.schedInRoom || inspectedPatient.scheduledStartTime}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div><strong>Procedure:</strong> {inspectedPatient.primaryProcedure}</div>
                <div><strong>Surgeon:</strong> Dr. {inspectedPatient.surgeon}</div>
                <div><strong>Anesthesia:</strong> {inspectedPatient.anesthesiaType} ({inspectedPatient.anesthesiologist})</div>
                <div><strong>ASA Physical Status:</strong> {inspectedPatient.clearance?.asaClass || 'ASA II'}</div>
              </div>
            </div>

            {/* SECTION 1: REGULATORY & CONSENTS */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={14} />
                <span>1. Regulatory & Consents Gatekeepers</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* H&P */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>History & Physical (30-Day Rule)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {inspectedPatient.clearance?.hpDate ? `Signed ${inspectedPatient.clearance.hpDate} (Valid 30 days)` : 'Signed in EMR chart'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(inspectedPatient.id, 'hpComplete')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: inspectedPatient.hpComplete === 'yes' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                      color: inspectedPatient.hpComplete === 'yes' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${inspectedPatient.hpComplete === 'yes' ? '#22c55e' : '#ef4444'}`,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    {inspectedPatient.hpComplete === 'yes' ? '✓ Verified in Chart' : '✗ Pending'}
                  </button>
                </div>

                {/* Surgical Consent */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>Surgical Informed Consent</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Procedure description matches scheduled case</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(inspectedPatient.id, 'surgicalConsent')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: inspectedPatient.surgicalConsent === 'signed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                      color: inspectedPatient.surgicalConsent === 'signed' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${inspectedPatient.surgicalConsent === 'signed' ? '#22c55e' : '#ef4444'}`,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    {inspectedPatient.surgicalConsent === 'signed' ? '✓ On File' : '✗ Missing'}
                  </button>
                </div>

                {/* Anesthesia Consent */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>Anesthesia Informed Consent</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Consent for {inspectedPatient.anesthesiaType} and blood products</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(inspectedPatient.id, 'anesthesiaConsent')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: inspectedPatient.anesthesiaConsent === 'signed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                      color: inspectedPatient.anesthesiaConsent === 'signed' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${inspectedPatient.anesthesiaConsent === 'signed' ? '#22c55e' : '#ef4444'}`,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    {inspectedPatient.anesthesiaConsent === 'signed' ? '✓ On File' : '✗ Missing'}
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: CARDIOLOGY & MEDICAL CLEARANCES */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Heart size={14} style={{ color: '#ef4444' }} />
                  <span>2. Cardiology & Medical Clearance</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleClearanceField(inspectedPatient.id, 'cardiacCleared')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: inspectedPatient.clearance?.cardiacCleared !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                    color: inspectedPatient.clearance?.cardiacCleared !== false ? '#16a34a' : '#dc2626',
                    border: `1px solid ${inspectedPatient.clearance?.cardiacCleared !== false ? '#22c55e' : '#ef4444'}`,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 10
                  }}
                >
                  {inspectedPatient.clearance?.cardiacCleared !== false ? '✓ Cleared' : '✗ Pending'}
                </button>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--surface-subtle)', borderRadius: 6, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Cardiology Clinical Note:</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  {inspectedPatient.clearance?.cardiacNotes || 'Low cardiovascular risk. Functional capacity > 4 METS. Cleared for elective surgery.'}
                </div>
              </div>
            </div>

            {/* SECTION 3: DIAGNOSTIC LABS & EKG WORKUP */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TestTube size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>3. Pre-Admission Diagnostics (Labs & 12-Lead EKG)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Labs */}
                <div style={{ padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>Diagnostic Lab Workup</div>
                    <button
                      type="button"
                      onClick={() => handleToggleClearanceField(inspectedPatient.id, 'labsCleared')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        background: inspectedPatient.clearance?.labsCleared !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: inspectedPatient.clearance?.labsCleared !== false ? '#16a34a' : '#dc2626',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {inspectedPatient.clearance?.labsCleared !== false ? '✓ Cleared' : 'Pending'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {inspectedPatient.clearance?.labsNotes || 'CBC, BMP, PT/INR, and Type & Screen valid within 72 hours.'}
                  </div>
                </div>

                {/* EKG */}
                <div style={{ padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>12-Lead EKG</div>
                    <button
                      type="button"
                      onClick={() => handleToggleClearanceField(inspectedPatient.id, 'ekgCleared')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        background: inspectedPatient.clearance?.ekgCleared !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: inspectedPatient.clearance?.ekgCleared !== false ? '#16a34a' : '#dc2626',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {inspectedPatient.clearance?.ekgCleared !== false ? '✓ Cleared' : 'Pending'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {inspectedPatient.clearance?.ekgNotes || 'Normal sinus rhythm. No acute ischemic changes.'}
                  </div>
                </div>

                {/* Blood Bank */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>Blood Bank Crossmatch</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {inspectedPatient.bloodBankRequired ? '2 Units PRBCs on hold at blood bank' : 'Type & Screen on file (No crossmatch required)'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleClearanceField(inspectedPatient.id, 'bloodBankRequired')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: inspectedPatient.bloodBankRequired ? 'rgba(220, 38, 38, 0.15)' : 'var(--surface-card)',
                      color: inspectedPatient.bloodBankRequired ? '#dc2626' : 'var(--text-secondary)',
                      border: '1px solid var(--border-medium)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: 10
                    }}
                  >
                    {inspectedPatient.bloodBankRequired ? '🩸 Units Reserved' : 'None Required'}
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 4: IMPLANTS & SPECIAL SUPPLIES */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PackageCheck size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>4. Implants & Specialized Equipment</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleClearanceField(inspectedPatient.id, 'implantsVerified')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: inspectedPatient.clearance?.implantsVerified !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                    color: inspectedPatient.clearance?.implantsVerified !== false ? '#16a34a' : '#dc2626',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 10
                  }}
                >
                  {inspectedPatient.clearance?.implantsVerified !== false ? '✓ Verified' : 'Pending'}
                </button>
              </div>

              <div style={{ padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                {inspectedPatient.clearance?.specialSuppliesNotes || 'Standard surgical instrumentation. No vendor specialty rep required.'}
              </div>
            </div>

            {/* SECTION 5: FASTING & COMPANION TRANSPORT */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>5. Fasting (NPO) & Transportation Companion</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div>
                  <strong>Fasting Instruction:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {inspectedPatient.clearance?.npoStatus || 'NPO since midnight prior to surgery.'}
                  </span>
                </div>
                {inspectedPatient.familyCommunication && (
                  <div>
                    <strong>Companion:</strong> {inspectedPatient.familyCommunication.primaryName} •{' '}
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{inspectedPatient.familyCommunication.primaryPhone}</span>
                  </div>
                )}
                {inspectedPatient.specialNeeds && (
                  <div>
                    <strong>Special Needs:</strong>{' '}
                    <span style={{ color: 'var(--alert-red)', fontWeight: 700 }}>{inspectedPatient.specialNeeds}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--surface-header)',
            borderTop: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              type="button"
              onClick={() => onSelectPatient(inspectedPatient)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Open Full Case Chart
            </button>

            <button
              type="button"
              onClick={() => handleFastTrackToPreop(inspectedPatient, 'Bay 01')}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--phase-preop-bg)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span>Promote to Stage 2: Pre-Op Holding</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
