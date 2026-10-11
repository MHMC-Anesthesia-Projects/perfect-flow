import fs from 'fs';
import path from 'path';
import { JourneyState, FlowState, EpicPatientCase, OperatingRoom, AuditLogEntry, Department, StaffMember, RoomStaffTeam } from '@/types/journey';
import { getInitialJourneyState, initialDepartments, initialStaffRoster } from './mockData';
import { getSupabaseServerClient, isSupabaseConfigured, JOURNEY_TABLE } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'journey_state.json');
const LEGACY_STATE_FILE = path.join(DATA_DIR, 'flow_state.json');

function ensureDirectoryExistence(filePath: string) {
  try {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
  } catch {
    // Ignore in read-only / serverless
  }
}

function safeWriteJSON(filePath: string, data: unknown) {
  try {
    ensureDirectoryExistence(filePath);
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch {
    // Ignore in read-only / serverless environments when Supabase is active
  }
}

function safeReadJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      // Check if legacy flow_state.json exists and migrate
      if (fs.existsSync(LEGACY_STATE_FILE)) {
        try {
          const rawLegacy = fs.readFileSync(LEGACY_STATE_FILE, 'utf-8');
          const parsedLegacy = JSON.parse(rawLegacy) as T;
          safeWriteJSON(filePath, parsedLegacy);
          return parsedLegacy;
        } catch {
          // fallback below
        }
      }
      safeWriteJSON(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function normalizeState(state: JourneyState, initial: JourneyState): JourneyState {
  if (!state.departments || state.departments.length === 0) {
    state.departments = initial.departments || initialDepartments;
  }
  if (!state.staffRoster || state.staffRoster.length === 0) {
    state.staffRoster = initial.staffRoster || initialStaffRoster;
  }
  return state;
}

export async function getJourneyState(): Promise<JourneyState> {
  const initial = getInitialJourneyState();

  // 1. If Supabase is configured, use centralized PostgreSQL database
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from(JOURNEY_TABLE)
          .select('*')
          .eq('id', 'current')
          .maybeSingle();

        if (data && data.state_data) {
          const normalized = normalizeState(data.state_data as JourneyState, initial);
          return normalized;
        }

        // If table exists but empty, seed it with rich initial state
        await supabase.from(JOURNEY_TABLE).upsert({
          id: 'current',
          version: initial.version,
          last_updated: new Date().toISOString(),
          state_data: initial
        });
        return initial;
      } catch (err) {
        console.warn('Supabase getJourneyState error, falling back to local:', err);
      }
    }
  }

  // 2. Offline / local fallback to filesystem
  const state = safeReadJSON<JourneyState>(STATE_FILE, initial);
  return normalizeState(state, initial);
}

export async function saveJourneyState(state: JourneyState): Promise<void> {
  state.lastUpdated = new Date().toISOString();

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from(JOURNEY_TABLE).upsert({
          id: 'current',
          version: state.version,
          last_updated: state.lastUpdated,
          state_data: state
        });
      } catch (err) {
        console.warn('Supabase saveJourneyState error:', err);
      }
    }
  }

  // 2. Also write to local cache if filesystem allows
  safeWriteJSON(STATE_FILE, state);
  // Also keep legacy file synced for any background processes reading it
  safeWriteJSON(LEGACY_STATE_FILE, state);
}

export async function updatePatientCase(
  patientId: string,
  updates: Partial<EpicPatientCase>,
  actorName: string = 'Staff',
  actionNote?: string
): Promise<JourneyState> {
  const state = await getJourneyState();
  const index = state.patients.findIndex(p => p.id === patientId);

  if (index !== -1) {
    const current = state.patients[index];
    const updated = { ...current, ...updates };
    state.patients[index] = updated;

    // Add audit log
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: actorName,
      action: actionNote || 'PATIENT_UPDATED',
      patientId: updated.id,
      patientName: updated.patientName,
      details: actionNote || `Updated case ${updated.epicCaseId} (${updated.roomNumber})`
    };
    state.auditLogs = [log, ...state.auditLogs.slice(0, 49)]; // Keep last 50
    await saveJourneyState(state);
  }

  return state;
}

export async function updateRoomStatus(
  roomId: string,
  updates: Partial<OperatingRoom>
): Promise<JourneyState> {
  const state = await getJourneyState();
  const index = state.rooms.findIndex(r => r.id === roomId);
  if (index !== -1) {
    state.rooms[index] = { ...state.rooms[index], ...updates };
    await saveJourneyState(state);
  }
  return state;
}

export async function updateRoomStaff(
  roomId: string,
  assignedStaff: RoomStaffTeam
): Promise<JourneyState> {
  const state = await getJourneyState();
  const index = state.rooms.findIndex(r => r.id === roomId);
  if (index !== -1) {
    state.rooms[index] = { ...state.rooms[index], assignedStaff };
    await saveJourneyState(state);
  }
  return state;
}

export async function saveDepartments(
  departments: Department[]
): Promise<JourneyState> {
  const state = await getJourneyState();
  state.departments = departments;
  await saveJourneyState(state);
  return state;
}

export async function saveStaffRoster(
  staffRoster: StaffMember[]
): Promise<JourneyState> {
  const state = await getJourneyState();
  state.staffRoster = staffRoster;
  await saveJourneyState(state);
  return state;
}

export async function addPatientCase(
  newPatient: EpicPatientCase,
  actorName: string = 'Staff'
): Promise<JourneyState> {
  const state = await getJourneyState();
  state.patients = [newPatient, ...state.patients];
  const log: AuditLogEntry = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    user: actorName,
    action: 'ADD_ON_CREATED',
    patientId: newPatient.id,
    patientName: newPatient.patientName,
    details: `Urgent Add-On case #${newPatient.epicCaseId} booked for ${newPatient.roomNumber}`
  };
  state.auditLogs = [log, ...state.auditLogs.slice(0, 49)];
  await saveJourneyState(state);
  return state;
}

export async function resetJourneyState(): Promise<JourneyState> {
  const initial = getInitialJourneyState();
  await saveJourneyState(initial);
  return initial;
}

// Backward compatibility aliases
export const getFlowState = getJourneyState;
export const saveFlowState = saveJourneyState;
export const resetFlowState = resetJourneyState;
