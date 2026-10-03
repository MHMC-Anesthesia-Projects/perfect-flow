import fs from 'fs';
import path from 'path';
import { FlowState, EpicPatientCase, OperatingRoom, AuditLogEntry } from '@/types/flow';
import { getInitialFlowState } from './mockData';

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
  } catch (err) {
    console.error('safeWriteJSON failed:', err);
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

export function getFlowState(): FlowState {
  const initial = getInitialFlowState();
  const state = safeReadJSON<FlowState>(STATE_FILE, initial);
  return state;
}

export function saveFlowState(state: FlowState): void {
  state.lastUpdated = new Date().toISOString();
  safeWriteJSON(STATE_FILE, state);
}

export function updatePatientCase(
  patientId: string,
  updates: Partial<EpicPatientCase>,
  actorName: string = 'Staff',
  actionNote?: string
): FlowState {
  const state = getFlowState();
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
    saveFlowState(state);
  }

  return state;
}

export function updateRoomStatus(
  roomId: string,
  updates: Partial<OperatingRoom>
): FlowState {
  const state = getFlowState();
  const index = state.rooms.findIndex(r => r.id === roomId);
  if (index !== -1) {
    state.rooms[index] = { ...state.rooms[index], ...updates };
    saveFlowState(state);
  }
  return state;
}

export function resetFlowState(): FlowState {
  const initial = getInitialFlowState();
  saveFlowState(initial);
  return initial;
}
