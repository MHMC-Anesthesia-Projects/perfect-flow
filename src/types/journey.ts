export type PerioperativePhase = 
  | 'scheduled'
  | 'arrived'
  | 'preop'
  | 'in_surgery'
  | 'closing'
  | 'pacu'
  | 'phase2'
  | 'completed';

export type PerioperativeEnvironment = 
  | 'scheduling'
  | 'preop'
  | 'or'
  | 'pacu'
  | 'phase2';

export type UserRole = 
  | 'superuser' 
  | 'board_runner' 
  | 'anesthesia' 
  | 'charge_rn' 
  | 'circulator' 
  | 'basic_viewer';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  pin: string; // 4-digit PIN for touchscreen fast login
  password?: string; // Optional password for username/password login
  active: boolean;
}

export interface Department {
  id: string;
  name: string; // e.g. "Main OR", "Day Surgery", "Ortho OR", "Endo", "CV Heart & Vascular"
  code: string; // e.g. "MAIN_OR", "DAY_SURG", "ORTHO", "ENDO", "CV"
  description?: string;
  active: boolean;
  displayOrder: number;
}

export type StaffRole = 
  | 'Anesthesiologist' 
  | 'CRNA' 
  | 'Circulator RN' 
  | 'Scrub Tech' 
  | 'Anes Tech' 
  | 'Pre-Op RN' 
  | 'PACU RN' 
  | 'Phase II RN' 
  | 'Board Runner' 
  | 'Other';

export interface StaffMember {
  id: string;
  staffName: string; // e.g. "Dr. Peter Alaniz"
  displayName: string; // e.g. "Alaniz, P (MD)"
  role: StaffRole;
  environmentHome: string; // e.g. 'Main OR', 'Day Surgery', 'Pre-Op', 'PACU', 'Phase II'
  cell: string; // e.g. "x5501 / (713) 555-0192"
  active: boolean;
}

export interface FamilyContact {
  primaryName: string;
  primaryPhone: string;
  primaryNotes?: string;
  secondaryName?: string;
  secondaryPhone?: string;
  secondaryNotes?: string;
  prefersPhoneCall: boolean;
}

export interface EmrApiConfig {
  provider: 'epic_optime' | 'cerner_surginet' | 'meditech' | 'custom_fhir';
  endpointUrl: string;
  clientId: string;
  clientSecretMasked: string;
  facilityCode: string;
  status: 'connected' | 'standby' | 'simulated' | 'error';
  lastPingTime?: string;
  syncIntervalSec: number;
  autoSyncEnabled: boolean;
  minTurnoverBufferMinutes: number; // default 15 min mandatory turnover rule
}

export interface ClearanceStatus {
  labsCleared: boolean;
  labsNotes?: string;
  ekgCleared: boolean;
  ekgNotes?: string;
  cardiacCleared: boolean;
  cardiacNotes?: string;
  hpInChart: boolean;
  consentsOnFile: boolean;
  implantsVerified: boolean;
  specialSuppliesNotes?: string;
}

export interface EpicPatientCase {
  id: string; // Internal UUID
  epicCaseId: string; // e.g. "1015987"
  mrn: string; // e.g. "151159090"
  accountNumber: string; // e.g. "10198149392"
  patientName: string; // Full name e.g. "Perez, Jose Ernesto"
  patientInitials: string; // e.g. "PER, J"
  age: number;
  gender: 'M' | 'F' | 'O';
  dob: string;
  heightCm: number;
  weightKg: number;
  inpatientBed?: string; // e.g. "MH8.836"
  isConfidential: boolean;

  // Department assignment (scoping)
  department?: string; // 'Main OR' | 'Day Surgery' | 'Ortho OR' | 'Endo' | 'CV Heart & Vascular'

  // Surgical Case Details
  roomNumber: string; // e.g. "MC OR 06"
  caseOrder: string; // e.g. "1", "2", "3", "B-3"
  primaryProcedure: string;
  secondaryProcedure?: string;
  procedureCodes: string[];
  casePriority: 'elective' | 'urgent' | 'emergent';
  isAddOn: boolean;
  addOnTime?: string;
  addedBy?: string;
  anesthesiaType: 'General' | 'MAC' | 'Regional' | 'Spinal' | 'Epidural' | 'Local';
  comments?: string;
  delayReason?: string;

  // Assigned Clinical Staff
  surgeon: string;
  surgicalAssistant?: string;
  anesthesiologist: string;
  crna?: string;
  circulatorRN?: string;
  scrubTech?: string;
  preOpRN?: string;
  pacuRN?: string;
  phase2Nurse?: string;

  // Perioperative Phase & Timing
  currentPhase: PerioperativePhase;
  scheduledArrival: string;

