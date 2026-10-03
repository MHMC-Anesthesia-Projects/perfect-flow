'use client';

import React, { useState, useEffect } from 'react';
import { EpicPatientCase, OperatingRoom } from '@/types/flow';
import { Clock, Plus, AlertTriangle } from 'lucide-react';

interface TimelineGanttViewProps {
  rooms: OperatingRoom[];
  patients: EpicPatientCase[];
  onSelectPatient: (patient: EpicPatientCase) => void;
  hipaaProtected: boolean;
  minTurnoverMinutes?: number;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  rooms,
  patients,
  onSelectPatient,
  hipaaProtected,
  minTurnoverMinutes = 15
}) => {
  const START_HOUR = 7;
  const END_HOUR = 19;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;

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

            // Sort cases by start time to evaluate consecutive turnover buffers
            const sortedCases = [...roomPatients].sort((a, b) => {
              const aStart = timeToMinutes(a.inRoomTime || a.schedInRoom || a.scheduledStartTime);
              const bStart = timeToMinutes(b.inRoomTime || b.schedInRoom || b.scheduledStartTime);
              return aStart - bStart;
            });

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
                {sortedCases.map((caseItem, idx) => {
                  const startMins = Math.max(0, timeToMinutes(caseItem.inRoomTime || caseItem.schedInRoom || caseItem.scheduledStartTime));
                  const endMins = Math.min(TOTAL_MINUTES, timeToMinutes(caseItem.outRoomTime || caseItem.schedOutRoom || caseItem.scheduledEndTime) || (startMins + 90));
                  const durationMins = Math.max(30, endMins - startMins);

                  const left = startMins * PX_PER_MINUTE;
                  const width = durationMins * PX_PER_MINUTE;

                  // Check turnover buffer with next case
                  let turnoverWarning: string | null = null;
                  let turnoverConflictLeft = 0;
                  let turnoverConflictWidth = 0;

                  if (idx < sortedCases.length - 1) {
                    const nextCase = sortedCases[idx + 1];
                    const nextStartMins = Math.max(0, timeToMinutes(nextCase.inRoomTime || nextCase.schedInRoom || nextCase.scheduledStartTime));
                    const bufferMins = nextStartMins - endMins;

                    if (bufferMins < minTurnoverMinutes) {
                      turnoverWarning = bufferMins < 0 
                        ? `OVERLAP CONFLICT: Overlaps by ${Math.abs(bufferMins)}m!`
                        : `TIGHT TURNOVER: ${bufferMins}m buffer (<${minTurnoverMinutes}m required)`;
                      
                      turnoverConflictLeft = endMins * PX_PER_MINUTE;
                      turnoverConflictWidth = Math.max(16, (nextStartMins - endMins) * PX_PER_MINUTE);
                    }
                  }

                  let barBg = 'var(--phase-sched-bg)';
                  if (caseItem.currentPhase === 'in_surgery') barBg = 'var(--phase-surgery-bg)';
                  else if (caseItem.currentPhase === 'closing') barBg = 'var(--phase-closing-bg)';
                  else if (caseItem.currentPhase === 'preop') barBg = 'var(--phase-preop-bg)';
                  else if (caseItem.currentPhase === 'pacu') barBg = 'var(--phase-pacu-bg)';
                  else if (caseItem.currentPhase === 'completed') barBg = 'var(--phase-complete-bg)';

                  return (
                    <React.Fragment key={caseItem.id}>
                      <div
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

                      {/* Hatched Red Turnover Warning Strip between cases */}
                      {turnoverWarning && (
                        <div
                          style={{
                            position: 'absolute',
                            left: turnoverConflictLeft,
                            width: Math.max(20, turnoverConflictWidth),
                            height: 24,
                            background: 'repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.4), rgba(220, 38, 38, 0.4) 6px, rgba(220, 38, 38, 0.8) 6px, rgba(220, 38, 38, 0.8) 12px)',
                            border: '1px solid var(--alert-red)',
                            borderRadius: 3,
                            zIndex: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help'
                          }}
                          title={turnoverWarning}
                        >
                          <AlertTriangle size={12} color="#ffffff" />
                        </div>
                      )}
                    </React.Fragment>
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
