'use client';

import React, { useState } from 'react';
import { StaffMember } from '@/types/journey';
import { X, Search, UserCheck, Check, Phone, Shield, UserX, Plus } from 'lucide-react';

interface StaffPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  roleSlot: 'anesthesiologist' | 'crna' | 'circulatorRN' | 'scrubTech' | 'anesTech';
  roleLabel: string;
  currentStaffName?: string;
  staffRoster: StaffMember[];
  onSelectStaff: (staffDisplayName: string) => void;
}

export const StaffPickerModal: React.FC<StaffPickerModalProps> = ({
  isOpen,
  onClose,
  roomName,
  roleSlot,
  roleLabel,
  currentStaffName,
  staffRoster,
  onSelectStaff
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [customName, setCustomName] = useState('');

  // Map slot to expected staff role
  const getExpectedRole = (slot: string): string[] => {
    switch (slot) {
      case 'anesthesiologist':
        return ['Anesthesiologist'];
      case 'crna':
        return ['CRNA', 'Anesthesiologist'];
      case 'circulatorRN':
        return ['Circulator RN', 'Pre-Op RN', 'PACU RN'];
      case 'scrubTech':
        return ['Scrub Tech', 'Circulator RN'];
      case 'anesTech':
        return ['Anes Tech'];
      default:
        return [];
    }
  };

  const expectedRoles = getExpectedRole(roleSlot);

  const filteredStaff = staffRoster.filter(s => {
    if (s.active === false) return false;

    // Filter by role unless "show all roles" is toggled
    if (!showAllRoles && expectedRoles.length > 0) {
      if (!expectedRoles.includes(s.role)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.staffName.toLowerCase().includes(q) ||
        s.displayName.toLowerCase().includes(q) ||
        s.environmentHome.toLowerCase().includes(q) ||
        s.cell.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleSelect = (displayName: string) => {
    onSelectStaff(displayName);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onSelectStaff(customName.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--accent-primary)',
                color: '#fff'
              }}>
                {roleLabel.toUpperCase()}
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Assign to {roomName}</h3>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Currently: <strong>{currentStaffName || 'Unassigned'}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Role Scope */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Search ${roleLabel} roster by name, department, or cell...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 13
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showAllRoles}
                onChange={(e) => setShowAllRoles(e.target.checked)}
              />
              <span>Show entire hospital staff (cross-coverage)</span>
            </label>

            {currentStaffName && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <UserX size={12} />
                <span>Clear Slot</span>
              </button>
            )}
          </div>
        </div>

        {/* Staff List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredStaff.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No staff members found matching "{searchQuery}" with role {roleLabel}.
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const isSelected = currentStaffName === staff.displayName || currentStaffName === staff.staffName;
              return (
                <div
                  key={staff.id}
                  onClick={() => handleSelect(staff.displayName)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isSelected ? 'var(--accent-primary)' : 'var(--surface-subtle)',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                      border: '1px solid var(--border-medium)'
                    }}>
                      {staff.displayName.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {staff.displayName}
                        {staff.staffName !== staff.displayName && (
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>
                            ({staff.staffName})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span>{staff.role}</span>
                        <span>•</span>
                        <span>{staff.environmentHome}</span>
                        {staff.cell && (
                          <>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{staff.cell}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ color: 'var(--accent-primary)' }}>
                      <Check size={18} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Custom Locum / Quick Entry */}
        <form onSubmit={handleCustomSubmit} style={{
          padding: '12px 16px',
          background: 'var(--surface-subtle)',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Or enter custom traveler/locum name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              fontSize: 12
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={14} />
            <span>Set</span>
          </button>
        </form>
      </div>
    </div>
  );
};
