'use client';

import React, { useState, useEffect } from 'react';
import { User, Department, PerioperativeEnvironment } from '@/types/journey';
import { 
  Sun, Moon, Shield, Lock, Clock, Search, 
  RotateCw, Eye, EyeOff, Keyboard, Maximize, 
  Minimize, LayoutGrid, Layers, CalendarRange, 
  Stethoscope, BedDouble, PlusCircle, Settings, ShieldCheck,
  ChevronRight, Calendar, UserCheck, KeyRound, Building2,
  FileText, Activity, AlertTriangle, Users, LogIn
} from 'lucide-react';

export interface HeaderNavProps {
  // Journey Environment (Tier 2)
  activeEnvironment: PerioperativeEnvironment;
  onSelectEnvironment: (env: PerioperativeEnvironment) => void;
  patientCounts: {
    scheduling: number;
    preop: number;
    or: number;
    pacu: number;
    phase2: number;
  };

  // Department Switcher (Tier 1)
  departments: Department[];
  selectedDepartmentId: string;
  onSelectDepartment: (deptId: string) => void;

  // Active User & Authentication (Tier 1 Login Button Top Right)
  currentUser: User;
  onOpenLogin: () => void;

  // Sub-view selectors for each environment (Tier 3)
  schedulingSubView: 'matrix' | 'roster' | 'urgent';
  onSelectSchedulingSubView: (view: 'matrix' | 'roster' | 'urgent') => void;

  preOpSubView: 'card' | 'table';
  onSelectPreOpSubView: (view: 'card' | 'table') => void;

  orSubView: 'grid' | 'stacked' | 'timeline';
  onSelectOrSubView: (view: 'grid' | 'stacked' | 'timeline') => void;

  pacuSubView: 'all' | 'pacu' | 'phase2';
  onSelectPacuSubView: (view: 'all' | 'pacu' | 'phase2') => void;

  phase2SubView?: 'recliners' | 'family' | 'discharge';
  onSelectPhase2SubView?: (view: 'recliners' | 'family' | 'discharge') => void;

