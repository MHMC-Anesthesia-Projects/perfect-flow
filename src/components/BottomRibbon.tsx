'use client';

import React from 'react';
import { EpicPatientCase, PerioperativePhase } from '@/types/flow';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BottomRibbonProps {
  patients: EpicPatientCase[];
  selectedPhaseFilter: PerioperativePhase | 'add_on' | null;
  onSelectPhaseFilter: (filter: PerioperativePhase | 'add_on' | null) => void;
  onOpenAudit: () => void;
  auditCount: number;
}

export const BottomRibbon: React.FC<BottomRibbonProps> = ({
  patients,
  selectedPhaseFilter,
  onSelectPhaseFilter,
  onOpenAudit,
  auditCount
}) => {
  const getCount = (phase: PerioperativePhase) => {
    return patients.filter(p => p.currentPhase === phase).length;
  };

  const addOnsCount = patients.filter(p => p.isAddOn).length;

  const filters: { id: PerioperativePhase | 'add_on'; label: string; count: number; bg: string; fg: string }[] = [
    { id: 'scheduled', label: 'Scheduled', count: getCount('scheduled'), bg: 'var(--phase-sched-bg)', fg: 'var(--phase-sched-fg)' },
    { id: 'preop', label: 'Pre-Op', count: getCount('preop'), bg: 'var(--phase-preop-bg)', fg: 'var(--phase-preop-fg)' },
    { id: 'in_surgery', label: 'In Surgery', count: getCount('in_surgery'), bg: 'var(--phase-surgery-bg)', fg: 'var(--phase-surgery-fg)' },
    { id: 'closing', label: 'Closing', count: getCount('closing'), bg: 'var(--phase-closing-bg)', fg: 'var(--phase-closing-fg)' },
    { id: 'pacu', label: 'PACU', count: getCount('pacu'), bg: 'var(--phase-pacu-bg)', fg: 'var(--phase-pacu-fg)' },
    { id: 'phase2', label: 'Phase II', count: getCount('phase2'), bg: 'var(--phase-phase2-bg)', fg: 'var(--phase-phase2-fg)' },
    { id: 'completed', label: 'Completed', count: getCount('completed'), bg: 'var(--phase-complete-bg)', fg: 'var(--phase-complete-fg)' },
    { id: 'add_on', label: 'Add-Ons', count: addOnsCount, bg: 'var(--alert-red)', fg: '#ffffff' }
  ];

  return (
    <footer className="bottom-ribbon">
      {/* Status pills with counts */}
      <div className="status-counts">
        <button
          type="button"
          onClick={() => onSelectPhaseFilter(null)}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            fontWeight: 800,
            background: selectedPhaseFilter === null ? 'var(--accent-primary)' : 'var(--surface-subtle)',
            color: selectedPhaseFilter === null ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            cursor: 'pointer'
          }}
        >
          All Cases ({patients.length})
        </button>

        {filters.map((f) => {
          const isSelected = selectedPhaseFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className="status-badge-item"
              onClick={() => onSelectPhaseFilter(isSelected ? null : f.id)}
              style={{
                background: isSelected ? f.bg : 'var(--surface-subtle)',
                color: isSelected ? f.fg : 'var(--text-primary)',
                border: isSelected ? `2px solid ${f.bg}` : '1px solid var(--border-light)',
                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <span>{f.label}</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 11,
                background: isSelected ? 'rgba(255,255,255,0.25)' : f.bg,
                color: '#ffffff',
                fontWeight: 900
              }}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Audit Drawer Trigger & System Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onOpenAudit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
          title="Open Clinical Activity & Audit Trail"
        >
          <ShieldCheck size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Audit Log ({auditCount})</span>
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          PERFECT FLOW v1.0
        </div>
      </div>
    </footer>
  );
};
