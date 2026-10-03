'use client';

import React, { useState } from 'react';
import { EpicPatientCase, PerioperativePhase, User } from '@/types/flow';
import { 
  X, Check, AlertCircle, Clock, UserCheck, 
  ShieldAlert, Phone, FileText, Stethoscope, 
  Activity, ArrowRight, HeartPulse, Sparkles, Plus 
} from 'lucide-react';

interface ProcedureDetailModalProps {
  patient: EpicPatientCase | null;
  onClose: () => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  currentUser: User;
  hipaaProtected: boolean;
}

export const ProcedureDetailModal: React.FC<ProcedureDetailModalProps> = ({
  patient,
  onClose,
  onUpdatePatient,
  currentUser,
  hipaaProtected
}) => {
  if (!patient) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'preop' | 'intraop' | 'pacu'>('overview');
  const [localComments, setLocalComments] = useState(patient.comments || '');
  const [localDelay, setLocalDelay] = useState(patient.delayReason || '');
  const [localRecoveryNeeds, setLocalRecoveryNeeds] = useState(patient.recoveryNeeds || '');

  const formatTimeNow = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handlePhaseAdvance = (nextPhase: PerioperativePhase) => {
    const timeNow = formatTimeNow();
    const updates: Partial<EpicPatientCase> = { currentPhase: nextPhase };

    if (nextPhase === 'in_surgery' && !patient.inRoomTime) {
      updates.inRoomTime = timeNow;
      if (!patient.surgeryStartTime) updates.surgeryStartTime = timeNow;
    } else if (nextPhase === 'closing' && !patient.surgeryEndTime) {
      updates.surgeryEndTime = timeNow;
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
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1040, height: '92vh' }}>
        {/* Top Clinical Header Bar */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 22,
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              color: 'var(--text-primary)'
            }}>
              {patient.roomNumber}
            </div>

            {patient.isAddOn && (
              <span style={{
                background: 'var(--alert-red)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Plus size={13} strokeWidth={3} /> ADD ON ({patient.addOnTime || 'Urgent'})
              </span>
            )}

            <div style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              background: patient.currentPhase === 'in_surgery' ? 'var(--phase-surgery-bg)' :
                          patient.currentPhase === 'closing' ? 'var(--phase-closing-bg)' :
                          patient.currentPhase === 'preop' ? 'var(--phase-preop-bg)' :
                          patient.currentPhase === 'pacu' ? 'var(--phase-pacu-bg)' :
                          patient.currentPhase === 'phase2' ? 'var(--phase-phase2-bg)' : 'var(--phase-sched-bg)',
              color: '#ffffff'
            }}>
              {patient.currentPhase.replace('_', ' ')}
            </div>
          </div>

          {/* Quick Timing Grid */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>IN-ROOM</span>
              <strong>{patient.inRoomTime || '--:--'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>CUT / INCISION</span>
              <strong style={{ color: 'var(--phase-surgery-bg)' }}>{patient.surgeryStartTime || '--:--'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>CLOSING</span>
              <strong style={{ color: 'var(--phase-closing-bg)' }}>{patient.surgeryEndTime || '--:--'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>OUT-ROOM</span>
              <strong>{patient.outRoomTime || '--:--'}</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Patient Demographic Banner */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border-light)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 20,
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 19, fontWeight: 900 }}>{displayName}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                ({patient.age}y {patient.gender})
              </span>
              {patient.isConfidential && (
                <span style={{ fontSize: 10, padding: '1px 6px', background: 'var(--alert-red-light)', color: 'var(--alert-red)', fontWeight: 800, borderRadius: 4 }}>
                  CONFIDENTIAL
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 3 }}>
              <span>DOB: <strong>{patient.dob}</strong></span>
              <span>Wt: <strong>{patient.weightKg} kg</strong></span>
              <span>Ht: <strong>{patient.heightCm} cm</strong></span>
              <span>MRN: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.mrn}</strong></span>
              <span>Case #: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.epicCaseId}</strong></span>
            </div>
          </div>

          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div>Inpatient Bed: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{patient.inpatientBed || 'Outpatient'}</strong></div>
            <div>Latex Allergy: <strong>{patient.latexAllergy ? 'YES (ALERT)' : 'No'}</strong></div>
            <div>Infection Precautions: <strong style={{ textTransform: 'uppercase' }}>{patient.infectionStatus}</strong></div>
          </div>

          {/* Phase Forward Button */}
          <div style={{ display: 'flex', gap: 8 }}>
            {patient.currentPhase === 'preop' && (
              <button
                type="button"
                onClick={() => handlePhaseAdvance('in_surgery')}
                className="header-btn"
                style={{ background: 'var(--phase-surgery-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                Wheels In OR <ArrowRight size={14} />
              </button>
            )}
            {patient.currentPhase === 'in_surgery' && (
              <button
                type="button"
                onClick={() => handlePhaseAdvance('closing')}
                className="header-btn"
                style={{ background: 'var(--phase-closing-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                Mark Closing <ArrowRight size={14} />
              </button>
            )}
            {patient.currentPhase === 'closing' && (
              <button
                type="button"
                onClick={() => handlePhaseAdvance('pacu')}
                className="header-btn"
                style={{ background: 'var(--phase-pacu-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                Transfer to PACU <ArrowRight size={14} />
              </button>
            )}
            {patient.currentPhase === 'pacu' && (
              <button
                type="button"
                onClick={() => handlePhaseAdvance('phase2')}
                className="header-btn"
                style={{ background: 'var(--phase-phase2-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                Phase II Recovery <ArrowRight size={14} />
              </button>
            )}
            {patient.currentPhase === 'phase2' && (
              <button
                type="button"
                onClick={() => handlePhaseAdvance('completed')}
                className="header-btn"
                style={{ background: 'var(--phase-complete-bg)', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                Discharge Complete <Check size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '0 20px',
          gap: 16
        }}>
          {[
            { id: 'overview', label: '1. Overview & Surgical Detail' },
            { id: 'preop', label: '2. Pre-Op & Holding Checkpoints' },
            { id: 'intraop', label: '3. Intra-Op & Operating Room' },
            { id: 'pacu', label: '4. PACU & Phase II Recovery' }
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
          {/* TAB 1: OVERVIEW & SURGICAL DETAIL */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Primary Surgical Procedure
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                    {patient.primaryProcedure}
                  </div>
                  {patient.secondaryProcedure && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {patient.secondaryProcedure}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
                    <div>Proc Codes: <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient.procedureCodes.join(', ')}</strong></div>
                    <div>Case Order: <strong>{patient.caseOrder}</strong></div>
                    <div>Priority: <strong style={{ textTransform: 'uppercase' }}>{patient.casePriority}</strong></div>
                    <div>Anesthesia: <strong>{patient.anesthesiaType}</strong></div>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Clinical Team Assigned
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                    <div>Attending Surgeon: <strong>{patient.surgeon}</strong></div>
                    <div>Surgical Assistant: <strong>{patient.surgicalAssistant || 'None'}</strong></div>
                    <div>Anesthesiologist: <strong>{patient.anesthesiologist}</strong></div>
                    <div>CRNA / Resident: <strong>{patient.crna || 'None'}</strong></div>
                    <div>Circulator RN: <strong>{patient.circulatorRN || 'Unassigned'}</strong></div>
                    <div>Scrub Tech: <strong>{patient.scrubTech || 'Unassigned'}</strong></div>
                  </div>
                </div>

                {/* Clinical Comments */}
                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Case Comments & Special Instructions
                  </div>
                  <input
                    type="text"
                    value={localComments}
                    onChange={(e) => setLocalComments(e.target.value)}
                    onBlur={() => onUpdatePatient(patient.id, { comments: localComments }, 'Updated case comments')}
                    placeholder="Enter case comments (e.g. TF URO CASE, report called)..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      fontSize: 13
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Family & Misc Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Family Communication
                  </div>
                  {patient.familyCommunication ? (
                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Primary Contact: <strong>{patient.familyCommunication.primaryName}</strong></div>
                      <div>Phone: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{patient.familyCommunication.primaryPhone}</strong></div>
                      {patient.familyCommunication.primaryNotes && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Note: {patient.familyCommunication.primaryNotes}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <input
                          type="checkbox"
                          checked={patient.familyCommunication.prefersPhoneCall}
                          onChange={(e) => onUpdatePatient(patient.id, {
                            familyCommunication: { ...patient.familyCommunication!, prefersPhoneCall: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: 12 }}>Prefers phone call updates during surgery</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No family contact on file.</div>
                  )}
                </div>

                <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Special Medical Attributes
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.defibPacemaker}
                        onChange={(e) => onUpdatePatient(patient.id, { defibPacemaker: e.target.checked })}
                      />
                      <span>Defib / Pacemaker</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.bloodBankRequired}
                        onChange={(e) => onUpdatePatient(patient.id, { bloodBankRequired: e.target.checked })}
                      />
                      <span>Blood Bank Crossmatch</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.erasPathway}
                        onChange={(e) => onUpdatePatient(patient.id, { erasPathway: e.target.checked })}
                      />
                      <span>ERAS Pathway</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={patient.anesthesiaTransport}
                        onChange={(e) => onUpdatePatient(patient.id, { anesthesiaTransport: e.target.checked })}
                      />
                      <span>Anes Transport</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRE-OP & HOLDING CHECKPOINTS */}
          {activeTab === 'preop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Pre-Op Holding Location & Pre-Op RN */}
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--phase-preop-bg)' }}>PRE-OP LOCATION</div>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {patient.preOpBay || 'Holding Bay 01'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Assigned Pre-Op RN: <strong>{patient.preOpRN || 'Yenis S.'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      preOpReady: !patient.preOpReady,
                      preOpReadyTime: !patient.preOpReady ? formatTimeNow() : undefined
                    }, 'Toggled Pre-Op Ready')}
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
                    }, 'Toggled Surgeon ID/Seen')}
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
                    }, 'Toggled Report Called')}
                    className="header-btn"
                    style={{
                      background: patient.reportCalled ? 'var(--accent-primary)' : 'var(--surface-card)',
                      color: patient.reportCalled ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Phone size={14} /> Report Called
                  </button>
                </div>
              </div>

              {/* Clinical Gatekeeper Dropdowns */}
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
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>H&P (History & Physical)</label>
                  <select
                    value={patient.hpComplete}
                    onChange={(e) => onUpdatePatient(patient.id, { hpComplete: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="yes">Completed / Verified</option>
                    <option value="pending">Pending Update / Signature</option>
                    <option value="na">Not Applicable</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Surgical Consent</label>
                  <select
                    value={patient.surgicalConsent}
                    onChange={(e) => onUpdatePatient(patient.id, { surgicalConsent: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="signed">Signed & Witnessed</option>
                    <option value="pending">Pending Surgeon Review</option>
                    <option value="refused">Refused / Escalation</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Anesthesia Consent</label>
                  <select
                    value={patient.anesthesiaConsent}
                    onChange={(e) => onUpdatePatient(patient.id, { anesthesiaConsent: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="signed">Signed & Reviewed</option>
                    <option value="pending">Pending Pre-Op Anesthesia</option>
                    <option value="refused">Refused</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Surgical Site Marked</label>
                  <select
                    value={patient.siteMarked}
                    onChange={(e) => onUpdatePatient(patient.id, { siteMarked: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="yes">Marked & Verified with Pt</option>
                    <option value="pending">NOT Marked (Waiting for Surgeon)</option>
                    <option value="na">N/A (Non-laterality / Endoscopic)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>UPT (Pregnancy Test)</label>
                  <select
                    value={patient.uptResult || 'na'}
                    onChange={(e) => onUpdatePatient(patient.id, { uptResult: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="negative">Negative</option>
                    <option value="positive">Positive (Alert)</option>
                    <option value="waived">Waived / Post-Menopausal</option>
                    <option value="na">N/A</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Surgical Hair Clipping</label>
                  <select
                    value={patient.clipNeeded || 'no'}
                    onChange={(e) => onUpdatePatient(patient.id, { clipNeeded: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="no">No Clipping Needed</option>
                    <option value="yes_done">Clipping Complete</option>
                    <option value="yes_pending">Clipping Needed (Pending)</option>
                  </select>
                </div>
              </div>

              {/* Anesthesia Pre-Op Evaluation & Block Status */}
              <div style={{
                background: 'var(--surface-subtle)',
                padding: 18,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 10 }}>
                  Anesthesia Pre-Op Evaluation & Regional Blocks
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      anesthesiaReady: !patient.anesthesiaReady,
                      anesthesiaReadyTime: !patient.anesthesiaReady ? formatTimeNow() : undefined
                    })}
                    className="header-btn"
                    style={{
                      background: patient.anesthesiaReady ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.anesthesiaReady ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Check size={14} /> Ane. Ready {patient.anesthesiaReadyTime ? `@ ${patient.anesthesiaReadyTime}` : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      anesthesiaTechReady: !patient.anesthesiaTechReady
                    })}
                    className="header-btn"
                    style={{
                      background: patient.anesthesiaTechReady ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.anesthesiaTechReady ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Check size={14} /> Ane. Tech Ready
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>Regional Block:</span>
                    <select
                      value={patient.blockStatus}
                      onChange={(e) => onUpdatePatient(patient.id, { blockStatus: e.target.value as any })}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                    >
                      <option value="not_needed">Block Not Needed</option>
                      <option value="ordered">Block Ordered</option>
                      <option value="in_progress">Block In Progress</option>
                      <option value="completed">Block Completed</option>
                    </select>

                    {patient.blockType && (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: 12 }}>
                        ({patient.blockType})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTRA-OP & OPERATING ROOM */}
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--phase-surgery-bg)' }}>ACTIVE OPERATING SUITE</div>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {patient.roomNumber}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Circulator: <strong>{patient.circulatorRN || 'Marybeth Q.'}</strong> • Scrub Tech: <strong>{patient.scrubTech || 'Rakesha R.'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      circPreopVisit: !patient.circPreopVisit
                    })}
                    className="header-btn"
                    style={{
                      background: patient.circPreopVisit ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.circPreopVisit ? '#fff' : 'var(--text-primary)',
                      fontWeight: 700
                    }}
                  >
                    <Check size={14} /> Circ PreOp Visit
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      roomReady: !patient.roomReady
                    })}
                    className="header-btn"
                    style={{
                      background: patient.roomReady ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.roomReady ? '#fff' : 'var(--text-primary)',
                      fontWeight: 700
                    }}
                  >
                    <Check size={14} /> Room Ready
                  </button>
                </div>
              </div>

              {/* Surgical Time Stamps */}
              <div style={{
                background: 'var(--surface-subtle)',
                padding: 18,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16
              }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Wheels In (In-Room)</label>
                  <input
                    type="time"
                    value={patient.inRoomTime || ''}
                    onChange={(e) => onUpdatePatient(patient.id, { inRoomTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Surgery Start (Cut)</label>
                  <input
                    type="time"
                    value={patient.surgeryStartTime || ''}
                    onChange={(e) => onUpdatePatient(patient.id, { surgeryStartTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Surgery End (Closing)</label>
                  <input
                    type="time"
                    value={patient.surgeryEndTime || ''}
                    onChange={(e) => onUpdatePatient(patient.id, { surgeryEndTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Wheels Out (Out-Room)</label>
                  <input
                    type="time"
                    value={patient.outRoomTime || ''}
                    onChange={(e) => onUpdatePatient(patient.id, { outRoomTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* Delay Reason */}
              <div style={{
                background: 'var(--surface-subtle)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  OR Delay Reason (If Applicable)
                </div>
                <input
                  type="text"
                  value={localDelay}
                  onChange={(e) => setLocalDelay(e.target.value)}
                  onBlur={() => onUpdatePatient(patient.id, { delayReason: localDelay }, 'Updated delay reason')}
                  placeholder="e.g. Waiting for surgeon consent, instrument sterilization turnover, ICU bed hold..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-medium)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: PACU & PHASE II RECOVERY */}
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--phase-pacu-bg)' }}>PACU PHASE I RECOVERY</div>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {patient.pacuLocation || 'PACU Bay 01'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    PACU Nurse: <strong>{patient.pacuRN || 'Bethany K.'}</strong> • Arrived: <strong>{patient.pacuArrivalTime || '--:--'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      readyForAnesSignout: !patient.readyForAnesSignout,
                      anesSignoutTime: !patient.readyForAnesSignout ? formatTimeNow() : undefined
                    }, 'Toggled Ready for Anesthesia Signout')}
                    className="header-btn"
                    style={{
                      background: patient.readyForAnesSignout ? 'var(--phase-surgery-bg)' : 'var(--surface-card)',
                      color: patient.readyForAnesSignout ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <Check size={14} /> Ready for Anes Signout {patient.anesSignoutTime ? `@ ${patient.anesSignoutTime}` : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePatient(patient.id, {
                      pacuToFloorHold: !patient.pacuToFloorHold
                    }, 'Toggled Floor Hold Alert')}
                    className="header-btn"
                    style={{
                      background: patient.pacuToFloorHold ? 'var(--alert-red)' : 'var(--surface-card)',
                      color: patient.pacuToFloorHold ? '#fff' : 'var(--text-primary)',
                      fontWeight: 800
                    }}
                  >
                    <AlertCircle size={14} /> PACU to Floor Hold
                  </button>
                </div>
              </div>

              {/* Phase II & Inpatient Bed Status */}
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
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--phase-phase2-bg)', marginBottom: 8 }}>
                    Phase II Ambulatory Discharge
                  </div>
                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Station: <strong>{patient.phase2Location || 'Phase II Station 01'}</strong></div>
                    <div>Phase II Nurse: <strong>{patient.phase2Nurse || 'Rachel P.'}</strong></div>
                    <div>Arrived Phase II: <strong>{patient.phase2ArrivalTime || '--:--'}</strong></div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 8 }}>
                    Bed Placement & Orders
                  </div>
                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Inpatient Target Bed: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{patient.inpatientBed || 'Ambulatory Discharge'}</strong></div>
                    <div>Post-Op X-Ray: <strong>{patient.xrayOrdered ? 'Ordered / Completed' : 'Not Ordered'}</strong></div>
                    <div>Physical Therapy: <strong>{patient.ptOrdered ? 'Consult Active' : 'Not Required'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Recovery Needs */}
              <div style={{
                background: 'var(--surface-subtle)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Post-Op Recovery Needs & Transportation
                </div>
                <input
                  type="text"
                  value={localRecoveryNeeds}
                  onChange={(e) => setLocalRecoveryNeeds(e.target.value)}
                  onBlur={() => onUpdatePatient(patient.id, { recoveryNeeds: localRecoveryNeeds }, 'Updated recovery needs')}
                  placeholder="e.g. Crutches trained, tolerating fluids, spouse in waiting room..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-medium)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Close */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--surface-header)',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Epic OpTime Case #{patient.epicCaseId} • MRN {patient.mrn}
          </div>

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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
