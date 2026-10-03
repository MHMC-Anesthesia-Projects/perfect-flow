import { EpicPatientCase } from '@/types/flow';

export interface TurnoverValidationResult {
  hasConflict: boolean;
  message?: string;
  conflictingCase?: EpicPatientCase;
  bufferMinutes?: number;
  conflictType?: 'overlap' | 'buffer_too_tight';
}

export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

/**
 * Validates that an operating room case booking does not overlap with or violate
 * the mandatory minimum room turnover buffer (default 15 minutes) with any other
 * case scheduled in the same operating room.
 */
export function validateRoomTurnover(
  roomNumber: string,
  proposedStartTime: string, // in-room start e.g. "11:15"
  proposedEndTime: string,   // out-room end e.g. "12:55"
  patientId: string | null,  // exclude self when editing existing case
  allPatients: EpicPatientCase[],
  minBufferMinutes: number = 15
): TurnoverValidationResult {
  const propStart = parseTimeToMinutes(proposedStartTime);
  const propEnd = parseTimeToMinutes(proposedEndTime);

  if (propStart === null || propEnd === null) {
    return { hasConflict: false };
  }

  if (propEnd <= propStart) {
    return {
      hasConflict: true,
      conflictType: 'overlap',
      message: `Invalid Booking Times: Scheduled End Time (${proposedEndTime}) must be after Scheduled Start Time (${proposedStartTime}).`
    };
  }

  // Filter other active or scheduled cases in the exact same room
  const otherCasesInRoom = allPatients.filter(p => 
    p.roomNumber === roomNumber &&
    p.id !== patientId &&
    p.currentPhase !== 'completed' &&
    p.currentPhase !== 'pacu' &&
    p.currentPhase !== 'phase2'
  );

  for (const c of otherCasesInRoom) {
    const caseStart = parseTimeToMinutes(c.inRoomTime || c.schedInRoom || c.scheduledStartTime);
    const caseEnd = parseTimeToMinutes(c.outRoomTime || c.schedOutRoom || c.scheduledEndTime);

    if (caseStart === null || caseEnd === null) continue;

    // Check direct overlap (two cases scheduled simultaneously in the same room)
    if (propStart < caseEnd && propEnd > caseStart) {
      return {
        hasConflict: true,
        conflictType: 'overlap',
        conflictingCase: c,
        message: `Booking Overlap Conflict: ${roomNumber} is already booked for Case #${c.caseOrder} (${c.patientName}, Dr. ${c.surgeon}) from ${c.schedInRoom || c.scheduledStartTime} to ${c.schedOutRoom || c.scheduledEndTime}. Two cases cannot occupy the same operating room simultaneously.`
      };
    }

    // Check tight turnover buffer when proposed case is scheduled AFTER existing case
    if (propStart >= caseEnd) {
      const buffer = propStart - caseEnd;
      if (buffer < minBufferMinutes) {
        return {
          hasConflict: true,
          conflictType: 'buffer_too_tight',
          conflictingCase: c,
          bufferMinutes: buffer,
          message: `Room Turnover Conflict: Only a ${buffer}-minute buffer exists between Case #${c.caseOrder} ending at ${c.schedOutRoom || c.scheduledEndTime} and this case starting at ${proposedStartTime} in ${roomNumber}. A minimum ${minBufferMinutes}-minute room turnover buffer is mandatory for room decontamination and setup!`
        };
      }
    }

    // Check tight turnover buffer when proposed case is scheduled BEFORE existing case
    if (propEnd <= caseStart) {
      const buffer = caseStart - propEnd;
      if (buffer < minBufferMinutes) {
        return {
          hasConflict: true,
          conflictType: 'buffer_too_tight',
          conflictingCase: c,
          bufferMinutes: buffer,
          message: `Room Turnover Conflict: Only a ${buffer}-minute buffer exists between this case ending at ${proposedEndTime} and Case #${c.caseOrder} starting at ${c.schedInRoom || c.scheduledStartTime} in ${roomNumber}. A minimum ${minBufferMinutes}-minute room turnover buffer is mandatory for room decontamination and setup!`
        };
      }
    }
  }

  return { hasConflict: false };
}
