'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Calendar, DollarSign, Wrench } from 'lucide-react';
import { Diagnosis } from '@/lib/api';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  onBookClick: (diagnosis: Diagnosis) => void;
}

export default function DiagnosisCard({ diagnosis, onBookClick }: DiagnosisCardProps) {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="badge badge-critical"><ShieldAlert size={13} /> Critical Severity</span>;
      case 'HIGH':
        return <span className="badge badge-high"><AlertTriangle size={13} /> High Priority</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium"><AlertTriangle size={13} /> Medium Attention</span>;
      default:
        return <span className="badge badge-low"><CheckCircle size={13} /> Low Risk</span>;
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-glow)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      marginTop: '1rem',
      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Accent Stripe based on severity */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: diagnosis.severity === 'CRITICAL' ? '#ef4444' :
                    diagnosis.severity === 'HIGH' ? '#f97316' :
                    diagnosis.severity === 'MEDIUM' ? 'var(--accent-amber)' : '#10b981'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Official Mechanical Diagnostic Report
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
            {diagnosis.issue_title}
          </h3>
        </div>
        {getSeverityBadge(diagnosis.severity)}
      </div>

      {/* Summary */}
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
        {diagnosis.summary}
      </p>

      {/* Probable Causes */}
      {diagnosis.probable_causes && diagnosis.probable_causes.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>
            Probable Causes
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {diagnosis.probable_causes.map((cause, idx) => (
              <li key={idx} style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-amber)', lineHeight: '1.2' }}>•</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Services & Costs */}
      {diagnosis.recommended_services && diagnosis.recommended_services.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>
            Recommended Services & Estimated Costs
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {diagnosis.recommended_services.map((srv, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{srv.name}</span>
                  {srv.urgency && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      ({srv.urgency})
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center' }}>
                  {srv.estimated_cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Warning */}
      {diagnosis.safety_warning && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '3px solid #ef4444',
          padding: '0.75rem 0.85rem',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          marginBottom: '1.25rem',
          fontSize: '0.82rem',
          color: '#fca5a5',
          lineHeight: 1.4
        }}>
          <strong>Safety Advisory:</strong> {diagnosis.safety_warning}
        </div>
      )}

      {/* Footer & "Book Mechanic" CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {diagnosis.estimated_cost_range && (
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Est. Total: </span>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>{diagnosis.estimated_cost_range}</strong>
          </div>
        )}

        <button
          onClick={() => onBookClick(diagnosis)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            marginLeft: 'auto'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Calendar size={18} strokeWidth={2.5} />
          <span>Book Certified Mechanic</span>
        </button>
      </div>
    </div>
  );
}
