'use client';

import React from 'react';
import { X, Delete, CornerDownLeft } from 'lucide-react';

interface TouchscreenKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

export const TouchscreenKeyboard: React.FC<TouchscreenKeyboardProps> = ({
  isOpen,
  onClose,
  onKeyPress,
  onBackspace,
  onEnter
}) => {
  if (!isOpen) return null;

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.']
  ];

  return (
    <div className="virtual-keyboard-drawer">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        padding: '0 8px'
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Touchscreen On-Screen Keyboard
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 900, margin: '0 auto' }}>
        {rows.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {row.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onKeyPress(char)}
                style={{
                  height: 48,
                  minWidth: 42,
                  padding: '0 12px',
                  borderRadius: 6,
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {char}
              </button>
            ))}

            {rIdx === 0 && (
              <button
                type="button"
                onClick={onBackspace}
                style={{
                  height: 48,
                  padding: '0 16px',
                  borderRadius: 6,
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Delete size={18} />
              </button>
            )}
          </div>
        ))}

        {/* Spacebar Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => onKeyPress(' ')}
            style={{
              height: 48,
              width: 380,
              borderRadius: 6,
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            SPACEBAR
          </button>

          <button
            type="button"
            onClick={onEnter}
            style={{
              height: 48,
              padding: '0 24px',
              borderRadius: 6,
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>ENTER</span>
            <CornerDownLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
