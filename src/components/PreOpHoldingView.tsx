'use client';

import React, { useState } from 'react';
import { EpicPatientCase } from '@/types/flow';
import { 
  Check, X, Phone, UserCheck, Stethoscope, AlertTriangle, 
  ShieldCheck, ArrowRight, LayoutGrid, List, Sparkles, Filter 
} from 'lucide-react';

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
  // Display mode: 'card' (Bay Tiles) or 'table' (Manager Worklist Table)
  const [displayMode, setDisplayMode] = useState<'card' | 'table'>('card');
  const [filterReadyOnly, setFilterReadyOnly] = useState<boolean>(false);

  // Filter patients that are currently in Pre-Op or scheduled next
  const allPreOpPatients = patients.filter(p => p.currentPhase === 'preop' || (p.currentPhase === 'scheduled' && p.preOpBay));

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

  const preOpPatients = filterReadyOnly 
    ? allPreOpPatients.filter(isReadyForOR) 
    : allPreOpPatients;

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
      {/* Top Header & View Mode Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-card)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'var(--phase-preop-bg)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900
          }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
              Pre-Op Holding & Anesthesia Readiness
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Holding Bays • Clinical Gatekeeper Checkpoints • "Clear to Roll" OR Board
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Card vs Table Segmented Toggle */}
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
              onClick={() => setDisplayMode('card')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: displayMode === 'card' ? 'var(--accent-primary)' : 'transparent',
                color: displayMode === 'card' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <LayoutGrid size={14} />
              <span>Bay Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: displayMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                color: displayMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <List size={14} />
              <span>Manager Table</span>
            </button>
          </div>

          {/* Quick Filter: Ready for Wheels In */}
          <button
            type="button"
            onClick={() => setFilterReadyOnly(prev => !prev)}
            style={{
              padding: '6px 14px',
              background: filterReadyOnly ? 'var(--phase-surgery-bg)' : 'rgba(22, 163, 74, 0.15)',
              border: '1px solid var(--phase-surgery-bg)',
              color: filterReadyOnly ? '#ffffff' : 'var(--phase-surgery-bg)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ShieldCheck size={14} />
            <span>{allPreOpPatients.filter(isReadyForOR).length} Ready for Wheels In</span>
          </button>

          <div style={{
            padding: '6px 14px',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700
          }}>
            Total in Holding: {allPreOpPatients.length}
          </div>
        </div>
      </div>

      {/* VIEW 1: BAY CARDS GRID */}
      {displayMode === 'card' ? (
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
                      {patient.age}y {patient.gender} • Sched {patient.schedInRoom || patient.scheduledStartTime}
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
      ) : (
        /* VIEW 2: INFORMATIVE PRE-OP MANAGER TABLE WORKLIST */
        <div style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 13
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface-subtle)',
                borderBottom: '2px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                <th style={{ padding: '12px 14px' }}>Bay</th>
                <th style={{ padding: '12px 10px' }}>Target OR</th>
                <th style={{ padding: '12px 12px' }}>Patient (Age, Bed)</th>
                <th style={{ padding: '12px 12px' }}>Procedure</th>
                <th style={{ padding: '12px 10px' }}>Surgeon / RN</th>
                <th style={{ padding: '12px 10px' }}>Sched In</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>H&P</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>Surg Con</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>Anes Con</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>Site Mark</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>Anes Ready</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>Block</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }}>Report</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Clearance / Action</th>
              </tr>
            </thead>

            <tbody>
              {preOpPatients.map((patient) => {
                const clearToRoll = isReadyForOR(patient);
                const displayName = hipaaProtected ? patient.patientInitials : patient.patientName;

                return (
                  <tr
                    key={patient.id}
                    onClick={() => onSelectPatient(patient)}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      background: clearToRoll ? 'rgba(22, 163, 74, 0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = clearToRoll ? 'rgba(22, 163, 74, 0.04)' : 'transparent')}
                  >
                    {/* Bay */}
                    <td style={{ padding: '12px 14px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'var(--phase-preop-bg)',
                        color: '#fff',
                        fontSize: 12
                      }}>
                        {patient.preOpBay || 'Holding'}
                      </span>
                    </td>

                    {/* Target OR */}
                    <td style={{ padding: '12px 10px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                      {patient.roomNumber}
                    </td>

                    {/* Patient */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {patient.age}y {patient.gender} • {patient.inpatientBed || 'Ambulatory'}
                      </div>
                      {patient.preOpAlerts && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: 2,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: 'var(--alert-red-light)',
                          color: 'var(--alert-red)',
                          fontSize: 10,
                          fontWeight: 800
                        }}>
                          {patient.preOpAlerts}
                        </span>
                      )}
                    </td>

                    {/* Procedure */}
                    <td style={{ padding: '12px 12px', maxWidth: 220 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {patient.primaryProcedure}
                      </div>
                    </td>

                    {/* Surgeon & Pre-Op RN */}
                    <td style={{ padding: '12px 10px', fontSize: 12 }}>
                      <div>Dr. <strong>{patient.surgeon}</strong></div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>RN: {patient.preOpRN || 'Yenis S.'}</div>
                    </td>

                    {/* Sched In-Room */}
                    <td style={{ padding: '12px 10px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {patient.schedInRoom || patient.scheduledStartTime}
                    </td>

                    {/* H&P 1-Tap Toggle */}
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePatient(patient.id, { hpComplete: patient.hpComplete === 'yes' ? 'pending' : 'yes' });
                        }}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: 'none',
                          background: patient.hpComplete === 'yes' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-subtle)',
                          color: patient.hpComplete === 'yes' ? 'var(--phase-surgery-bg)' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {patient.hpComplete === 'yes' ? 'YES' : 'PEND'}
                      </button>
                    </td>

                    {/* Surg Consent 1-Tap Toggle */}
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePatient(patient.id, { surgicalConsent: patient.surgicalConsent === 'signed' ? 'pending' : 'signed' });
                        }}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: 'none',
                          background: patient.surgicalConsent === 'signed' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-subtle)',
                          color: patient.surgicalConsent === 'signed' ? 'var(--phase-surgery-bg)' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {patient.surgicalConsent === 'signed' ? 'YES' : 'PEND'}
                      </button>
                    </td>

                    {/* Anes Consent 1-Tap Toggle */}
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePatient(patient.id, { anesthesiaConsent: patient.anesthesiaConsent === 'signed' ? 'pending' : 'signed' });
                        }}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: 'none',
                          background: patient.anesthesiaConsent === 'signed' ? 'rgba(22, 163, 74, 0.15)' : 'var(--surface-subtle)',
                          color: patient.anesthesiaConsent === 'signed' ? 'var(--phase-surgery-bg)' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {patient.anesthesiaConsent === 'signed' ? 'YES' : 'PEND'}
                      </button>
                    </td>

                    {/* Site Marked 1-Tap Toggle */}
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePatient(patient.id, { siteMarked: patient.siteMarked === 'yes' ? 'pending' : 'yes' });
                        }}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: 'none',
                          background: patient.siteMarked === 'yes' ? 'rgba(22, 163, 74, 0.15)' : 'var(--alert-red-light)',
                          color: patient.siteMarked === 'yes' ? 'var(--phase-surgery-bg)' : 'var(--alert-red)',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {patient.siteMarked === 'yes' ? 'MARKED' : 'NO'}
                      </button>
                    </td>

                    {/* Anesthesia Ready 1-Tap Toggle */}
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
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
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: 'none',
                          background: patient.anesthesiaReady ? 'rgba(2, 132, 199, 0.15)' : 'var(--surface-subtle)',
                          color: patient.anesthesiaReady ? 'var(--accent-primary)' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {patient.anesthesiaReady ? 'READY' : 'PEND'}
                      </button>
                    </td>

                    {/* Block Status */}
                    <td style={{ padding: '12px 6px', textAlign: 'center', fontSize: 11 }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: patient.blockStatus === 'completed' ? 'rgba(22, 163, 74, 0.15)' :
                                    patient.blockStatus === 'in_progress' ? '#fef3c7' : 'var(--surface-subtle)',
                        color: patient.blockStatus === 'completed' ? 'var(--phase-surgery-bg)' :
                               patient.blockStatus === 'in_progress' ? '#b45309' : 'var(--text-muted)',
                        fontWeight: 800
                      }}>
                        {patient.blockStatus === 'completed' ? 'DONE' :
                         patient.blockStatus === 'in_progress' ? 'IN PROG' : 'N/A'}
                      </span>
                    </td>

                    {/* Report Called 1-Tap Toggle */}
                    <td style={{ padding: '12px 6px', textAlign: 'center' }}>
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
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: 'none',
                          background: patient.reportCalled ? 'rgba(2, 132, 199, 0.15)' : 'var(--surface-subtle)',
                          color: patient.reportCalled ? 'var(--accent-primary)' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <Phone size={10} />
                        <span>{patient.reportCalled ? 'YES' : 'NO'}</span>
                      </button>
                    </td>

                    {/* Clearance / Wheels In Action */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {clearToRoll ? (
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
                            padding: '6px 12px',
                            borderRadius: 4,
                            background: 'var(--phase-surgery-bg)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                          }}
                        >
                          <ShieldCheck size={13} />
                          <span>Wheels In OR</span>
                        </button>
                      ) : (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'var(--surface-subtle)',
                          color: 'var(--phase-preop-bg)',
                          fontSize: 11,
                          fontWeight: 800,
                          border: '1px solid var(--phase-preop-bg)'
                        }}>
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
