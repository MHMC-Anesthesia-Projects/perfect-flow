import fs from 'fs';
import path from 'path';
import { FlowState, EpicPatientCase, OperatingRoom, AuditLogEntry } from '@/types/flow';
import { getInitialFlowState } from './mockData';
import { getSupabaseServerClient, isSupabaseConfigured, FLOW_TABLE } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'flow_state.json');

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

export async function getFlowState(): Promise<FlowState> {
  // 1. If Supabase is configured, use centralized PostgreSQL database
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(FLOW_TABLE)
          .select('*')
          .eq('id', 'current')
          .maybeSingle();

        if (data && data.state_data) {
          return data.state_data as FlowState;
        }

        // If table exists but empty, seed it with rich initial state
        const initial = getInitialFlowState();
        await supabase.from(FLOW_TABLE).upsert({
          id: 'current',
          version: initial.version,
          last_updated: new Date().toISOString(),
          state_data: initial
        });
        return initial;
      } catch (err) {
        console.warn('Supabase getFlowState error, falling back to local:', err);
      }
    }
  }

  // 2. Offline / local fallback to filesystem
  const initial = getInitialFlowState();
  const state = safeReadJSON<FlowState>(STATE_FILE, initial);
  return state;
}

export async function saveFlowState(state: FlowState): Promise<void> {
  state.lastUpdated = new Date().toISOString();

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from(FLOW_TABLE).upsert({
          id: 'current',
          version: state.version,
          last_updated: state.lastUpdated,
          state_data: state
        });
      } catch (err) {
        console.warn('Supabase saveFlowState error:', err);
      }
    }
  }

  // 2. Also write to local cache if filesystem allows
  safeWriteJSON(STATE_FILE, state);
}

export async function updatePatientCase(
  patientId: string,
  updates: Partial<EpicPatientCase>,
  actorName: string = 'Staff',
  actionNote?: string
): Promise<FlowState> {
  const state = await getFlowState();
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
    await saveFlowState(state);
  }

  return state;
}

export async function updateRoomStatus(
  roomId: string,
  updates: Partial<OperatingRoom>
): Promise<FlowState> {
  const state = await getFlowState();
  const index = state.rooms.findIndex(r => r.id === roomId);
  if (index !== -1) {
    state.rooms[index] = { ...state.rooms[index], ...updates };
    await saveFlowState(state);
  }
  return state;
}

export async function addPatientCase(
  newPatient: EpicPatientCase,
  actorName: string = 'Staff'
): Promise<FlowState> {
  const state = await getFlowState();
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
  await saveFlowState(state);
  return state;
}

export async function resetFlowState(): Promise<FlowState> {
  const initial = getInitialFlowState();
  await saveFlowState(initial);
  return initial;
}
