'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  EpicPatientCase, JourneyState, OperatingRoom, 
  PerioperativePhase, PerioperativeEnvironment, User, 
  EmrApiConfig, Department, StaffMember, RoomStaffTeam 
} from '@/types/journey';
import { initialUsers, initialEmrConfig, initialDepartments, initialStaffRoster, getInitialJourneyState } from '@/lib/mockData';
import { getBrowserSupabase, JOURNEY_TABLE, JOURNEY_SCHEMA } from '@/lib/supabase';
import { HeaderNav } from '@/components/HeaderNav';
import { BottomRibbon } from '@/components/BottomRibbon';
import { SchedulingClearanceView } from '@/components/SchedulingClearanceView';
import { RoomGridView } from '@/components/RoomGridView';
import { OrStackedView } from '@/components/OrStackedView';
import { TimelineGanttView } from '@/components/TimelineGanttView';
import { PreOpHoldingView } from '@/components/PreOpHoldingView';
import { PacuRecoveryView } from '@/components/PacuRecoveryView';
import { ProcedureDetailModal } from '@/components/ProcedureDetailModal';
import { PinPadModal } from '@/components/PinPadModal';
import { AddOnModal } from '@/components/AddOnModal';
import { AdminModal } from '@/components/AdminModal';
import { AuditDrawer } from '@/components/AuditDrawer';
import { TouchscreenKeyboard } from '@/components/TouchscreenKeyboard';

