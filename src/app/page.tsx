'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EpicPatientCase, FlowState, OperatingRoom, PerioperativePhase, User, EmrApiConfig } from '@/types/flow';
import { initialUsers, initialEmrConfig, getInitialFlowState } from '@/lib/mockData';
import { HeaderNav } from '@/components/HeaderNav';
import { BottomRibbon } from '@/components/BottomRibbon';
import { RoomGridView } from '@/components/RoomGridView';
import { TimelineGanttView } from '@/components/TimelineGanttView';
import { PreOpHoldingView } from '@/components/PreOpHoldingView';
import { PacuRecoveryView } from '@/components/PacuRecoveryView';
import { ProcedureDetailModal } from '@/components/ProcedureDetailModal';
import { PinPadModal } from '@/components/PinPadModal';
import { AddOnModal } from '@/components/AddOnModal';
import { AdminModal } from '@/components/AdminModal';
import { AuditDrawer } from '@/components/AuditDrawer';
import { TouchscreenKeyboard } from '@/components/TouchscreenKeyboard';

export default function PerfectFlowApp() {
  const [theme, setTheme] = useState<'whiteboard' | 'dark'>('dark');
  const [flowState, setFlowState] = useState<FlowState>(getInitialFlowState());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<'grid' | 'timeline' | 'preop' | 'pacu'>('grid');
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);

  const [hipaaProtected, setHipaaProtected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<PerioperativePhase | 'add_on' | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Modals state
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'whiteboard' : 'dark'));
  };

  const handleToggleHipaa = () => {
    setHipaaProtected(prev => !prev);
  };

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

  const handleUpdatePatient = async (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => {
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

    setSelectedPatientId(newPatient.id);
  };

  const handleSaveUsers = (updatedUsers: User[]) => {
    setFlowState(prev => ({ ...prev, users: updatedUsers }));
  };

  const handleSaveEmrConfig = (updatedConfig: EmrApiConfig) => {
    setFlowState(prev => ({ ...prev, emrConfig: updatedConfig }));
  };

  // Simulate an incoming emergency Add-On case directly from Epic OpTime HL7 interface
  const handleSimulateEpicCase = async () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const epicCaseId = `${Math.floor(1016800 + Math.random() * 2000)}`;

    const epicSimulatedCase: EpicPatientCase = {
      id: `pt-${epicCaseId}`,
      epicCaseId,
      mrn: `${Math.floor(151162000 + Math.random() * 9000)}`,
      accountNumber: `1019814${Math.floor(5000 + Math.random() * 4000)}`,
      patientName: 'Ramirez, Mateo',
      patientInitials: 'RAM, M',
      age: 38,
      gender: 'M',
      dob: '1988-04-12',
      heightCm: 176,
      weightKg: 81,
      inpatientBed: 'Emergency Dept (Trauma Bay 2)',
      isConfidential: false,
      roomNumber: 'MC OR 04',
      caseOrder: 'Add-On',
      primaryProcedure: 'INCISION AND DRAINAGE OF RIGHT THIGH ABSCESS WITH FASCIOTOMY',
      procedureCodes: ['27301', '27305'],
      casePriority: 'emergent',
      isAddOn: true,
      addOnTime: timeNow,
      addedBy: 'Epic OpTime HL7 Interface (Dr. Lee, K)',
      anesthesiaType: 'General',
      comments: 'EMERGENT ADD-ON FROM ED - EPIC OPTIME HL7 EVENT',
      surgeon: 'Lee, K',
      anesthesiologist: 'Alaniz, P',
      currentPhase: 'preop',
      scheduledArrival: timeNow,
      schedInRoom: '13:00',
      schedCut: '13:30',
      schedOutRoom: '15:00',
      scheduledStartTime: '13:00',
      scheduledEndTime: '15:00',
      preOpBay: 'Holding Bay 06',
      preOpReady: false,
      surgeonSeen: true,
      surgeonSeenTime: timeNow,
      hpComplete: 'yes',
      surgicalConsent: 'signed',
      anesthesiaConsent: 'pending',
      siteMarked: 'yes',
      anesthesiaReady: false,
      anesthesiaTechReady: true,
      blockStatus: 'not_needed',
      reportCalled: false,
      circPreopVisit: false,
      roomReady: true,
      bloodBankRequired: true,
      latexAllergy: false,
      infectionStatus: 'contact',
      defibPacemaker: false,
      anesthesiaTransport: true,
      preOpBypass: false,
      erasPathway: false,
      scopeEgd: false,
      pacuTransportComplete: false,
      readyForAnesSignout: false,
      pacuToFloorHold: false,
      xrayOrdered: false,
      ptOrdered: false
    };

    try {
      await fetch('/api/epic/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicCase: epicSimulatedCase })
      });
    } catch {
      // offline fallback
    }

    setFlowState(prev => ({
      ...prev,
      patients: [epicSimulatedCase, ...prev.patients],
      auditLogs: [
        {
          id: `epic-log-${Date.now()}`,
          timestamp: timeNow,
          user: 'Epic OpTime Gateway',
          action: 'EPIC_CASE_INGEST',
          patientId: epicSimulatedCase.id,
          patientName: epicSimulatedCase.patientName,
          details: `Simulated Epic OpTime HL7 Add-On Case #${epicSimulatedCase.epicCaseId} placed in MC OR 04`
        },
        ...prev.auditLogs
      ]
    }));

    setSelectedPatientId(epicSimulatedCase.id);
  };

  const filteredPatients = useMemo(() => {
    let list = flowState.patients;

    if (selectedPhaseFilter === 'add_on') {
      list = list.filter(p => p.isAddOn);
    } else if (selectedPhaseFilter !== null) {
      list = list.filter(p => p.currentPhase === selectedPhaseFilter);
    }

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

  const handleVirtualKeyPress = (char: string) => {
    setSearchQuery(prev => prev + char);
  };

  const handleVirtualBackspace = () => {
    setSearchQuery(prev => prev.slice(0, -1));
  };

  const handleVirtualEnter = () => {
    setIsKeyboardOpen(false);
  };

  const minTurnoverMinutes = flowState.emrConfig?.minTurnoverBufferMinutes || 15;

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
        onOpenAdmin={() => setIsAdminOpen(true)}
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
            minTurnoverMinutes={minTurnoverMinutes}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineGanttView
            rooms={flowState.rooms}
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            hipaaProtected={hipaaProtected}
            minTurnoverMinutes={minTurnoverMinutes}
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
        allPatients={flowState.patients}
        minTurnoverMinutes={minTurnoverMinutes}
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
        allPatients={flowState.patients}
        onAddPatient={handleAddPatient}
        minTurnoverMinutes={minTurnoverMinutes}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        users={flowState.users || initialUsers}
        onSaveUsers={handleSaveUsers}
        emrConfig={flowState.emrConfig || initialEmrConfig}
        onSaveEmrConfig={handleSaveEmrConfig}
        onSimulateEpicCase={handleSimulateEpicCase}
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
