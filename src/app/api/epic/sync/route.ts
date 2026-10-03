import { NextResponse } from 'next/server';
import { getFlowState, saveFlowState } from '@/lib/storage';
import { EpicPatientCase } from '@/types/flow';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const state = getFlowState();

    // If an Epic incoming case payload is received:
    if (body.epicCase) {
      const incomingCase: EpicPatientCase = body.epicCase;
      const existingIdx = state.patients.findIndex(p => p.epicCaseId === incomingCase.epicCaseId);

      if (existingIdx !== -1) {
        state.patients[existingIdx] = { ...state.patients[existingIdx], ...incomingCase };
      } else {
        state.patients.push(incomingCase);
      }

      state.auditLogs.unshift({
        id: `epic-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: 'Epic OpTime HL7 Interface',
        action: 'EPIC_CASE_SYNC',
        patientId: incomingCase.id,
        patientName: incomingCase.patientName,
        details: `Case #${incomingCase.epicCaseId} synchronized with Epic OpTime`
      });

      saveFlowState(state);
      return NextResponse.json({ success: true, message: 'Epic case synced', state });
    }

    return NextResponse.json({
      status: 'online',
      service: 'Perfect Flow Epic OpTime Gateway',
      version: '1.0.0',
      activeCases: state.patients.length
    });
  } catch (error) {
    console.error('API /api/epic/sync error:', error);
    return NextResponse.json({ error: 'Failed to process Epic sync' }, { status: 500 });
  }
}
