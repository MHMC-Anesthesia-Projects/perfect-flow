'use client';

import React, { useState } from 'react';
import { User } from '@/types/journey';
import { X, Lock, Shield, Check, Delete, KeyRound, User as UserIcon, Eye, EyeOff } from 'lucide-react';

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser?: User;
  onLogin: (user: User) => void;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onLogin
}) => {
  if (!isOpen) return null;

  const [authMode, setAuthMode] = useState<'pin' | 'credentials'>('pin');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Password mode state
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const activeUsers = users.filter(u => u.active !== false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg('');

      // Auto-check 4-digit PIN against active users
      if (nextPin.length === 4) {
        const found = activeUsers.find(u => u.pin === nextPin);
        if (found) {
          onLogin(found);
          onClose();
          setEnteredPin('');
          return;
        } else {
          setErrorMsg('Invalid PIN code. Please try again.');
          setTimeout(() => setEnteredPin(''), 800);
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

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUser = activeUsers.find(
      u => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg('User account not found.');
      return;
    }

    if (targetUser.password && targetUser.password !== passwordInput) {
      setErrorMsg('Incorrect password.');
      return;
    }

    onLogin(targetUser);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460, padding: 24, textAlign: 'center' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase' }}>User Account & Roles</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Auth Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-subtle)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: 3,
          marginBottom: 16
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('pin'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: authMode === 'pin' ? 'var(--accent-primary)' : 'transparent',
              color: authMode === 'pin' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Lock size={13} />
            <span>4-Digit PIN Access</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('credentials'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 4,
              border: 'none',
              background: authMode === 'credentials' ? 'var(--accent-primary)' : 'transparent',
              color: authMode === 'credentials' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <UserIcon size={13} />
            <span>Username & Password</span>
          </button>
        </div>

        {/* Active user status indicator */}
        {currentUser && (
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 16,
            background: 'var(--surface-subtle)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)'
          }}>
            Currently Active: <strong>{currentUser.displayName}</strong> ({currentUser.role})
          </div>
        )}

        {/* 1. PIN PAD AUTHENTICATION MODE */}
        {authMode === 'pin' && (
          <>
            {/* PIN Display Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              margin: '10px 0 16px',
              height: 48,
              background: 'var(--surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)'
            }}>
              {[0, 1, 2, 3].map((idx) => {
                const filled = enteredPin.length > idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: filled ? 'var(--accent-primary)' : 'transparent',
                      border: `2px solid ${filled ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                      transition: 'all 0.15s ease'
                    }}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--alert-red)', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            {/* Numeric Keypad for 65" Touchscreens */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              maxWidth: 320,
              margin: '0 auto 16px'
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  style={{
                    height: 56,
                    fontSize: 22,
                    fontWeight: 800,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                style={{
                  height: 56,
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                style={{
                  height: 56,
                  fontSize: 22,
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                style={{
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Delete size={20} />
              </button>
            </div>

            {/* Quick Switch Clinical Role Avatars */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                Quick Touch Switch
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {activeUsers.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Shield size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {u.displayName.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {u.pin ? `PIN: ${u.pin}` : 'Open'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 2. USERNAME & PASSWORD AUTHENTICATION MODE */}
        {authMode === 'credentials' && (
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
            {errorMsg && (
              <div style={{ color: 'var(--alert-red)', fontSize: 12, fontWeight: 700 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: 6,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Sign In to Perfect Journey
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
