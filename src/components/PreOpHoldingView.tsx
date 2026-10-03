'use client';

import React from 'react';
import { EpicPatientCase } from '@/types/flow';
import { Check, X, Phone, UserCheck, Stethoscope, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface PreOpHoldingViewProps {
  patients: EpicPatientCase[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  onUpdatePatient: (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => void;
  hipaaProtected: boolean;
}

export const PreOpHoldingView: React.FC<PreOpHoldingViewProps> = ({
  patients,
  onSelectPatient,
  onUpdatePatient,
  hipaaProtected
}) => {
  // Filter patients that are currently in Pre-Op or scheduled next
  const preOpPatients = patients.filter(p => p.currentPhase === 'preop' || (p.currentPhase === 'scheduled' && p.preOpBay));

  const formatTimeNow = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Check if all gates are green for "Clear to Roll to OR"
  const isReadyForOR = (p: EpicPatientCase) => {
    return (
      p.preOpReady &&
      p.hpComplete === 'yes' &&
      p.surgicalConsent === 'signed' &&
      p.anesthesiaConsent === 'signed' &&
      p.siteMarked === 'yes' &&
      p.anesthesiaReady &&
      p.reportCalled
    );
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
            background: 'var(--phase-preop-bg)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900
          }}>
            <Stethoscope size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
              Pre-Op Holding & Anesthesia Readiness Board
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Active Holding Bays • Clinical Gatekeepers & "Clear to Roll" Checklist
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            padding: '6px 14px',
            background: 'rgba(22, 163, 74, 0.15)',
            border: '1px solid var(--phase-surgery-bg)',
            color: 'var(--phase-surgery-bg)',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800
          }}>
            {preOpPatients.filter(isReadyForOR).length} Ready for Wheels In
          </div>

          <div style={{
            padding: '6px 14px',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700
          }}>
            Total in Holding: {preOpPatients.length}
          </div>
        </div>
      </div>

      {/* Grid of Pre-Op Bays */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 16
      }}>
        {preOpPatients.map((patient) => {
          const clearToRoll = isReadyForOR(patient);
          const displayName = hipaaProtected ? patient.patientInitials : patient.patientName;

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              style={{
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: clearToRoll ? '2px solid var(--phase-surgery-bg)' : '1px solid var(--border-medium)',
                boxShadow: clearToRoll ? '0 0 14px rgba(22, 163, 74, 0.25)' : 'var(--shadow-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all var(--transition-fast)'
              }}
            >
              {/* Bay Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'var(--phase-preop-bg)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {patient.preOpBay || 'Holding'}
                  </span>

                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    Target: {patient.roomNumber}
                  </span>
                </div>

                {clearToRoll ? (
                  <span style={{
                    background: 'var(--phase-surgery-bg)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <ShieldCheck size={13} /> CLEAR FOR OR
                  </span>
                ) : (
                  <span style={{
                    background: 'var(--surface-subtle)',
                    color: 'var(--phase-preop-bg)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    border: '1px solid var(--phase-preop-bg)'
                  }}>
                    CHECKLIST PENDING
                  </span>
                )}
              </div>

              {/* Patient Info & Procedure */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{displayName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {patient.age}y {patient.gender} • Sched {patient.scheduledStartTime}
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
                  Surgeon: <strong style={{ color: 'var(--text-primary)' }}>{patient.surgeon}</strong> • Pre-Op RN: <strong>{patient.preOpRN || 'Yenis S.'}</strong>
                </div>
              </div>

              {/* Pre-Op Alert Banner (If Any) */}
              {patient.preOpAlerts && (
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
                  <AlertTriangle size={13} />
                  <span>{patient.preOpAlerts}</span>
                </div>
              )}

              {/* 1-Tap Gatekeeper Matrix */}
              <div style={{
                background: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                fontSize: 11
              }}>
                {/* H&P Complete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      hpComplete: patient.hpComplete === 'yes' ? 'pending' : 'yes'
                    });
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: patient.hpComplete === 'yes' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-card)',
                    color: patient.hpComplete === 'yes' ? 'var(--phase-surgery-bg)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>H&P Verified</span>
                  {patient.hpComplete === 'yes' ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                </button>

                {/* Surgical Consent */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      surgicalConsent: patient.surgicalConsent === 'signed' ? 'pending' : 'signed'
                    });
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: patient.surgicalConsent === 'signed' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-card)',
                    color: patient.surgicalConsent === 'signed' ? 'var(--phase-surgery-bg)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Surg Consent</span>
                  {patient.surgicalConsent === 'signed' ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                </button>

                {/* Anesthesia Consent */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      anesthesiaConsent: patient.anesthesiaConsent === 'signed' ? 'pending' : 'signed'
                    });
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: patient.anesthesiaConsent === 'signed' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-card)',
                    color: patient.anesthesiaConsent === 'signed' ? 'var(--phase-surgery-bg)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Anes Consent</span>
                  {patient.anesthesiaConsent === 'signed' ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                </button>

                {/* Site Marked */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      siteMarked: patient.siteMarked === 'yes' ? 'pending' : 'yes'
                    });
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: patient.siteMarked === 'yes' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-card)',
                    color: patient.siteMarked === 'yes' ? 'var(--phase-surgery-bg)' : 'var(--alert-red)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Site Marked</span>
                  {patient.siteMarked === 'yes' ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                </button>

                {/* Anesthesia Ready */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      anesthesiaReady: !patient.anesthesiaReady,
                      anesthesiaReadyTime: !patient.anesthesiaReady ? formatTimeNow() : undefined
                    });
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: patient.anesthesiaReady ? 'rgba(2, 132, 199, 0.15)' : 'var(--surface-card)',
                    color: patient.anesthesiaReady ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Ane. Ready</span>
                  {patient.anesthesiaReady ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                </button>

                {/* Report Called */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePatient(patient.id, {
                      reportCalled: !patient.reportCalled,
                      reportCalledTime: !patient.reportCalled ? formatTimeNow() : undefined
                    });
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-medium)',
                    background: patient.reportCalled ? 'rgba(2, 132, 199, 0.15)' : 'var(--surface-card)',
                    color: patient.reportCalled ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Report Called</span>
                  {patient.reportCalled ? <Phone size={11} /> : <X size={12} />}
                </button>
              </div>

              {/* Wheels In OR Action Button */}
              {clearToRoll && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const now = formatTimeNow();
                    onUpdatePatient(patient.id, {
                      currentPhase: 'in_surgery',
                      inRoomTime: now,
                      surgeryStartTime: now
                    }, `Wheels In to ${patient.roomNumber}`);
                  }}
                  style={{
                    padding: '10px 0',
                    borderRadius: 6,
                    background: 'var(--phase-surgery-bg)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span>Wheels In to {patient.roomNumber}</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
