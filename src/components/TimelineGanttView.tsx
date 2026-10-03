'use client';

import React, { useState, useEffect } from 'react';
import { EpicPatientCase, OperatingRoom } from '@/types/flow';
import { Clock, Plus } from 'lucide-react';

interface TimelineGanttViewProps {
  rooms: OperatingRoom[];
  patients: EpicPatientCase[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  hipaaProtected: boolean;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  rooms,
  patients,
  onSelectPatient,
  hipaaProtected
}) => {
  // Timeline hours from 07:00 to 19:00 (12 hours = 720 minutes)
  const START_HOUR = 7;
  const END_HOUR = 19;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;

  // Pixels per minute
  const PX_PER_MINUTE = 2.2;
  const TOTAL_WIDTH = TOTAL_MINUTES * PX_PER_MINUTE;

  const [currentMinutesFromStart, setCurrentMinutesFromStart] = useState<number>(0);

  useEffect(() => {
    const updateScrubber = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMins = now.getMinutes();
      const totalMins = (currentHour - START_HOUR) * 60 + currentMins;
      setCurrentMinutesFromStart(totalMins);
    };
    updateScrubber();
    const interval = setInterval(updateScrubber, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return (h - START_HOUR) * 60 + m;
  };

  const hoursArray = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 112px)',
      background: 'var(--bg-app)',
      overflow: 'hidden'
    }}>
      {/* Top Ruler Header (Sticky) */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--border-medium)',
        background: 'var(--surface-header)',
        zIndex: 20
      }}>
        {/* Left corner label */}
        <div style={{
          width: 180,
          minWidth: 180,
          padding: '10px 14px',
          borderRight: '1px solid var(--border-medium)',
          fontSize: 12,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--text-muted)'
        }}>
          ROOM / TIMELINE
        </div>

        {/* Scrollable Time Grid Axis */}
        <div style={{
          flex: 1,
          overflowX: 'hidden',
          display: 'flex',
          position: 'relative',
          height: 38
        }}>
          <div style={{ width: TOTAL_WIDTH, display: 'flex', position: 'relative' }}>
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
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    borderLeft: '1px solid var(--border-medium)'
                  }}
                >
                  {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        display: 'flex'
      }}>
        {/* Left Column: Room Names */}
        <div style={{
          width: 180,
          minWidth: 180,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                height: 64,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-light)',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)'
              }}
            >
              <span>{room.name}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 3,
                background: 'var(--surface-subtle)',
                color: 'var(--text-muted)'
              }}>
                {room.department}
              </span>
            </div>
          ))}
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
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                position: 'sticky',
                top: 2,
                left: -20,
                background: 'var(--scrubber-red)',
                color: '#fff',
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 900,
                fontFamily: 'var(--font-mono)'
              }}>
                NOW
              </div>
            </div>
          )}

          {/* Room Horizontal Rows */}
          {rooms.map((room) => {
            const roomPatients = patients.filter(p => p.roomNumber === room.name);

            return (
              <div
                key={`track-${room.id}`}
                style={{
                  height: 64,
                  position: 'relative',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {roomPatients.map((caseItem) => {
                  const startMins = Math.max(0, timeToMinutes(caseItem.inRoomTime || caseItem.scheduledStartTime));
                  const endMins = Math.min(TOTAL_MINUTES, timeToMinutes(caseItem.outRoomTime || caseItem.scheduledEndTime) || (startMins + 90));
                  const durationMins = Math.max(30, endMins - startMins);

                  const left = startMins * PX_PER_MINUTE;
                  const width = durationMins * PX_PER_MINUTE;

                  let barBg = 'var(--phase-sched-bg)';
                  if (caseItem.currentPhase === 'in_surgery') barBg = 'var(--phase-surgery-bg)';
                  else if (caseItem.currentPhase === 'closing') barBg = 'var(--phase-closing-bg)';
                  else if (caseItem.currentPhase === 'preop') barBg = 'var(--phase-preop-bg)';
                  else if (caseItem.currentPhase === 'pacu') barBg = 'var(--phase-pacu-bg)';
                  else if (caseItem.currentPhase === 'completed') barBg = 'var(--phase-complete-bg)';

                  return (
                    <div
                      key={caseItem.id}
                      onClick={() => onSelectPatient(caseItem)}
                      style={{
                        position: 'absolute',
                        left,
                        width,
                        height: 44,
                        background: barBg,
                        color: '#ffffff',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        zIndex: 5,
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transition: 'transform var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title={`${caseItem.roomNumber} - ${caseItem.patientName} (${caseItem.primaryProcedure})`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900 }}>
                        {caseItem.isAddOn && (
                          <span style={{ background: '#fff', color: 'var(--alert-red)', padding: '0 4px', borderRadius: 2, fontSize: 9, fontWeight: 900 }}>
                            +
                          </span>
                        )}
                        <span>#{caseItem.caseOrder}</span>
                        <span>{caseItem.surgeon}</span>
                        <span>•</span>
                        <span style={{ opacity: 0.9 }}>
                          {hipaaProtected ? caseItem.patientInitials : caseItem.patientName}
                        </span>
                      </div>

                      <div style={{
                        fontSize: 10,
                        fontWeight: 600,
                        opacity: 0.85,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        marginTop: 2
                      }}>
                        {caseItem.primaryProcedure}
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
  );
};
