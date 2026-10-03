'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EpicPatientCase, FlowState, OperatingRoom, PerioperativePhase, User } from '@/types/flow';
import { initialUsers, getInitialFlowState } from '@/lib/mockData';
import { HeaderNav } from '@/components/HeaderNav';
import { BottomRibbon } from '@/components/BottomRibbon';
import { RoomGridView } from '@/components/RoomGridView';
import { TimelineGanttView } from '@/components/TimelineGanttView';
import { PreOpHoldingView } from '@/components/PreOpHoldingView';
import { PacuRecoveryView } from '@/components/PacuRecoveryView';
import { ProcedureDetailModal } from '@/components/ProcedureDetailModal';
import { PinPadModal } from '@/components/PinPadModal';
import { AddOnModal } from '@/components/AddOnModal';
import { AuditDrawer } from '@/components/AuditDrawer';
import { TouchscreenKeyboard } from '@/components/TouchscreenKeyboard';

export default function PerfectFlowApp() {
  // Theme state: defaults to dark OR surgical suite mode
  const [theme, setTheme] = useState<'whiteboard' | 'dark'>('dark');

  // Application flow state
  const [flowState, setFlowState] = useState<FlowState>(getInitialFlowState());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active view
  const [currentView, setCurrentView] = useState<'grid' | 'timeline' | 'preop' | 'pacu'>('grid');

  // Active user (Default to Board Runner for immediate interactive demo)
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);

  // Privacy and search
  const [hipaaProtected, setHipaaProtected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<PerioperativePhase | 'add_on' | null>(null);

  // Selected patient for Procedure Detail Modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Modals state
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  // Fetch remote state on initial load
  useEffect(() => {
    const fetchState = async () => {
      try {
        setIsSyncing(true);
        const res = await fetch('/api/flow');
        if (res.ok) {
          const data = await res.json();
          if (data?.patients?.length > 0) {
            setFlowState(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load remote state, using local initial state:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchState();
  }, []);

  // Update HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle Theme
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'whiteboard' : 'dark'));
  };

  // Toggle HIPAA Privacy Mode
  const handleToggleHipaa = () => {
    setHipaaProtected(prev => !prev);
  };

  // Reset Mock Demo Data
  const handleResetData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        const data = await res.json();
        setFlowState(data.state);
      } else {
        setFlowState(getInitialFlowState());
      }
    } catch {
      setFlowState(getInitialFlowState());
    } finally {
      setIsSyncing(false);
    }
  };

  // Update Patient Case
  const handleUpdatePatient = async (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => {
    // Optimistic local update
    setFlowState(prev => {
      const pIdx = prev.patients.findIndex(p => p.id === patientId);
      if (pIdx === -1) return prev;

      const updatedPatients = [...prev.patients];
      const updatedItem = { ...updatedPatients[pIdx], ...updates };
      updatedPatients[pIdx] = updatedItem;

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: currentUser.displayName,
        action: note || 'PATIENT_UPDATED',
        patientId: updatedItem.id,
        patientName: updatedItem.patientName,
        details: note || `Updated case #${updatedItem.epicCaseId}`
      };

      return {
        ...prev,
        patients: updatedPatients,
        auditLogs: [newLog, ...prev.auditLogs.slice(0, 49)]
      };
    });

    // Background server sync
    try {
      await fetch('/api/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePatient',
          patientId,
          updates,
          actorName: currentUser.displayName,
          note
        })
      });
    } catch (err) {
      console.error('Failed to sync patient update:', err);
    }
  };

  // Add-On Case Created
  const handleAddPatient = async (newPatient: EpicPatientCase) => {
    setFlowState(prev => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: currentUser.displayName,
          action: 'ADD_ON_CREATED',
          patientId: newPatient.id,
          patientName: newPatient.patientName,
          details: `Urgent Add-On case #${newPatient.epicCaseId} booked for ${newPatient.roomNumber}`
        },
        ...prev.auditLogs
      ]
    }));

    // Trigger procedure modal for the newly added patient
    setSelectedPatientId(newPatient.id);
  };

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    let list = flowState.patients;

    // Filter by phase ribbon tab
    if (selectedPhaseFilter === 'add_on') {
      list = list.filter(p => p.isAddOn);
    } else if (selectedPhaseFilter !== null) {
      list = list.filter(p => p.currentPhase === selectedPhaseFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.patientName.toLowerCase().includes(q) ||
        p.patientInitials.toLowerCase().includes(q) ||
        p.surgeon.toLowerCase().includes(q) ||
        p.roomNumber.toLowerCase().includes(q) ||
        p.primaryProcedure.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.epicCaseId.toLowerCase().includes(q)
      );
    }

    return list;
  }, [flowState.patients, selectedPhaseFilter, searchQuery]);

  const activeModalPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return flowState.patients.find(p => p.id === selectedPatientId) || null;
  }, [flowState.patients, selectedPatientId]);

  // Virtual keyboard text typing into search
  const handleVirtualKeyPress = (char: string) => {
    setSearchQuery(prev => prev + char);
  };

  const handleVirtualBackspace = () => {
    setSearchQuery(prev => prev.slice(0, -1));
  };

  const handleVirtualEnter = () => {
    setIsKeyboardOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Application Header */}
      <HeaderNav
        currentView={currentView}
        onSelectView={setCurrentView}
        currentUser={currentUser}
        onOpenLogin={() => setIsPinModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        hipaaProtected={hipaaProtected}
        onToggleHipaa={handleToggleHipaa}
        isKeyboardOpen={isKeyboardOpen}
        onToggleKeyboard={() => setIsKeyboardOpen(prev => !prev)}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSyncing={isSyncing}
        onOpenAddOnModal={() => setIsAddOnModalOpen(true)}
      />

      {/* Main View Display */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {currentView === 'grid' && (
          <RoomGridView
            rooms={flowState.rooms}
            patients={filteredPatients}
            runners={flowState.runners}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineGanttView
            rooms={flowState.rooms}
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            hipaaProtected={hipaaProtected}
          />
        )}

        {currentView === 'preop' && (
          <PreOpHoldingView
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
          />
        )}

        {currentView === 'pacu' && (
          <PacuRecoveryView
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
          />
        )}
      </div>

      {/* Persistent Bottom Lifecycle Ribbon */}
      <BottomRibbon
        patients={flowState.patients}
        selectedPhaseFilter={selectedPhaseFilter}
        onSelectPhaseFilter={setSelectedPhaseFilter}
        onOpenAudit={() => setIsAuditOpen(true)}
        auditCount={flowState.auditLogs.length}
      />

      {/* Modals & Drawers */}
      <ProcedureDetailModal
        patient={activeModalPatient}
        onClose={() => setSelectedPatientId(null)}
        onUpdatePatient={handleUpdatePatient}
        currentUser={currentUser}
        hipaaProtected={hipaaProtected}
      />

      <PinPadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onLogin={setCurrentUser}
      />

      <AddOnModal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
        rooms={flowState.rooms}
        onAddPatient={handleAddPatient}
      />

      <AuditDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={flowState.auditLogs}
      />

      <TouchscreenKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onKeyPress={handleVirtualKeyPress}
        onBackspace={handleVirtualBackspace}
        onEnter={handleVirtualEnter}
      />
    </div>
  );
}