  // Utilities
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
  activeEnvironment,
  onSelectEnvironment,
  patientCounts,
  departments,
  selectedDepartmentId,
  onSelectDepartment,
  currentUser,
  onOpenLogin,
  schedulingSubView,
  onSelectSchedulingSubView,
  preOpSubView,
  onSelectPreOpSubView,
  orSubView,
  onSelectOrSubView,
  pacuSubView,
  onSelectPacuSubView,
  phase2SubView = 'recliners',
  onSelectPhase2SubView,
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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'superuser':
        return { bg: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.4)', text: '#dc2626', label: 'Superuser' };
      case 'board_runner':
        return { bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.4)', text: '#0284c7', label: 'Board Runner' };
      case 'anesthesia':
        return { bg: 'rgba(147, 51, 234, 0.12)', border: 'rgba(147, 51, 234, 0.4)', text: '#9333ea', label: 'Anesthesia MD' };
      case 'charge_rn':
        return { bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.4)', text: '#d97706', label: 'Charge RN' };
      case 'circulator':
        return { bg: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.4)', text: '#0d9488', label: 'Circulator RN' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)', text: '#64748b', label: 'Basic Viewer' };
    }
  };

  const activeRoleInfo = getRoleBadgeStyle(currentUser.role);
  const activeDepartments = departments.filter(d => d.active !== false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-header)',
      borderBottom: '1px solid var(--border-medium)',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      {/* =========================================================================
          TIER 1: TOP APPLICATION BAR (Brand, Department Switcher, Search, Login)
          ========================================================================= */}
      <div style={{
        height: 56,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottom: '1px solid var(--border-light)'
      }}>
        {/* Left: Brand & Department Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Logo & Facility Title */}
          <div className="brand-badge" style={{ gap: 8 }}>
            <div className="brand-logo-icon" style={{ width: 32, height: 32, fontSize: 14, borderRadius: 6 }}>PJ</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Perfect Journey
                </span>
                <span style={{ 
                  fontSize: 9, 
                  padding: '1px 5px', 
                  borderRadius: 4, 
                  background: 'rgba(22, 163, 74, 0.12)', 
                  color: 'var(--phase-surgery-bg)', 
                  fontWeight: 800,
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  letterSpacing: '0.5px'
                }}>
                  PERIOP COMMAND
                </span>
              </div>
            </div>
          </div>

          {/* Department Switcher Dropdown / Pills */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--surface-subtle)', 
            padding: '3px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-light)',
            gap: 2
          }}>
            <Building2 size={13} style={{ color: 'var(--text-muted)', marginLeft: 6, marginRight: 2 }} />
            {activeDepartments.map(dept => {
              const isSelected = selectedDepartmentId === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => onSelectDepartment(dept.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--accent-border)' : '1px solid transparent',
                    background: isSelected ? 'var(--accent-primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap'
                  }}
                  title={dept.description || dept.name}
                >
                  {dept.name}
                </button>
              );
            })}
          </div>

          {/* Live Operational Clock */}
          <div className="clock-display" style={{ padding: '4px 10px', height: 32, gap: 6 }}>
            <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13 }}>{currentTime || '00:00:00'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}>
              {currentDate}
            </span>
          </div>
        </div>

        {/* Right: Search, Add-On, Login Button, Admin, Theme Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick Case Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search pt, surgeon, OR..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                height: 34,
                padding: '0 10px 0 28px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 12,
                width: 160,
                outline: 'none',
                transition: 'width var(--transition-fast)'
              }}
              onFocus={(e) => (e.target.style.width = '210px')}
              onBlur={(e) => (e.target.style.width = '160px')}
            />
          </div>

          {/* + Add-On Case Button */}
          <button
            type="button"
            onClick={onOpenAddOnModal}
            className="header-btn"
            style={{
              height: 34,
              padding: '0 10px',
              background: 'rgba(220, 38, 38, 0.1)',
              borderColor: 'var(--alert-red)',
              color: 'var(--alert-red)',
              fontWeight: 800,
              fontSize: 12
            }}
            title="Book an urgent or emergent surgical add-on case"
          >
            <PlusCircle size={14} />
            <span>+ Add-On</span>
          </button>

          {/* =========================================================================
              LOGIN BUTTON TOP RIGHT WITH PIN & USER SWITCH ACCESS
              ========================================================================= */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="header-btn"
            style={{
              height: 34,
              padding: '0 12px',
              background: activeRoleInfo.bg,
              borderColor: activeRoleInfo.border,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Switch User Account or Enter 4-Digit PIN Access"
          >
            {currentUser.role === 'basic_viewer' ? (
              <Lock size={14} style={{ color: activeRoleInfo.text }} />
            ) : (
              <ShieldCheck size={14} style={{ color: activeRoleInfo.text }} />
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.displayName}
                </span>
                <KeyRound size={11} style={{ color: 'var(--text-muted)' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: activeRoleInfo.text }}>
                {activeRoleInfo.label} • Switch / PIN
              </span>
            </div>
          </button>

          {/* Admin Settings Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="header-btn icon-btn"
            style={{ width: 34, height: 34 }}
            title="Admin Settings: Departments, User Accounts & Roles, Site Staff Roster, EMR Gateway, Turnover Rules"
          >
            <Settings size={15} />
          </button>

          {/* HIPAA Privacy Toggle */}
          <button
            type="button"
            onClick={onToggleHipaa}
            className="header-btn icon-btn"
            style={{ width: 34, height: 34 }}
            title={hipaaProtected ? 'HIPAA Mode: Showing initials. Click for full patient names' : 'Full names visible. Click for HIPAA initials'}
          >
            {hipaaProtected ? <EyeOff size={15} style={{ color: 'var(--accent-primary)' }} /> : <Eye size={15} />}
          </button>

          {/* On-Screen Virtual Keyboard Toggle for 65" TV */}
          <button
            type="button"
            onClick={onToggleKeyboard}
            className={`header-btn icon-btn ${isKeyboardOpen ? 'active' : ''}`}
            style={{ 
              width: 34, 
              height: 34,
              ...(isKeyboardOpen ? { background: 'var(--accent-surface)', borderColor: 'var(--accent-primary)' } : {})
            }}
            title="Toggle On-Screen Touch Keyboard for Kiosks"
          >
            <Keyboard size={15} />
          </button>

          {/* Theme Toggle (Default is Whiteboard Light Mode) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="header-btn icon-btn"
            style={{ width: 34, height: 34 }}
            title={theme === 'dark' ? 'Switch to Whiteboard Light Mode (Default)' : 'Switch to Surgical Suite Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Fullscreen TV Kiosk Mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="header-btn icon-btn"
            style={{ width: 34, height: 34 }}
            title="Toggle Fullscreen Clinical Board Mode"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          {/* Reset / Reload Demo Data */}
          <button
            type="button"
            onClick={onResetData}
            className="header-btn icon-btn"
            style={{ width: 34, height: 34 }}
            title="Reload fresh sample data"
            disabled={isSyncing}
          >
            <RotateCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: THE 5-STAGE PERIOPERATIVE JOURNEY CONTINUUM BAR
          ========================================================================= */}
      <div style={{
        height: 48,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-board)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {/* Continuous Flow Pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          {/* Stage 1: Scheduling & Clearance */}
          <button
            type="button"
            onClick={() => onSelectEnvironment('scheduling')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: activeEnvironment === 'scheduling' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
              background: activeEnvironment === 'scheduling' ? 'var(--accent-surface)' : 'var(--surface-subtle)',
              color: activeEnvironment === 'scheduling' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeEnvironment === 'scheduling' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Calendar size={15} />
            <span>1. Scheduling & Clearance</span>
            <span style={{
              background: activeEnvironment === 'scheduling' ? 'var(--accent-primary)' : 'var(--border-medium)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              padding: '1px 6px',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)'
            }}>
              {patientCounts.scheduling}
            </span>
          </button>

          <ChevronRight size={14} style={{ color: 'var(--border-strong)', opacity: 0.6 }} />

          {/* Stage 2: Pre-Op / Holding */}
          <button
            type="button"
            onClick={() => onSelectEnvironment('preop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: activeEnvironment === 'preop' ? '1px solid var(--phase-preop-bg)' : '1px solid var(--border-light)',
              background: activeEnvironment === 'preop' ? 'var(--phase-preop-light)' : 'var(--surface-subtle)',
              color: activeEnvironment === 'preop' ? 'var(--phase-preop-bg)' : 'var(--text-secondary)',
              fontWeight: activeEnvironment === 'preop' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Stethoscope size={15} />
            <span>2. Pre-Op / Holding</span>
            <span style={{
              background: activeEnvironment === 'preop' ? 'var(--phase-preop-bg)' : 'var(--border-medium)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              padding: '1px 6px',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)'
            }}>
              {patientCounts.preop}
            </span>
          </button>

          <ChevronRight size={14} style={{ color: 'var(--border-strong)', opacity: 0.6 }} />

          {/* Stage 3: Intra-Op Suites */}
          <button
            type="button"
            onClick={() => onSelectEnvironment('or')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: activeEnvironment === 'or' ? '1px solid var(--phase-surgery-bg)' : '1px solid var(--border-light)',
              background: activeEnvironment === 'or' ? 'var(--phase-surgery-light)' : 'var(--surface-subtle)',
              color: activeEnvironment === 'or' ? 'var(--phase-surgery-bg)' : 'var(--text-secondary)',
              fontWeight: activeEnvironment === 'or' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LayoutGrid size={15} />
            <span>3. Intra-Op Suites</span>
            <span style={{
              background: activeEnvironment === 'or' ? 'var(--phase-surgery-bg)' : 'var(--border-medium)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              padding: '1px 6px',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)'
            }}>
              {patientCounts.or}
            </span>
          </button>

          <ChevronRight size={14} style={{ color: 'var(--border-strong)', opacity: 0.6 }} />

          {/* Stage 4: PACU Phase I */}
          <button
            type="button"
            onClick={() => onSelectEnvironment('pacu')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: activeEnvironment === 'pacu' ? '1px solid var(--phase-pacu-bg)' : '1px solid var(--border-light)',
              background: activeEnvironment === 'pacu' ? 'var(--phase-pacu-light)' : 'var(--surface-subtle)',
              color: activeEnvironment === 'pacu' ? 'var(--phase-pacu-bg)' : 'var(--text-secondary)',
              fontWeight: activeEnvironment === 'pacu' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <BedDouble size={15} />
            <span>4. PACU Phase I</span>
            <span style={{
              background: activeEnvironment === 'pacu' ? 'var(--phase-pacu-bg)' : 'var(--border-medium)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              padding: '1px 6px',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)'
            }}>
              {patientCounts.pacu}
            </span>
          </button>

          <ChevronRight size={14} style={{ color: 'var(--border-strong)', opacity: 0.6 }} />

          {/* Stage 5: Phase II / Discharge */}
          <button
            type="button"
            onClick={() => onSelectEnvironment('phase2')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: activeEnvironment === 'phase2' ? '1px solid var(--phase-phase2-bg)' : '1px solid var(--border-light)',
              background: activeEnvironment === 'phase2' ? 'var(--phase-phase2-light)' : 'var(--surface-subtle)',
              color: activeEnvironment === 'phase2' ? 'var(--phase-phase2-bg)' : 'var(--text-secondary)',
              fontWeight: activeEnvironment === 'phase2' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Activity size={15} />
            <span>5. Phase II / Discharge</span>
            <span style={{
              background: activeEnvironment === 'phase2' ? 'var(--phase-phase2-bg)' : 'var(--border-medium)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              padding: '1px 6px',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)'
            }}>
              {patientCounts.phase2}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIER 3: CONTEXTUAL SUB-BAR (Environment-Specific View Modes)
          ========================================================================= */}
      <div style={{
        height: 38,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-subtle)',
        borderBottom: '1px solid var(--border-light)',
        fontSize: 12
      }}>
        {/* Left: Environment description & active stage tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.4px' }}>
            {activeEnvironment === 'scheduling' && '📋 Stage 1 • Preadmission Clearance & Scheduling'}
            {activeEnvironment === 'preop' && '🛏️ Stage 2 • Pre-Op Preparation & Holding Verification'}
            {activeEnvironment === 'or' && '🏥 Stage 3 • Surgical Suite Progression & Staff Tracking'}
            {activeEnvironment === 'pacu' && '🩺 Stage 4 • Post-Anesthesia Recovery & Sign-Outs'}
            {activeEnvironment === 'phase2' && '🚶 Stage 5 • Ambulatory Step-Down & Patient Discharge'}
          </span>
        </div>

        {/* Right: Layout Switchers Contextual to Active Environment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Sub-views for 1. SCHEDULING */}
          {activeEnvironment === 'scheduling' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => onSelectSchedulingSubView('matrix')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: schedulingSubView === 'matrix' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: schedulingSubView === 'matrix' ? 'var(--surface-card)' : 'transparent',
                  color: schedulingSubView === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: schedulingSubView === 'matrix' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Clearance & PAT Matrix
              </button>
              <button
                type="button"
                onClick={() => onSelectSchedulingSubView('roster')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: schedulingSubView === 'roster' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: schedulingSubView === 'roster' ? 'var(--surface-card)' : 'transparent',
                  color: schedulingSubView === 'roster' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: schedulingSubView === 'roster' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Master Schedule Roster
              </button>
              <button
                type="button"
                onClick={() => onSelectSchedulingSubView('urgent')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: schedulingSubView === 'urgent' ? '1px solid var(--alert-red)' : '1px solid var(--border-light)',
                  background: schedulingSubView === 'urgent' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                  color: schedulingSubView === 'urgent' ? 'var(--alert-red)' : 'var(--text-secondary)',
                  fontWeight: schedulingSubView === 'urgent' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                🚨 Urgent Add-On Queue
              </button>
            </div>
          )}

          {/* Sub-views for 2. PRE-OP */}
          {activeEnvironment === 'preop' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => onSelectPreOpSubView('card')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: preOpSubView === 'card' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: preOpSubView === 'card' ? 'var(--surface-card)' : 'transparent',
                  color: preOpSubView === 'card' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: preOpSubView === 'card' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Pre-Op Bay Grid
              </button>
              <button
                type="button"
                onClick={() => onSelectPreOpSubView('table')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: preOpSubView === 'table' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: preOpSubView === 'table' ? 'var(--surface-card)' : 'transparent',
                  color: preOpSubView === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: preOpSubView === 'table' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Prep Worklist Table
              </button>
            </div>
          )}

          {/* Sub-views for 3. OR SUITES */}
          {activeEnvironment === 'or' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => onSelectOrSubView('grid')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: orSubView === 'grid' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: orSubView === 'grid' ? 'var(--surface-card)' : 'transparent',
                  color: orSubView === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: orSubView === 'grid' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <LayoutGrid size={12} />
                <span>OR Suite Grid</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectOrSubView('stacked')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: orSubView === 'stacked' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: orSubView === 'stacked' ? 'var(--surface-card)' : 'transparent',
                  color: orSubView === 'stacked' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: orSubView === 'stacked' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Layers size={12} />
                <span>Stacked Rooms</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectOrSubView('timeline')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: orSubView === 'timeline' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: orSubView === 'timeline' ? 'var(--surface-card)' : 'transparent',
                  color: orSubView === 'timeline' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: orSubView === 'timeline' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <CalendarRange size={12} />
                <span>Timeline Gantt</span>
              </button>
            </div>
          )}

          {/* Sub-views for 4. PACU PHASE I */}
          {activeEnvironment === 'pacu' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => onSelectPacuSubView('pacu')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: pacuSubView === 'pacu' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: pacuSubView === 'pacu' ? 'var(--surface-card)' : 'transparent',
                  color: pacuSubView === 'pacu' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: pacuSubView === 'pacu' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                PACU Phase I Only
              </button>
              <button
                type="button"
                onClick={() => onSelectPacuSubView('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: pacuSubView === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: pacuSubView === 'all' ? 'var(--surface-card)' : 'transparent',
                  color: pacuSubView === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: pacuSubView === 'all' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                All Recovery
              </button>
            </div>
          )}

          {/* Sub-views for 5. PHASE II / DISCHARGE */}
          {activeEnvironment === 'phase2' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => onSelectPacuSubView('phase2')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: pacuSubView === 'phase2' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: pacuSubView === 'phase2' ? 'var(--surface-card)' : 'transparent',
                  color: pacuSubView === 'phase2' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: pacuSubView === 'phase2' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Phase II Ambulatory Step-Down
              </button>
              <button
                type="button"
                onClick={() => onSelectPacuSubView('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: pacuSubView === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: pacuSubView === 'all' ? 'var(--surface-card)' : 'transparent',
                  color: pacuSubView === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: pacuSubView === 'all' ? 800 : 500,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Combined Recovery View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
