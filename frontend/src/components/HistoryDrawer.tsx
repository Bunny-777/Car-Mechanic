'use client';

import React from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, ShieldAlert, BookOpen } from 'lucide-react';
import { Diagnosis, Booking } from '@/lib/api';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  diagnoses: Diagnosis[];
  bookings: Booking[];
  onSelectDiagnosis: (diag: Diagnosis) => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  diagnoses,
  bookings,
  onSelectDiagnosis,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 90,
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        height: '100%',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-glow)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Diagnostics & Bookings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Bookings Section */}
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 700 }}>
              Confirmed Bookings ({bookings.length})
            </h4>
            {bookings.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No appointments booked yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.map((b) => (
                  <div
                    key={b.id || b.booking_code}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.88rem' }}>
                        {b.booking_code}
                      </span>
                      <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {b.service_requested}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.preferred_date} • {b.preferred_time_slot}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnosis History Section */}
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 700 }}>
              Generated Diagnoses ({diagnoses.length})
            </h4>
            {diagnoses.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No diagnostic reports generated in this session yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {diagnoses.map((diag, index) => (
                  <div
                    key={diag.id || index}
                    onClick={() => {
                      onSelectDiagnosis(diag);
                      onClose();
                    }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'border 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-amber)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Report #{diagnoses.length - index}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: diag.severity === 'CRITICAL' ? '#ef4444' :
                               diag.severity === 'HIGH' ? '#f97316' :
                               diag.severity === 'MEDIUM' ? 'var(--accent-amber)' : '#10b981'
                      }}>
                        {diag.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {diag.issue_title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {diag.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
