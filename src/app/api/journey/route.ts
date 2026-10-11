import { NextResponse } from 'next/server';
import { 
  getJourneyState, 
  saveJourneyState, 
  updatePatientCase, 
  updateRoomStatus, 
  resetJourneyState, 
  addPatientCase,
  updateRoomStaff,
  saveDepartments,
  saveStaffRoster
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getJourneyState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('API /api/journey GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve journey state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      action, 
      patientId, 
      updates, 
      roomId, 
      roomUpdates, 
      actorName, 
      note, 
      patient, 
      users, 
      emrConfig,
      departments,
      staffRoster,
      assignedStaff 
    } = body;

    if (action === 'reset') {
      const state = await resetJourneyState();
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

    const targetStaff = assignedStaff || (body as any).staff;
    if (action === 'updateRoomStaff' && roomId && targetStaff) {
      const state = await updateRoomStaff(roomId, targetStaff);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'saveDepartments' && departments) {
      const state = await saveDepartments(departments);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'saveStaffRoster' && staffRoster) {
      const state = await saveStaffRoster(staffRoster);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'saveUsers' && users) {
      const state = await getJourneyState();
      state.users = users;
      await saveJourneyState(state);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'saveEmrConfig' && emrConfig) {
      const state = await getJourneyState();
      state.emrConfig = emrConfig;
      await saveJourneyState(state);
      return NextResponse.json({ success: true, state });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    console.error('API /api/journey POST error:', error);
    return NextResponse.json({ error: 'Failed to update journey state' }, { status: 500 });
  }
}