export default function PerfectJourneyApp() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/journey';
  
  // Always default to Whiteboard Light Mode per clinical requirement
  const [theme, setTheme] = useState<'whiteboard' | 'dark'>('whiteboard');
  const [journeyState, setJourneyState] = useState<JourneyState>(getInitialJourneyState());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // 5 discrete perioperative environments
  const [activeEnvironment, setActiveEnvironment] = useState<PerioperativeEnvironment>('or');
  
  // Department selection ('dept-all' shows all departments)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('dept-all');
  
  // Environment-specific sub-views
  const [schedulingSubView, setSchedulingSubView] = useState<'matrix' | 'roster' | 'urgent'>('matrix');
  const [preOpSubView, setPreOpSubView] = useState<'card' | 'table'>('card');
  const [orSubView, setOrSubView] = useState<'grid' | 'stacked' | 'timeline'>('grid');
  const [pacuSubView, setPacuSubView] = useState<'all' | 'pacu' | 'phase2'>('all');
  const [phase2SubView, setPhase2SubView] = useState<'recliners' | 'family' | 'discharge'>('recliners');

  // Authentication & Active User
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
        const res = await fetch(`${basePath}/api/journey`);
        if (res.ok) {
          const data = await res.json();
          if (data?.patients?.length > 0) {
            setJourneyState(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load remote state, using local initial state:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchState();
  }, [basePath]);

  // Supabase Realtime live sync across monitors and devices
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('journey-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: JOURNEY_SCHEMA,
          table: JOURNEY_TABLE
        },
        (payload: any) => {
          if (payload.new && payload.new.state_data) {
            setJourneyState(payload.new.state_data as JourneyState);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Connected to live journey updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enforce whiteboard light theme by default
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
      const res = await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        const data = await res.json();
        setJourneyState(data.state);
      } else {
        setJourneyState(getInitialJourneyState());
      }
    } catch {
      setJourneyState(getInitialJourneyState());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdatePatient = async (patientId: string, updates: Partial<EpicPatientCase>, note?: string) => {
    setJourneyState(prev => {
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
      await fetch(`${basePath}/api/journey`, {
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
    setJourneyState(prev => ({
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

    try {
      await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPatient',
          patient: newPatient,
          actorName: currentUser.displayName
        })
      });
    } catch (err) {
      console.error('Failed to sync added patient:', err);
    }
  };

  const handleSaveDepartments = async (updatedDepartments: Department[]) => {
    setJourneyState(prev => ({ ...prev, departments: updatedDepartments }));
    try {
      await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveDepartments',
          departments: updatedDepartments
        })
      });
    } catch (err) {
      console.error('Failed to sync departments:', err);
    }
  };

  const handleSaveStaffRoster = async (updatedRoster: StaffMember[]) => {
    setJourneyState(prev => ({ ...prev, staffRoster: updatedRoster }));
    try {
      await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveStaffRoster',
          staffRoster: updatedRoster
        })
      });
    } catch (err) {
      console.error('Failed to sync staff roster:', err);
    }
  };

  const handleUpdateRoomStaff = async (roomId: string, staff: RoomStaffTeam) => {
    setJourneyState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, assignedStaff: staff } : r)
    }));
    try {
      await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRoomStaff',
          roomId,
          staff
        })
      });
    } catch (err) {
      console.error('Failed to sync room staff assignment:', err);
    }
  };

  const handleSaveUsers = async (updatedUsers: User[]) => {
    setJourneyState(prev => ({ ...prev, users: updatedUsers }));
    try {
      await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveUsers',
          users: updatedUsers
        })
      });
    } catch (err) {
      console.error('Failed to sync users:', err);
    }
  };

  const handleSaveEmrConfig = async (updatedConfig: EmrApiConfig) => {
    setJourneyState(prev => ({ ...prev, emrConfig: updatedConfig }));
    try {
      await fetch(`${basePath}/api/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveEmrConfig',
          emrConfig: updatedConfig
        })
      });
    } catch (err) {
      console.error('Failed to sync EMR config:', err);
    }
  };

  // Simulate an incoming emergency Add-On case directly from Epic OpTime HL7 interface
  const handleSimulateEpicCase = async () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const mockEpicAddOn: EpicPatientCase = {
      id: `pt-epic-${Date.now()}`,
      epicCaseId: `${Math.floor(1000000 + Math.random() * 900000)}`,
      mrn: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      accountNumber: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      patientName: 'VALDEZ, CARLOS ENRIQUE',
      patientInitials: 'VAL, C',
      age: 48,
      gender: 'M',
      dob: '1978-06-12',
      heightCm: 178,
      weightKg: 84.5,
      inpatientBed: 'ED-TRAUMA-03',
      isConfidential: false,
      roomNumber: 'MC OR 06',
      caseOrder: 'A-1',
      primaryProcedure: 'Laparoscopic Appendectomy (Urgent Inpatient Add-On)',
      secondaryProcedure: 'Peritoneal Lavage',
      procedureCodes: ['44970', '49084'],
      casePriority: 'emergent',
      isAddOn: true,
      addOnTime: timeNow,
      addedBy: 'Epic OpTime Gateway (HL7 SIU-S12)',
      anesthesiaType: 'General',
      comments: 'Acute ruptured appendicitis transferred from ED Trauma Bay 3.',
      surgeon: 'Patel, Sanjay (MD)',
      anesthesiologist: 'Alaniz, P (MD)',
      circulatorRN: 'Marybeth Q. (RN)',
      scrubTech: 'Reyes, H. (CST)',
      currentPhase: 'preop',
      scheduledArrival: timeNow,
      schedInRoom: timeNow,
      schedCut: timeNow,
      schedOutRoom: '20:30',
      scheduledStartTime: timeNow,
      scheduledEndTime: '20:30',
      preOpBay: 'Holding Bay 03',
      preOpReady: true,
      preOpReadyTime: timeNow,
      surgeonSeen: true,
      surgeonSeenTime: timeNow,
      hpComplete: 'yes',
      surgicalConsent: 'signed',
      anesthesiaConsent: 'signed',
      siteMarked: 'yes',
      anesthesiaReady: true,
      anesthesiaReadyTime: timeNow,
      anesthesiaTechReady: true,
      blockStatus: 'not_needed',
      reportCalled: true,
      reportCalledTime: timeNow,
      uptResult: 'na',
      clipNeeded: 'no',
      circPreopVisit: true,
      roomReady: true,
      bloodBankRequired: true,
      pacuTransportComplete: false,
      readyForAnesSignout: false,
      pacuToFloorHold: false,
      xrayOrdered: false,
      ptOrdered: false,
      latexAllergy: false,
      infectionStatus: 'contact',
      defibPacemaker: false,
      anesthesiaTransport: true,
      preOpBypass: false,
      erasPathway: true,
      scopeEgd: false
    };

    try {
      const res = await fetch(`${basePath}/api/epic/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicCase: mockEpicAddOn })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setJourneyState(data.state);
        }
      }
    } catch (err) {
      console.error('Failed to simulate Epic incoming payload:', err);
    }
  };

  // Departments list from state or fallback
  const departmentsList = journeyState.departments?.length > 0 
    ? journeyState.departments 
    : initialDepartments;

  const staffRosterList = journeyState.staffRoster?.length > 0 
    ? journeyState.staffRoster 
    : initialStaffRoster;

  const activeDeptObj = departmentsList.find(d => d.id === selectedDepartmentId);

  // Filter rooms based on active department
  const filteredRooms = useMemo(() => {
    if (!selectedDepartmentId || selectedDepartmentId === 'dept-all' || !activeDeptObj) {
      return journeyState.rooms;
    }
    return journeyState.rooms.filter(r => 
      r.department.toLowerCase() === activeDeptObj.name.toLowerCase() ||
      r.department.toLowerCase() === activeDeptObj.code.toLowerCase()
    );
  }, [journeyState.rooms, selectedDepartmentId, activeDeptObj]);

  // Filter patients based on department, search, and bottom ribbon phase filter
  const filteredPatients = useMemo(() => {
    let list = journeyState.patients;

    // Filter by department if specific department chosen
    if (selectedDepartmentId && selectedDepartmentId !== 'dept-all' && activeDeptObj) {
      const deptRoomNames = new Set(filteredRooms.map(r => r.name.toLowerCase()));
      list = list.filter(p => {
        if (!p.roomNumber) return true;
        return deptRoomNames.has(p.roomNumber.toLowerCase()) || 
               p.roomNumber.toLowerCase().includes(activeDeptObj.code.toLowerCase());
      });
    }

    if (selectedPhaseFilter) {
      if (selectedPhaseFilter === 'add_on') {
        list = list.filter(p => p.isAddOn);
      } else {
        list = list.filter(p => p.currentPhase === selectedPhaseFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.patientName.toLowerCase().includes(q) ||
        p.surgeon.toLowerCase().includes(q) ||
        p.roomNumber.toLowerCase().includes(q) ||
        p.primaryProcedure.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.epicCaseId.toLowerCase().includes(q)
      );
    }

    return list;
  }, [journeyState.patients, selectedDepartmentId, activeDeptObj, filteredRooms, selectedPhaseFilter, searchQuery]);

  const activeModalPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return journeyState.patients.find(p => p.id === selectedPatientId) || null;
  }, [journeyState.patients, selectedPatientId]);

  const handleVirtualKeyPress = (char: string) => {
    setSearchQuery(prev => prev + char);
  };

  const handleVirtualBackspace = () => {
    setSearchQuery(prev => prev.slice(0, -1));
  };

  const handleVirtualEnter = () => {
    setIsKeyboardOpen(false);
  };

  const minTurnoverMinutes = journeyState.emrConfig?.minTurnoverBufferMinutes || 15;

  // 5 discrete environment live census counts
  const patientCounts = useMemo(() => {
    return {
      scheduling: journeyState.patients.filter(p => p.currentPhase === 'scheduled' || p.isAddOn).length,
      preop: journeyState.patients.filter(p => p.currentPhase === 'preop' || p.currentPhase === 'arrived').length,
      or: journeyState.patients.filter(p => p.currentPhase === 'in_surgery' || p.currentPhase === 'closing').length,
      pacu: journeyState.patients.filter(p => p.currentPhase === 'pacu').length,
      phase2: journeyState.patients.filter(p => p.currentPhase === 'phase2').length
    };
  }, [journeyState.patients]);

  const handleSelectPhaseFilter = (filter: PerioperativePhase | 'add_on' | null) => {
    setSelectedPhaseFilter(filter);
    if (filter === 'scheduled' || filter === 'add_on') {
      setActiveEnvironment('scheduling');
    } else if (filter === 'preop' || filter === 'arrived') {
      setActiveEnvironment('preop');
    } else if (filter === 'in_surgery' || filter === 'closing') {
      setActiveEnvironment('or');
    } else if (filter === 'pacu') {
      setActiveEnvironment('pacu');
    } else if (filter === 'phase2' || filter === 'completed') {
      setActiveEnvironment('phase2');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Three-Tier Header: App Bar + 5-Stage Journey Continuum + Sub-View Controls */}
      <HeaderNav
        activeEnvironment={activeEnvironment}
        onSelectEnvironment={setActiveEnvironment}
        patientCounts={patientCounts}
        departments={departmentsList}
        selectedDepartmentId={selectedDepartmentId}
        onSelectDepartment={setSelectedDepartmentId}
        currentUser={currentUser}
        onOpenLogin={() => setIsPinModalOpen(true)}
        schedulingSubView={schedulingSubView}
        onSelectSchedulingSubView={setSchedulingSubView}
        preOpSubView={preOpSubView}
        onSelectPreOpSubView={setPreOpSubView}
        orSubView={orSubView}
        onSelectOrSubView={setOrSubView}
        pacuSubView={pacuSubView}
        onSelectPacuSubView={setPacuSubView}
        phase2SubView={phase2SubView}
        onSelectPhase2SubView={setPhase2SubView}
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

      {/* Main Continuous Journey Viewport */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {/* 1. SCHEDULING & CLEARANCE ENVIRONMENT */}
        {activeEnvironment === 'scheduling' && (
          <SchedulingClearanceView
            patients={filteredPatients}
            rooms={filteredRooms}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
            selectedSubView={schedulingSubView}
            onSelectSubView={setSchedulingSubView}
          />
        )}

        {/* 2. PRE-OP / HOLDING ENVIRONMENT */}
        {activeEnvironment === 'preop' && (
          <PreOpHoldingView
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
            displayMode={preOpSubView}
            onDisplayModeChange={setPreOpSubView}
          />
        )}

        {/* 3. INTRA-OP SUITES ENVIRONMENT: SUITE GRID */}
        {activeEnvironment === 'or' && orSubView === 'grid' && (
          <RoomGridView
            rooms={filteredRooms}
            patients={filteredPatients}
            runners={journeyState.runners}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
            minTurnoverMinutes={minTurnoverMinutes}
            orSubView={orSubView}
            onSelectOrSubView={setOrSubView}
            staffRoster={staffRosterList}
            onUpdateRoomStaff={handleUpdateRoomStaff}
          />
        )}

        {/* 3. INTRA-OP SUITES ENVIRONMENT: CONSOLIDATED STACKED */}
        {activeEnvironment === 'or' && orSubView === 'stacked' && (
          <OrStackedView
            rooms={filteredRooms}
            patients={filteredPatients}
            runners={journeyState.runners}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
            minTurnoverMinutes={minTurnoverMinutes}
            orSubView={orSubView}
            onSelectOrSubView={setOrSubView}
            staffRoster={staffRosterList}
            onUpdateRoomStaff={handleUpdateRoomStaff}
          />
        )}

        {/* 3. INTRA-OP SUITES ENVIRONMENT: GANTT TIMELINE */}
        {activeEnvironment === 'or' && orSubView === 'timeline' && (
          <TimelineGanttView
            rooms={filteredRooms}
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            hipaaProtected={hipaaProtected}
            minTurnoverMinutes={minTurnoverMinutes}
            orSubView={orSubView}
            onSelectOrSubView={setOrSubView}
            staffRoster={staffRosterList}
            onUpdateRoomStaff={handleUpdateRoomStaff}
          />
        )}

        {/* 4. PACU PHASE I ENVIRONMENT */}
        {activeEnvironment === 'pacu' && (
          <PacuRecoveryView
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
            subView={pacuSubView}
            onSelectSubView={setPacuSubView}
          />
        )}

        {/* 5. PHASE II / DISCHARGE RECOVERY ENVIRONMENT */}
        {activeEnvironment === 'phase2' && (
          <PacuRecoveryView
            patients={filteredPatients}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onUpdatePatient={handleUpdatePatient}
            hipaaProtected={hipaaProtected}
            subView={pacuSubView === 'pacu' ? 'phase2' : pacuSubView}
            onSelectSubView={setPacuSubView}
          />
        )}
      </div>

      {/* Persistent Bottom Lifecycle Ribbon */}
      <BottomRibbon
        patients={journeyState.patients}
        selectedPhaseFilter={selectedPhaseFilter}
        onSelectPhaseFilter={handleSelectPhaseFilter}
        onOpenAudit={() => setIsAuditOpen(true)}
        auditCount={journeyState.auditLogs.length}
      />

      {/* Case Details Modal */}
      <ProcedureDetailModal
        patient={activeModalPatient}
        onClose={() => setSelectedPatientId(null)}
        onUpdatePatient={handleUpdatePatient}
        currentUser={currentUser}
        hipaaProtected={hipaaProtected}
        allPatients={journeyState.patients}
        minTurnoverMinutes={minTurnoverMinutes}
      />

      {/* PIN & Password Dual Authentication Account Switcher Modal */}
      <PinPadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        users={journeyState.users?.length > 0 ? journeyState.users : initialUsers}
        currentUser={currentUser}
        onLogin={setCurrentUser}
      />

      {/* Urgent Add-On Booking Modal */}
      <AddOnModal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
        rooms={journeyState.rooms}
        allPatients={journeyState.patients}
        onAddPatient={handleAddPatient}
        minTurnoverMinutes={minTurnoverMinutes}
      />

      {/* Admin Settings Modal: Departments, User Accounts & Roles, Site Staff Roster, EMR Gateway, Turnover */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        departments={departmentsList}
        onSaveDepartments={handleSaveDepartments}
        users={journeyState.users?.length > 0 ? journeyState.users : initialUsers}
        onSaveUsers={handleSaveUsers}
        staffRoster={staffRosterList}
        onSaveStaffRoster={handleSaveStaffRoster}
        emrConfig={journeyState.emrConfig || initialEmrConfig}
        onSaveEmrConfig={handleSaveEmrConfig}
        onSimulateEpicCase={handleSimulateEpicCase}
      />

      {/* Real-time Audit Trail Drawer */}
      <AuditDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={journeyState.auditLogs}
      />

      {/* Touchscreen Virtual Keyboard for 65" OR TV Kiosks */}
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
