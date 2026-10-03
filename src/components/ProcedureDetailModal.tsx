'use client';

import React, { useState } from 'react';
import { EpicPatientCase, PerioperativePhase, User } from '@/types/flow';
import { validateRoomTurnover } from '@/lib/turnoverValidation';
import { 
  X, Check, AlertCircle, Clock, UserCheck, 
  ShieldAlert, Phone, FileText, Stethoscope, 
  Activity, ArrowRight, HeartPulse, Sparkles, Plus, AlertTriangle, Edit3 
} from 'lucide-react';

interface ProcedureDetailModalProps {
  patient: EpicPatientCase | null;
  onClose: () => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  currentUser: User;
  hipaaProtected: boolean;
  allPatients: EpicPatientCase[];
  minTurnoverMinutes?: number;
}

export const ProcedureDetailModal: React.FC<ProcedureDetailModalProps> = ({
  patient,
  onClose,
  onUpdatePatient,
  currentUser,
  hipaaProtected,
  allPatients,
  minTurnoverMinutes = 15
}) => {
  if (!patient) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'preop' | 'intraop' | 'pacu'>('overview');
  const [localComments, setLocalComments] = useState(patient.comments || '');
  const [localDelay, setLocalDelay] = useState(patient.delayReason || '');
  const [localRecoveryNeeds, setLocalRecoveryNeeds] = useState(patient.recoveryNeeds || '');
  
  // Editable times
  const [schedInRoom, setSchedInRoom] = useState(patient.schedInRoom || patient.scheduledStartTime || '08:00');
  const [schedCut, setSchedCut] = useState(patient.schedCut || patient.scheduledStartTime || '08:30');
  const [schedOutRoom, setSchedOutRoom] = useState(patient.schedOutRoom || patient.scheduledEndTime || '10:00');

  const [inRoomTime, setInRoomTime] = useState(patient.inRoomTime || '');
  const [surgeryStartTime, setSurgeryStartTime] = useState(patient.surgeryStartTime || '');
  const [surgeryEndTime, setSurgeryEndTime] = useState(patient.surgeryEndTime || '');
  const [outRoomTime, setOutRoomTime] = useState(patient.outRoomTime || '');

  const [turnoverError, setTurnoverError] = useState<string | null>(null);

  const formatTimeNow = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleTimeBlur = (
    field: 'schedInRoom' | 'schedOutRoom' | 'inRoomTime' | 'outRoomTime',
    val: string
  ) => {
    setTurnoverError(null);
    const proposedStart = field === 'schedInRoom' ? val : (patient.inRoomTime || schedInRoom);
    const proposedEnd = field === 'schedOutRoom' ? val : (patient.outRoomTime || schedOutRoom);

    // Validate turnover against other cases in the same room
    const validation = validateRoomTurnover(
      patient.roomNumber,
      proposedStart,
      proposedEnd,
      patient.id,
      allPatients,
      minTurnoverMinutes
    );

    if (validation.hasConflict) {
      setTurnoverError(validation.message || 'Turnover buffer too tight!');
      return;
    }

    const updates: Partial<EpicPatientCase> = { [field]: val };
    if (field === 'schedInRoom') updates.scheduledStartTime = val;
    if (field === 'schedOutRoom') updates.scheduledEndTime = val;

    onUpdatePatient(patient.id, updates, `Updated ${field} to ${val}`);
  };

  const handlePhaseAdvance = (nextPhase: PerioperativePhase) => {
    const timeNow = formatTimeNow();
    const updates: Partial<EpicPatientCase> = { currentPhase: nextPhase };

    if (nextPhase === 'in_surgery') {
      if (!patient.inRoomTime) updates.inRoomTime = timeNow;
      if (!patient.surgeryStartTime) updates.surgeryStartTime = timeNow;
    } else if (nextPhase === 'closing') {
      if (!patient.surgeryEndTime) updates.surgeryEndTime = timeNow;
    } else if (nextPhase === 'pacu') {
      if (!patient.outRoomTime) updates.outRoomTime = timeNow;
      if (!patient.pacuArrivalTime) updates.pacuArrivalTime = timeNow;
      if (!patient.pacuLocation) updates.pacuLocation = 'PACU Bay 01';
    } else if (nextPhase === 'phase2') {
      if (!patient.phase2ArrivalTime) updates.phase2ArrivalTime = timeNow;
      if (!patient.phase2Location) updates.phase2Location = 'Phase II Station 01';
    } else if (nextPhase === 'completed') {
      updates.completedTime = timeNow;
    }

    onUpdatePatient(patient.id, updates, `Advanced phase to ${nextPhase.toUpperCase()}`);
  };

  const displayName = hipaaProtected ? patient.patientInitials : patient.patientName;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1060, height: '94vh' }}>
        {/* Top Header Row matching OR Control exact layout */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 16,
          alignItems: 'center'
        }}>
          {/* Room Name & Add-On Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 24,
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              color: 'var(--text-primary)'
            }}>
              {patient.roomNumber}
            </div>

            {patient.isAddOn && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  background: 'var(--alert-red)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Plus size={13} strokeWidth={3} /> Add On ()
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Added by: {patient.addedBy || 'Charge'} at {patient.addOnTime || '20:09'}
                </span>
              </div>
            )}
          </div>

          {/* Center: Phase Action Banner Button (Completed / In Process / Pre-Op) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              minWidth: 180,
              padding: '8px 24px',
              borderRadius: 6,
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              background: patient.currentPhase === 'in_surgery' ? 'var(--phase-surgery-bg)' :
                          patient.currentPhase === 'closing' ? 'var(--phase-closing-bg)' :
                          patient.currentPhase === 'completed' ? '#64748b' :
                          patient.currentPhase === 'preop' ? 'var(--phase-preop-bg)' :
                          patient.currentPhase === 'pacu' ? 'var(--phase-pacu-bg)' : 'var(--phase-sched-bg)',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {patient.currentPhase === 'in_surgery' ? 'In Process' :
               patient.currentPhase === 'completed' ? 'Completed' :
               patient.currentPhase.replace('_', ' ')}
            </div>
          </div>

          {/* EXACT OR CONTROL DUAL-ROW TIMING GRID: Sched vs Act/Upd */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              display: 'grid',
              gridTemplateColumns: '70px 80px 80px 80px',
              gap: 8,
              alignItems: 'center',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 12
            }}>
              <div />
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>In-Room</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>Cut</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>Out-Room</div>

              <div style={{ fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'left' }}>Act/Upd:</div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{inRoomTime || patient.inRoomTime || '--:--'}</div>
              <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--phase-surgery-bg)' }}>{surgeryStartTime || patient.surgeryStartTime || '--:--'}</div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{outRoomTime || patient.outRoomTime || '--:--'}</div>

              <div style={{ fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'left' }}>Sched:</div>
              <input
                type="text"
                value={schedInRoom}
                onChange={(e) => setSchedInRoom(e.target.value)}
                onBlur={(e) => handleTimeBlur('schedInRoom', e.target.value)}
                style={{ width: '100%', padding: '2px 4px', textAlign: 'center', border: '1px solid var(--border-light)', borderRadius: 3, background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}
              />
              <input
                type="text"
                value={schedCut}
                onChange={(e) => setSchedCut(e.target.value)}
                onBlur={() => onUpdatePatient(patient.id, { schedCut }, 'Updated scheduled cut')}
                style={{ width: '100%', padding: '2px 4px', textAlign: 'center', border: '1px solid var(--border-light)', borderRadius: 3, background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}
              />
              <input
                type="text"
                value={schedOutRoom}
                onChange={(e) => setSchedOutRoom(e.target.value)}
                onBlur={(e) => handleTimeBlur('schedOutRoom', e.target.value)}
                style={{ width: '100%', padding: '2px 4px', textAlign: 'center', border: '1px solid var(--border-light)', borderRadius: 3, background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TURNOVER BUFFER CONFLICT ERROR BANNER (MANDATORY 15-MINUTE RULE) */}
        {turnoverError && (
          <div style={{
            background: 'var(--alert-red-light)',
            borderBottom: '2px solid var(--alert-red)',
            color: 'var(--alert-red)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 800,
            animation: 'slideUp 0.15s ease-out'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{turnoverError}</div>
            <button
              type="button"
              onClick={() => setTurnoverError(null)}
              style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer', fontWeight: 900 }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Procedure & Surgeon Bar from Image */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {patient.primaryProcedure}
              </div>
              {patient.secondaryProcedure && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {patient.secondaryProcedure}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div>Case #: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.epicCaseId}</strong></div>
              <div>Case Order: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.caseOrder}</strong></div>
              <div>Anesthesia Type: <strong>{patient.anesthesiaType}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>Proc Code: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.procedureCodes.join(', ')}</strong></span>
              <span>Comments: <strong style={{ color: 'var(--accent-primary)' }}>{patient.comments || 'TF URO CASE'}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Surgeon: <strong>{patient.surgeon}</strong></span>
              {patient.reportCalled && (
                <span style={{ color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'lowercase' }}>
                  report called
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Patient Demographics Banner matching exact image */}
        <div style={{
          padding: '10px 20px',
          background: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: 16,
          alignItems: 'center',
          fontSize: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>{displayName}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>({patient.age}y)</span>
              <Edit3 size={13} style={{ color: 'var(--text-muted)' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, fontSize: 11, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={patient.isConfidential}
                  onChange={(e) => onUpdatePatient(patient.id, { isConfidential: e.target.checked })}
                />
                <span>Confidential</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 4, color: 'var(--text-secondary)' }}>
              <span>DOB: <strong>{patient.dob}</strong></span>
              <span>Weight: <strong>{patient.weightKg} kg</strong></span>
              <span>Height: <strong>{patient.heightCm} cm</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>Account Number: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.accountNumber}</strong></div>
            <div>MRN: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.mrn}</strong></div>
            <div>Inpatient Bed: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{patient.inpatientBed || 'Outpatient'}</strong></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>Allergy: <strong>{patient.latexAllergy ? 'LATEX (ALERT)' : 'Latex Sens: No'}</strong></div>
            <div>Infection: <strong>{patient.infectionStatus.toUpperCase()}</strong></div>
            <div>Scheduled Arrival: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.scheduledArrival}</strong></div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '0 20px',
          gap: 16
        }}>
          {[
            { id: 'overview', label: 'Details & Misc Info' },
            { id: 'preop', label: 'Pre-Op & Holding' },
            { id: 'intraop', label: 'In Process (Intra-Op)' },
            { id: 'pacu', label: 'PACU & Phase II Recovery' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 6px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* TAB 1: DETAILS & MISC */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Misc. Clinical Checkboxes
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.casePriority === 'emergent'}
                        onChange={(e) => onUpdatePatient(patient.id, { casePriority: e.target.checked ? 'emergent' : 'elective' })}
                      />
                      <span>Emergency</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.anesthesiaTransport}
                        onChange={(e) => onUpdatePatient(patient.id, { anesthesiaTransport: e.target.checked })}
                      />
                      <span>Anesthesia Transport</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.defibPacemaker}
                        onChange={(e) => onUpdatePatient(patient.id, { defibPacemaker: e.target.checked })}
                      />
                      <span>Defib. / Pacemaker</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.preOpBypass}
                        onChange={(e) => onUpdatePatient(patient.id, { preOpBypass: e.target.checked })}
                      />
                      <span>Pre-Op Bypass</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.erasPathway}
                        onChange={(e) => onUpdatePatient(patient.id, { erasPathway: e.target.checked })}
                      />
                      <span>ERAS</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.scopeEgd}
                        onChange={(e) => onUpdatePatient(patient.id, { scopeEgd: e.target.checked })}
                      />
                      <span>Scope / EGD</span>
                    </label>
                  </div>
                </div>

                {/* Case Comments */}
                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Case Comments & Booking Notes
                  </div>
                  <input
                    type="text"
                    value={localComments}
                    onChange={(e) => setLocalComments(e.target.value)}
                    onBlur={() => onUpdatePatient(patient.id, { comments: localComments }, 'Updated case comments')}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Family Communication */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Family Communication
                  </div>
                  {patient.familyCommunication ? (
                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Primary: <strong>{patient.familyCommunication.primaryName}</strong></div>
                      <div>Phone: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{patient.familyCommunication.primaryPhone}</strong></div>
                      {patient.familyCommunication.primaryNotes && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Notes: {patient.familyCommunication.primaryNotes}</div>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={patient.familyCommunication.prefersPhoneCall}
                          onChange={(e) => onUpdatePatient(patient.id, {
                            familyCommunication: { ...patient.familyCommunication!, prefersPhoneCall: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: 12 }}>Prefers Phone Call</span>
                      </label>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No family contact assigned.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRE-OP & HOLDING */}
          {activeTab === 'preop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid var(--phase-preop-bg)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--phase-preop-bg)' }}>PRE-OP LOCATION:</div>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {patient.preOpBay || 'LABS'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Pre-Op RN: <strong>{patient.preOpRN || 'Yenis S.'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      preOpReady: !patient.preOpReady,
                      preOpReadyTime: !patient.preOpReady ? formatTimeNow() : undefined
                    })}
                    className="header-btn"
                    style={{
                      background: patient.preOpReady ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.preOpReady ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Check size={14} /> Pre-Op Ready {patient.preOpReadyTime ? `@ ${patient.preOpReadyTime}` : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      surgeonSeen: !patient.surgeonSeen,
                      surgeonSeenTime: !patient.surgeonSeen ? formatTimeNow() : undefined
                    })}
                    className="header-btn"
                    style={{
                      background: patient.surgeonSeen ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.surgeonSeen ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <UserCheck size={14} /> Surgeon ID {patient.surgeonSeenTime ? `@ ${patient.surgeonSeenTime}` : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      reportCalled: !patient.reportCalled,
                      reportCalledTime: !patient.reportCalled ? formatTimeNow() : undefined
                    })}
                    className="header-btn"
                    style={{
                      background: patient.reportCalled ? 'var(--accent-primary)' : 'var(--surface-card)',
                      color: patient.reportCalled ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Phone size={14} /> Mark Report Called
                  </button>
                </div>
              </div>

              {/* Checkpoints list */}
              <div style={{
                background: 'var(--surface-subtle)',
                padding: 18,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16
              }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>H&P:</label>
                  <select
                    value={patient.hpComplete}
                    onChange={(e) => onUpdatePatient(patient.id, { hpComplete: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="yes">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="na">N/A</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Surgical Consent:</label>
                  <select
                    value={patient.surgicalConsent}
                    onChange={(e) => onUpdatePatient(patient.id, { surgicalConsent: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="signed">Signed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Anesthesia Consent:</label>
                  <select
                    value={patient.anesthesiaConsent}
                    onChange={(e) => onUpdatePatient(patient.id, { anesthesiaConsent: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="signed">Signed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Site Marked:</label>
                  <select
                    value={patient.siteMarked}
                    onChange={(e) => onUpdatePatient(patient.id, { siteMarked: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="yes">Yes</option>
                    <option value="pending">No / Pending</option>
                    <option value="na">N/A</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>UPT:</label>
                  <select
                    value={patient.uptResult || 'na'}
                    onChange={(e) => onUpdatePatient(patient.id, { uptResult: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="na">N/A</option>
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Clip Needed:</label>
                  <select
                    value={patient.clipNeeded || 'no'}
                    onChange={(e) => onUpdatePatient(patient.id, { clipNeeded: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="no">No</option>
                    <option value="yes_done">Yes - Completed</option>
                    <option value="yes_pending">Yes - Pending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IN PROCESS (INTRA-OP) */}
          {activeTab === 'intraop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid var(--phase-surgery-bg)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--phase-surgery-bg)' }}>IN PROCESS SUITE</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    Circulator: <strong>{patient.circulatorRN || 'Marybeth Q.'}</strong> • Scrub Tech: <strong>{patient.scrubTech || 'Rakesha R.'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const now = formatTimeNow();
                      setSurgeryStartTime(now);
                      onUpdatePatient(patient.id, { surgeryStartTime: now }, 'Logged Surgery Start');
                    }}
                    className="header-btn"
                    style={{ background: 'var(--phase-surgery-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
                  >
                    Surgery Start @ {surgeryStartTime || patient.surgeryStartTime || 'Now'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const now = formatTimeNow();
                      setSurgeryEndTime(now);
                      onUpdatePatient(patient.id, { surgeryEndTime: now, currentPhase: 'closing' }, 'Logged Surgery End');
                    }}
                    className="header-btn"
                    style={{ background: 'var(--phase-closing-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
                  >
                    Surgery End @ {surgeryEndTime || patient.surgeryEndTime || 'Now'}
                  </button>
                </div>
              </div>

              {/* Delay reason */}
              <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Delay Reason:
                </div>
                <input
                  type="text"
                  value={localDelay}
                  onChange={(e) => setLocalDelay(e.target.value)}
                  onBlur={() => onUpdatePatient(patient.id, { delayReason: localDelay }, 'Updated delay reason')}
                  placeholder="Enter delay reason if OR turnover or start was delayed..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: PACU & PHASE II */}
          {activeTab === 'pacu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid var(--phase-pacu-bg)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--phase-pacu-bg)' }}>PACU LOCATION:</div>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {patient.pacuLocation || 'PACU Bay 01'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    PACU RN: <strong>{patient.pacuRN || 'Bethany K.'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      readyForAnesSignout: !patient.readyForAnesSignout,
                      anesSignoutTime: !patient.readyForAnesSignout ? formatTimeNow() : undefined
                    })}
                    className="header-btn"
                    style={{
                      background: patient.readyForAnesSignout ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.readyForAnesSignout ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Check size={14} /> Ready for Anes Signout
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      pacuToFloorHold: !patient.pacuToFloorHold
                    })}
                    className="header-btn"
                    style={{
                      background: patient.pacuToFloorHold ? 'var(--alert-red)' : 'var(--surface-card)',
                      color: patient.pacuToFloorHold ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    PACU to Floor Hold
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Big Red "Close" Bar matching OR Control screenshot bottom */}
        <div
          onClick={onClose}
          style={{
            background: 'var(--alert-red)',
            color: '#ffffff',
            textAlign: 'center',
            padding: '10px 0',
            fontWeight: 900,
            fontSize: 18,
            cursor: 'pointer',
            letterSpacing: 1
          }}
        >
          Close
        </div>
      </div>
    </div>
  );
};
