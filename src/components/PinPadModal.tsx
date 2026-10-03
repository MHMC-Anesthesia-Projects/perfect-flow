'use client';

import React, { useState } from 'react';
import { User } from '@/types/flow';
import { initialUsers } from '@/lib/mockData';
import { X, Lock, Shield, Check, Delete } from 'lucide-react';

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  if (!isOpen) return null;

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg('');

      // Auto-check 4-digit PIN against initial users
      if (nextPin.length === 4) {
        const found = initialUsers.find(u => u.pin === nextPin);
        if (found) {
          onLogin(found);
          onClose();
          setEnteredPin('');
          return;
        }
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const handleQuickSelect = (user: User) => {
    onLogin(user);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, padding: 24, textAlign: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase' }}>Touchscreen PIN Login</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Enter your 4-digit PIN to authenticate as Board Runner or Anesthesiologist on this touchscreen.
        </div>

        {/* PIN Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          margin: '12px 0 20px'
        }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid var(--accent-primary)',
                background: enteredPin.length > idx ? 'var(--accent-primary)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--alert-red)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            {errorMsg}
          </div>
        )}

        {/* 10-Key Touchpad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          maxWidth: 280,
          margin: '0 auto 16px'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              style={{
                height: 52,
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: 22,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            style={{
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            CLEAR
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: 22,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer'
            }}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            style={{
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Demo Fast Role Selectors */}
        <div style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Quick Demo Role Switcher
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {initialUsers.slice(0, 4).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickSelect(user)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border-medium)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>{user.displayName}</div>
                <div style={{ fontSize: 10, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  PIN: {user.pin}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
