'use client';

import React, { useState } from 'react';
import { EpicPatientCase, OperatingRoom } from '@/types/flow';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: OperatingRoom[];
  onAddPatient: (newPatient: EpicPatientCase) => void;
}

export const AddOnModal: React.FC<AddOnModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onAddPatient
}) => {
  if (!isOpen) return null;

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState(50);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [roomNumber, setRoomNumber] = useState(rooms[0]?.name || 'MC OR 01');
  const [primaryProcedure, setPrimaryProcedure] = useState('');
  const [surgeon, setSurgeon] = useState('Lee, K');
  const [anesthesiaType, setAnesthesiaType] = useState<'General' | 'MAC' | 'Regional' | 'Spinal'>('General');
  const [preOpBay, setPreOpBay] = useState('Bay 06');
  const [casePriority, setCasePriority] = useState<'urgent' | 'emergent'>('urgent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !primaryProcedure) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const randomId = `pt-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const randomMrn = `${Math.floor(100000000 + Math.random() * 900000000)}`;

    const initials = patientName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();

    const newCase: EpicPatientCase = {
      id: randomId,
      epicCaseId: randomId.replace('pt-', ''),
      mrn: randomMrn,
      accountNumber: `1019814${Math.floor(1000 + Math.random() * 9000)}`,
      patientName,
      patientInitials: `${initials.slice(0, 3)}, ${initials[0] || 'X'}`,
      age: Number(age),
      gender,
      dob: '1975-01-01',
      heightCm: 172,
      weightKg: 75,
      inpatientBed: 'Urgent Add-On',
      isConfidential: false,
      roomNumber,
      caseOrder: 'Add-On',
      primaryProcedure,
      procedureCodes: ['99999'],
      casePriority,
      isAddOn: true,
      addOnTime: timeNow,
      addedBy: 'Charge Nurse',
      anesthesiaType,
      surgeon,
      anesthesiologist: 'Alaniz, P',
      currentPhase: 'preop',
      scheduledArrival: timeNow,
      scheduledStartTime: timeNow,
      scheduledEndTime: '16:00',
      preOpBay,
      preOpReady: false,
      surgeonSeen: false,
      hpComplete: 'pending',
      surgicalConsent: 'pending',
      anesthesiaConsent: 'pending',
      siteMarked: 'pending',
      anesthesiaReady: false,
      anesthesiaTechReady: false,
      blockStatus: 'not_needed',
      reportCalled: false,
      circPreopVisit: false,
      roomReady: false,
      bloodBankRequired: false,
      latexAllergy: false,
      infectionStatus: 'none',
      defibPacemaker: false,
      anesthesiaTransport: false,
      preOpBypass: false,
      erasPathway: false,
      scopeEgd: false,
      pacuTransportComplete: false,
      readyForAnesSignout: false,
      pacuToFloorHold: false,
      xrayOrdered: false,
      ptOrdered: false
    };

    onAddPatient(newCase);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'var(--alert-red)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 900
            }}>
              + ADD-ON
            </span>
            <h2 style={{ fontSize: 17, fontWeight: 900 }}>Book Urgent Add-On Surgical Case</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Patient Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Miller, Gregory"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Primary Surgical Procedure</label>
            <input
              type="text"
              required
              placeholder="e.g. INCISION & DRAINAGE PERIANAL ABSCESS"
              value={primaryProcedure}
              onChange={(e) => setPrimaryProcedure(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Target Operating Room</label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.name}>{r.name} ({r.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Pre-Op Bay Assignment</label>
              <input
                type="text"
                value={preOpBay}
                onChange={(e) => setPreOpBay(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Surgeon</label>
              <input
                type="text"
                value={surgeon}
                onChange={(e) => setSurgeon(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Anesthesia Type</label>
              <select
                value={anesthesiaType}
                onChange={(e) => setAnesthesiaType(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="General">General</option>
                <option value="MAC">MAC (Sedation)</option>
                <option value="Regional">Regional</option>
                <option value="Spinal">Spinal</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Case Priority</label>
              <select
                value={casePriority}
                onChange={(e) => setCasePriority(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="urgent">Urgent</option>
                <option value="emergent">Emergent (Stat)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 10,
              padding: '12px',
              borderRadius: 6,
              background: 'var(--alert-red)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Confirm Add-On Case</span>
          </button>
        </form>
      </div>
    </div>
  );
};
