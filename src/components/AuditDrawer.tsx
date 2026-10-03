'use client';

import React from 'react';
import { AuditLogEntry } from '@/types/flow';
import { X, ShieldCheck, Clock } from 'lucide-react';

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, height: '80vh', padding: 0 }}
      >
        <div style={{
          padding: '16px 20px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
              Clinical Audit & Perioperative Activity Trail
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: 13 }}>
              No logged activities recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{log.user}</span>
                      <span>•</span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-medium)',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {log.action}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <Clock size={11} />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                    {log.details}
                  </div>

                  {log.patientName && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Patient: <strong>{log.patientName}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
