import { NextResponse } from 'next/server';
import { getFlowState, updatePatientCase, updateRoomStatus, resetFlowState } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getFlowState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('API /api/flow GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve flow state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, patientId, updates, roomId, roomUpdates, actorName, note } = body;

    if (action === 'reset') {
      const state = resetFlowState();
      return NextResponse.json({ success: true, state });
    }

    if (action === 'updatePatient' && patientId && updates) {
      const state = updatePatientCase(patientId, updates, actorName || 'Staff', note);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'updateRoom' && roomId && roomUpdates) {
      const state = updateRoomStatus(roomId, roomUpdates);
      return NextResponse.json({ success: true, state });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    console.error('API /api/flow POST error:', error);
    return NextResponse.json({ error: 'Failed to update flow state' }, { status: 500 });
  }
}