  // Sched: In-Room, Cut, Out-Room
  schedInRoom: string;  // e.g. "10:55"
  schedCut: string;     // e.g. "10:55"
  schedOutRoom: string; // e.g. "12:55"
  
  // Legacy / convenience mappings
  scheduledStartTime: string;
  scheduledEndTime: string;

  // Act/Upd: In-Room, Cut, Surgery End (Closing), Out-Room
  inRoomTime?: string;       // e.g. "11:15"
  surgeryStartTime?: string; // Cut e.g. "11:30"
  surgeryEndTime?: string;   // Surgery End e.g. "11:55"
  outRoomTime?: string;      // e.g. "12:00"
  pacuArrivalTime?: string;
  phase2ArrivalTime?: string;
  completedTime?: string;

  // Pre-Admission & Clearance Gatekeepers (Environment 1)
  clearance?: ClearanceStatus;

  // Pre-Op & Holding Gatekeepers (Environment 2)
  preOpBay?: string; // e.g. "Bay 02", "Labs", "Holding A"
  preOpReady: boolean;
  preOpReadyTime?: string;
  surgeonSeen: boolean;
  surgeonSeenTime?: string;
  hpComplete: 'yes' | 'pending' | 'na';
  surgicalConsent: 'signed' | 'pending' | 'refused';
  anesthesiaConsent: 'signed' | 'pending' | 'refused';
  siteMarked: 'yes' | 'pending' | 'na';
  anesthesiaReady: boolean;
  anesthesiaReadyTime?: string;
  anesthesiaTechReady: boolean;
  blockStatus: 'not_needed' | 'ordered' | 'in_progress' | 'completed';
  blockType?: string;
  reportCalled: boolean;
  reportCalledTime?: string;
  uptResult?: 'negative' | 'positive' | 'na' | 'waived';
  clipNeeded?: 'no' | 'yes_done' | 'yes_pending';

  // Intra-Op / OR Gatekeepers (Environment 3)
  circPreopVisit: boolean;
  roomReady: boolean;
  casePrepNotes?: string;
  bloodBankRequired: boolean;
  medicationSpecial?: string;

  // PACU & Post-Op (Environment 4)
  pacuLocation?: string; // e.g. "PACU Bay 04"
  pacuTransportComplete: boolean;
  readyForAnesSignout: boolean;
  anesSignoutTime?: string;
  pacuToFloorHold: boolean;
  xrayOrdered: boolean;
  ptOrdered: boolean;
  aldreteScore?: number; // 0-10
  pacuDisposition?: 'phase2' | 'inpatient_floor' | 'icu';

  // Phase II Ambulatory Recovery & Discharge (Environment 5)
  phase2Location?: string; // e.g. "Phase II Station 02"
  recoveryNeeds?: string;
  spdNotes?: string;
  oralIntakeTolerated?: boolean;
  ambulationAchieved?: boolean;
  dressingIntact?: boolean;
  rideConfirmed?: boolean;
  rideContact?: string;
  rideTime?: string;
  dischargeReady?: boolean;

  // Clinical Flags & Alerts
  latexAllergy: boolean;
  infectionStatus: 'none' | 'contact' | 'droplet' | 'airborne';
  defibPacemaker: boolean;
  anesthesiaTransport: boolean;
  specialNeeds?: string;
  preOpBypass: boolean;
  erasPathway: boolean;
  scopeEgd: boolean;
  interpreterNeeded?: string;
  preOpAlerts?: string;

  // Family Contacts
  familyCommunication?: FamilyContact;
}

export interface BoardRunner {
  id: string;
  title: string;
  staffName: string;
  pagerOrPhone: string;
  role: 'anes' | 'rn' | 'wp' | 'late' | 'float';
}

export interface RoomStaffTeam {
  anesthesiologist: string;
  crna: string;
  circulatorRN: string;
  scrubTech: string;
  anesTech?: string;
}

export interface OperatingRoom {
  id: string;
  name: string; // e.g. "MC OR 01", "MC OR 06", "MC ORT OR 06"
  department: string; // e.g. 'Main OR' | 'Ortho OR' | 'Endo' | 'Ambulatory' | 'Day Surgery'
  displayOrder: number;
  status: 'in_case' | 'closing' | 'turnover' | 'idle' | 'hold';
  cleaningStatus?: 'clean' | 'cleaning' | 'dirty';
  assignedStaff?: RoomStaffTeam;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  patientId?: string;
  patientName?: string;
  details: string;
}

export interface JourneyState {
  version: string;
  lastUpdated: string;
  departments: Department[];
  staffRoster: StaffMember[];
  patients: EpicPatientCase[];
  rooms: OperatingRoom[];
  runners: BoardRunner[];
  users: User[];
  emrConfig: EmrApiConfig;
  auditLogs: AuditLogEntry[];
}

// Backward compatibility alias
export type FlowState = JourneyState;
