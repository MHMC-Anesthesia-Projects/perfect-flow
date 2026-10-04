'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/types/flow';
import { 
  Sun, Moon, Shield, Lock, Clock, Search, 
  RotateCw, Eye, EyeOff, Keyboard, Maximize, 
  Minimize, LayoutGrid, Layers, CalendarRange, 
  Stethoscope, BedDouble, PlusCircle, Settings, ShieldCheck 
} from 'lucide-react';

interface HeaderNavProps {
  currentView: 'grid' | 'stacked' | 'timeline' | 'preop' | 'pacu';
  onSelectView: (view: 'grid' | 'stacked' | 'timeline' | 'preop' | 'pacu') => void;
  currentUser: User;
  onOpenLogin: () => void;
  theme: 'whiteboard' | 'dark';
  onToggleTheme: () => void;
  hipaaProtected: boolean;
  onToggleHipaa: () => void;
  isKeyboardOpen: boolean;
  onToggleKeyboard: () => void;
  onResetData: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSyncing: boolean;
  onOpenAddOnModal: () => void;
  onOpenAdmin: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onSelectView,
  currentUser,
  onOpenLogin,
  theme,
  onToggleTheme,
  hipaaProtected,
  onToggleHipaa,
  isKeyboardOpen,
  onToggleKeyboard,
  onResetData,
  searchQuery,
  onSearchChange,
  isSyncing,
  onOpenAddOnModal,
  onOpenAdmin
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const getRoleBadge = () => {
    if (currentUser.role === 'basic_viewer') {
      return (
        <button
          type="button"
          onClick={onOpenLogin}
          className="header-btn"
          style={{
            borderColor: 'var(--border-medium)',
            color: 'var(--text-secondary)'
          }}
          title="Tap to log in with 4-digit PIN for full clinical control"
        >
          <Lock size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Viewer (Tap PIN to Edit)</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onOpenLogin}
        className="header-btn"
        style={{
          background: 'rgba(2, 132, 199, 0.12)',
          borderColor: 'var(--accent-primary)',
          color: 'var(--accent-primary)',
          fontWeight: 700
        }}
        title="Tap to switch active role or log out"
      >
        <Shield size={14} />
        <span>{currentUser.displayName}</span>
      </button>
    );
  };

  return (
    <header className="flow-header">
      {/* Brand & Hospital Unit Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="brand-badge">
          <div className="brand-logo-icon">PF</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 className="brand-title">Perfect Flow</h1>
              <span style={{ 
                fontSize: 10, 
                padding: '1px 6px', 
                borderRadius: 4, 
                background: 'rgba(22, 163, 74, 0.15)', 
                color: 'var(--phase-surgery-bg)', 
                fontWeight: 800,
                border: '1px solid rgba(22, 163, 74, 0.3)'
              }}>
                OR COMMAND
              </span>
            </div>
            <div className="brand-sub">Perioperative Patient Flow & Tracker</div>
          </div>
        </div>

        {/* Live Date & Time Clock */}
        <div className="clock-display" title="Operational Theater Clock">
          <Clock size={15} style={{ color: 'var(--accent-primary)' }} />
          <span>{currentTime || '00:00:00'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
            {currentDate}
          </span>
        </div>
      </div>

      {/* Main View Switcher Navigation */}
      <nav className="view-tabs" aria-label="Main View Navigation">
        <button
          type="button"
          className={`view-tab-btn ${currentView === 'grid' ? 'active' : ''}`}
          onClick={() => onSelectView('grid')}
        >
          <LayoutGrid size={16} />
          <span>OR Grid</span>
        </button>

        <button
          type="button"
          className={`view-tab-btn ${currentView === 'stacked' ? 'active' : ''}`}
          onClick={() => onSelectView('stacked')}
        >
          <Layers size={16} />
          <span>OR Stacked</span>
        </button>

        <button
          type="button"
          className={`view-tab-btn ${currentView === 'timeline' ? 'active' : ''}`}
          onClick={() => onSelectView('timeline')}
        >
          <CalendarRange size={16} />
          <span>Gantt Timeline</span>
        </button>

        <button
          type="button"
          className={`view-tab-btn ${currentView === 'preop' ? 'active' : ''}`}
          onClick={() => onSelectView('preop')}
        >
          <Stethoscope size={16} />
          <span>Pre-Op Holding</span>
        </button>

        <button
          type="button"
          className={`view-tab-btn ${currentView === 'pacu' ? 'active' : ''}`}
          onClick={() => onSelectView('pacu')}
        >
          <BedDouble size={16} />
          <span>PACU & Phase II</span>
        </button>
      </nav>

      {/* Utilities & Role Controls */}
      <div className="header-actions">
        {/* Search bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search pt, surgeon, OR..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              height: 36,
              padding: '0 12px 0 30px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: 13,
              width: 170,
              outline: 'none',
              transition: 'width var(--transition-fast)'
            }}
            onFocus={(e) => (e.target.style.width = '230px')}
            onBlur={(e) => (e.target.style.width = '170px')}
          />
        </div>

        {/* Add-On Case Button */}
        <button
          type="button"
          onClick={onOpenAddOnModal}
          className="header-btn"
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            borderColor: 'var(--alert-red)',
            color: 'var(--alert-red)',
            fontWeight: 700
          }}
          title="Add an urgent / emergent surgical case"
        >
          <PlusCircle size={15} />
          <span>+ Add On</span>
        </button>

        {/* Role Badge / PIN login */}
        {getRoleBadge()}

        {/* Admin Settings Button */}
        <button
          type="button"
          onClick={onOpenAdmin}
          className="header-btn icon-btn"
          title="Admin Area: Manage Users, Epic EMR API, & Turnover Rules"
        >
          <Settings size={16} />
        </button>

        {/* HIPAA Toggle */}
        <button
          type="button"
          onClick={onToggleHipaa}
          className="header-btn icon-btn"
          title={hipaaProtected ? 'HIPAA Mode: Showing initials. Click for Full Names' : 'Full Names visible. Click for HIPAA Initials'}
        >
          {hipaaProtected ? <EyeOff size={16} style={{ color: 'var(--accent-primary)' }} /> : <Eye size={16} />}
        </button>

        {/* Virtual Keyboard Toggle for 65" TV */}
        <button
          type="button"
          onClick={onToggleKeyboard}
          className={`header-btn icon-btn ${isKeyboardOpen ? 'active' : ''}`}
          style={isKeyboardOpen ? { background: 'var(--accent-surface)', borderColor: 'var(--accent-primary)' } : {}}
          title="Toggle On-Screen Touch Keyboard"
        >
          <Keyboard size={16} />
        </button>

        {/* Theme Toggle (Dark OR vs Light Whiteboard) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="header-btn icon-btn"
          title={theme === 'dark' ? 'Switch to Whiteboard Light Mode' : 'Switch to Surgical Suite Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Fullscreen TV Kiosk Mode */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="header-btn icon-btn"
          title="Toggle Fullscreen 65in TV Display"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        {/* Reset / Reload Demo Data */}
        <button
          type="button"
          onClick={onResetData}
          className="header-btn icon-btn"
          title="Reload fresh mock data"
          disabled={isSyncing}
        >
          <RotateCw size={15} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
};
