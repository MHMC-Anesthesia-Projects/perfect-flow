import { NextResponse } from 'next/server';
import { getFlowState, saveFlowState, updatePatientCase, updateRoomStatus, resetFlowState, addPatientCase } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getFlowState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('API /api/flow GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve flow state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, patientId, updates, roomId, roomUpdates, actorName, note, patient, users, emrConfig } = body;

    if (action === 'reset') {
      const state = await resetFlowState();
      return NextResponse.json({ success: true, state });
    }

    if (action === 'addPatient' && patient) {
      const state = await addPatientCase(patient, actorName || 'Staff');
      return NextResponse.json({ success: true, state });
    }

    if (action === 'updatePatient' && patientId && updates) {
      const state = await updatePatientCase(patientId, updates, actorName || 'Staff', note);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'updateRoom' && roomId && roomUpdates) {
      const state = await updateRoomStatus(roomId, roomUpdates);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'saveUsers' && users) {
      const state = await getFlowState();
      state.users = users;
      await saveFlowState(state);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'saveEmrConfig' && emrConfig) {
      const state = await getFlowState();
      state.emrConfig = emrConfig;
      await saveFlowState(state);
      return NextResponse.json({ success: true, state });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    console.error('API /api/flow POST error:', error);
    return NextResponse.json({ error: 'Failed to update flow state' }, { status: 500 });
  }
}
