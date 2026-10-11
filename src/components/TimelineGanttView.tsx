'use client';

import React, { useState, useEffect } from 'react';
import { EpicPatientCase, OperatingRoom, StaffMember, RoomStaffTeam } from '@/types/journey';
import { Clock, Plus, AlertTriangle, LayoutGrid, Layers, CalendarRange, UserCheck } from 'lucide-react';
import { StaffPickerModal } from './StaffPickerModal';

interface TimelineGanttViewProps {
  rooms: OperatingRoom[];
  patients: EpicPatientCase[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  hipaaProtected: boolean;
  minTurnoverMinutes?: number;
  orSubView?: 'grid' | 'stacked' | 'timeline';
  onSelectOrSubView?: (view: 'grid' | 'stacked' | 'timeline') => void;
  staffRoster?: StaffMember[];
  onUpdateRoomStaff?: (roomId: string, staff: RoomStaffTeam) => void;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  rooms,
  patients,
  onSelectPatient,
  hipaaProtected,
  minTurnoverMinutes = 15,
  orSubView = 'timeline',
  onSelectOrSubView,
  staffRoster = [],
  onUpdateRoomStaff
}) => {
  const START_HOUR = 7;
  const END_HOUR = 19;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;

  const PX_PER_MINUTE = 2.2;
  const TOTAL_WIDTH = TOTAL_MINUTES * PX_PER_MINUTE;
  const ROW_HEIGHT = 74;

  const [currentMinutesFromStart, setCurrentMinutesFromStart] = useState<number>(0);

  // Staff Picker Modal State
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    roomId: string;
    roomName: string;
    roleSlot: 'anesthesiologist' | 'crna' | 'circulatorRN' | 'scrubTech' | 'anesTech';
    roleLabel: string;
    currentStaffName: string;
  } | null>(null);

  useEffect(() => {
    const updateScrubber = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMins = now.getMinutes();
      const totalMins = (currentHour - START_HOUR) * 60 + currentMins;
      setCurrentMinutesFromStart(totalMins);
    };
    updateScrubber();
    const interval = setInterval(updateScrubber, 30000);
    return () => clearInterval(interval);
  }, []);

  const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return (h - START_HOUR) * 60 + m;
  };

  const hoursArray = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  const handleOpenStaffPicker = (
    room: OperatingRoom,
    roleSlot: 'anesthesiologist' | 'crna' | 'circulatorRN' | 'scrubTech' | 'anesTech',
    roleLabel: string
  ) => {
    setPickerState({
      isOpen: true,
      roomId: room.id,
      roomName: room.name,
      roleSlot,
      roleLabel,
      currentStaffName: (room.assignedStaff && room.assignedStaff[roleSlot]) || ''
    });
  };

  const handleStaffSelected = (displayName: string) => {
    if (!pickerState || !onUpdateRoomStaff) return;
    const room = rooms.find(r => r.id === pickerState.roomId);
    if (!room) return;

    const currentStaff: RoomStaffTeam = room.assignedStaff || {
      anesthesiologist: '',
      crna: '',
      circulatorRN: '',
      scrubTech: '',
      anesTech: ''
    };

    const updatedStaff: RoomStaffTeam = {
      ...currentStaff,
      [pickerState.roleSlot]: displayName
    };

    onUpdateRoomStaff(room.id, updatedStaff);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Top Controls Bar */}
      <div style={{
        padding: '10px 20px',
        background: 'var(--surface-header)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            SCHEDULE TIMELINE GANTT (07:00 – 19:00+)
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-light)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 11
          }}>
            <Clock size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Turnover Buffer: <strong>{minTurnoverMinutes}m</strong></span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-subtle)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: 3,
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => onSelectOrSubView && onSelectOrSubView('grid')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: orSubView === 'grid' ? 'var(--accent-primary)' : 'transparent',
              color: orSubView === 'grid' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: orSubView === 'grid' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <LayoutGrid size={13} />
            <span>Suite Grid</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectOrSubView && onSelectOrSubView('stacked')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: orSubView === 'stacked' ? 'var(--accent-primary)' : 'transparent',
              color: orSubView === 'stacked' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: orSubView === 'stacked' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <Layers size={13} />
            <span>Consolidated Stacked</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectOrSubView && onSelectOrSubView('timeline')}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: orSubView === 'timeline' ? 'var(--accent-primary)' : 'transparent',
              color: orSubView === 'timeline' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: orSubView === 'timeline' ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <CalendarRange size={13} />
            <span>Gantt Timeline</span>
          </button>
        </div>

        {/* Phase Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-sched-bg)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Scheduled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-surgery-bg)' }} />
            <span style={{ color: 'var(--text-muted)' }}>In Surgery</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-closing-bg)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Closing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-pacu-bg)' }} />
            <span style={{ color: 'var(--text-muted)' }}>PACU</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sticky Top Timeline Header Ruler */}
        <div style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Top Left Room & Staff Corner Header */}
          <div style={{
            width: 270,
            minWidth: 270,
            padding: '10px 14px',
            fontWeight: 900,
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            borderRight: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-header)'
          }}>
            <span>SUITE & ASSIGNED STAFF</span>
            <span style={{ fontSize: 9, color: 'var(--accent-primary)', fontWeight: 800 }}>TAP TO ASSIGN</span>
          </div>

          {/* Hourly Timeline Header */}
          <div style={{
            width: TOTAL_WIDTH,
            position: 'relative',
            height: 38,
            overflowX: 'hidden'
          }}>
            {hoursArray.map((hour) => {
              const leftPos = (hour - START_HOUR) * 60 * PX_PER_MINUTE;
              return (
                <div
                  key={hour}
                  style={{
                    position: 'absolute',
                    left: leftPos,
                    top: 0,
                    bottom: 0,
                    width: 60 * PX_PER_MINUTE,
                    borderLeft: '1px solid var(--border-medium)',
                    paddingLeft: 6,
                    paddingTop: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Operating Suites Rows */}
        <div style={{
          flex: 1,
          display: 'flex'
        }}>
          {/* Left Column: Room Names & Clickable Staff Roster */}
          <div style={{
            width: 270,
            minWidth: 270,
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            left: 0,
            zIndex: 15
          }}>
            {rooms.map((room) => {
              const staff = room.assignedStaff;
              return (
                <div
                  key={room.id}
                  style={{
                    height: ROW_HEIGHT,
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 6,
                    borderBottom: '1px solid var(--border-light)',
                    background: 'var(--surface-header)'
                  }}
                >
                  {/* Top: Room name + department badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {room.name}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: 'var(--surface-subtle)',
                        color: 'var(--text-muted)'
                      }}>
                        {room.department}
                      </span>
                    </div>

                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: room.status === 'in_case' ? 'rgba(34, 197, 94, 0.15)' : 'var(--surface-subtle)',
                      color: room.status === 'in_case' ? '#22c55e' : 'var(--text-muted)'
                    }}>
                      {room.status === 'in_case' ? 'IN CASE' : room.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Bottom: Clickable Staff Assignment Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {/* MD Box */}
                    <button
                      type="button"
                      onClick={() => handleOpenStaffPicker(room, 'anesthesiologist', 'Anesthesiologist')}
                      title={`Anesthesiologist: ${staff?.anesthesiologist || 'Unassigned (Tap to assign)'}`}
                      style={{
                        padding: '2px 5px',
                        borderRadius: 3,
                        border: '1px solid #3b82f6',
                        background: '#1d4ed8',
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      {staff?.anesthesiologist ? staff.anesthesiologist.split(' ')[0] : '+ MD'}
                    </button>

                    {/* CRNA Box */}
                    <button
                      type="button"
                      onClick={() => handleOpenStaffPicker(room, 'crna', 'CRNA')}
                      title={`CRNA: ${staff?.crna || 'Unassigned (Tap to assign)'}`}
                      style={{
                        padding: '2px 5px',
                        borderRadius: 3,
                        border: '1px solid #475569',
                        background: '#0f172a',
                        color: '#f8fafc',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      {staff?.crna ? staff.crna.split(' ')[0] : '+ CRNA'}
                    </button>

                    {/* Circulator RN Box */}
                    <button
                      type="button"
                      onClick={() => handleOpenStaffPicker(room, 'circulatorRN', 'Circulating RN')}
                      title={`Circulating RN: ${staff?.circulatorRN || 'Unassigned (Tap to assign)'}`}
                      style={{
                        padding: '2px 5px',
                        borderRadius: 3,
                        border: '1px solid #4ade80',
                        background: '#86efac',
                        color: '#14532d',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      *{staff?.circulatorRN ? staff.circulatorRN.replace(' (RN)', '').split(' ')[0] : '+ RN'}
                    </button>

                    {/* Scrub Tech Box */}
                    <button
                      type="button"
                      onClick={() => handleOpenStaffPicker(room, 'scrubTech', 'Scrub Tech')}
                      title={`Scrub Tech: ${staff?.scrubTech || 'Unassigned (Tap to assign)'}`}
                      style={{
                        padding: '2px 5px',
                        borderRadius: 3,
                        border: '1px solid #d8b4fe',
                        background: '#e9d5ff',
                        color: '#581c87',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      *{staff?.scrubTech ? staff.scrubTech.replace(' (ST)', '').split(' ')[0] : '+ ST'}
                    </button>

                    {/* Anes Tech Box */}
                    <button
                      type="button"
                      onClick={() => handleOpenStaffPicker(room, 'anesTech', 'Anes Tech')}
                      title={`Anes Tech: ${staff?.anesTech || 'Unassigned (Tap to assign)'}`}
                      style={{
                        padding: '2px 5px',
                        borderRadius: 3,
                        border: '1px solid #fbbf24',
                        background: '#fef3c7',
                        color: '#92400e',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      {staff?.anesTech ? staff.anesTech.split(' ')[0] : '+ AT'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Tracks Grid */}
          <div style={{
            width: TOTAL_WIDTH,
            position: 'relative',
            background: 'var(--surface-card)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Vertical Hour Grid Lines */}
            {hoursArray.map((hour) => {
              const leftPos = (hour - START_HOUR) * 60 * PX_PER_MINUTE;
              return (
                <div
                  key={`line-${hour}`}
                  style={{
                    position: 'absolute',
                    left: leftPos,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--border-light)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />
              );
            })}

            {/* Current Time "Now" Scrubber Line */}
            {currentMinutesFromStart > 0 && currentMinutesFromStart < TOTAL_MINUTES && (
              <div
                style={{
                  position: 'absolute',
                  left: currentMinutesFromStart * PX_PER_MINUTE,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'var(--scrubber-red)',
                  zIndex: 10,
                  pointerEvents: 'none',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 4,
                  left: -18,
                  background: 'var(--scrubber-red)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontFamily: 'var(--font-mono)'
                }}>
                  NOW
                </div>
              </div>
            )}

            {/* Room Timeline Tracks */}
            {rooms.map((room) => {
              const roomPatients = patients.filter(p => p.roomNumber === room.name);

              return (
                <div
                  key={`track-${room.id}`}
                  style={{
                    height: ROW_HEIGHT,
                    borderBottom: '1px solid var(--border-light)',
                    position: 'relative',
                    width: '100%'
                  }}
                >
                  {roomPatients.map((patient) => {
                    const startTimeStr = patient.inRoomTime || patient.schedInRoom || patient.scheduledStartTime;
                    const endTimeStr = patient.outRoomTime || patient.schedOutRoom || patient.scheduledEndTime;

                    const startMins = timeToMinutes(startTimeStr);
                    const endMins = timeToMinutes(endTimeStr);
                    const durationMins = Math.max(30, endMins - startMins);

                    const leftPx = Math.max(0, startMins * PX_PER_MINUTE);
                    const widthPx = Math.max(80, durationMins * PX_PER_MINUTE);

                    const isNowActive = patient.currentPhase === 'in_surgery' || patient.currentPhase === 'closing';

                    let barBg = 'var(--phase-sched-bg)';
                    let barFg = 'var(--phase-sched-fg)';
                    if (patient.currentPhase === 'in_surgery') {
                      barBg = 'var(--phase-surgery-bg)';
                      barFg = 'var(--phase-surgery-fg)';
                    } else if (patient.currentPhase === 'closing') {
                      barBg = 'var(--phase-closing-bg)';
                      barFg = 'var(--phase-closing-fg)';
                    } else if (patient.currentPhase === 'pacu') {
                      barBg = 'var(--phase-pacu-bg)';
                      barFg = 'var(--phase-pacu-fg)';
                    } else if (patient.currentPhase === 'completed') {
                      barBg = 'var(--phase-complete-bg)';
                      barFg = 'var(--phase-complete-fg)';
                    }

                    return (
                      <div
                        key={patient.id}
                        onClick={() => onSelectPatient(patient)}
                        style={{
                          position: 'absolute',
                          left: leftPx,
                          width: widthPx,
                          top: 14,
                          height: 46,
                          borderRadius: 'var(--radius-sm)',
                          background: barBg,
                          color: barFg,
                          padding: '4px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isNowActive ? '0 0 12px rgba(22, 163, 74, 0.4)' : 'var(--shadow-sm)',
                          border: isNowActive ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                          zIndex: isNowActive ? 5 : 2,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap' }}>
                            {patient.caseOrder ? `Case #${patient.caseOrder} • ` : ''}
                            {hipaaProtected ? patient.patientInitials : patient.patientName}
                          </span>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {startTimeStr}–{endTimeStr}
                          </span>
                        </div>

                        <div style={{
                          fontSize: 10,
                          opacity: 0.9,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}>
                          {patient.primaryProcedure} (Dr. {patient.surgeon})
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Picker Modal */}
      {pickerState && (
        <StaffPickerModal
          isOpen={pickerState.isOpen}
          onClose={() => setPickerState(null)}
          roomId={pickerState.roomId}
          roomName={pickerState.roomName}
          roleSlot={pickerState.roleSlot}
          roleLabel={pickerState.roleLabel}
          currentStaffName={pickerState.currentStaffName}
          staffRoster={staffRoster}
          onSelectStaff={handleStaffSelected}
        />
      )}
    </div>
  );
};
