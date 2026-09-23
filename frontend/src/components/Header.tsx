'use client';

import React, { useState } from 'react';
import { Wrench, Car, Clock, RotateCcw, ChevronDown } from 'lucide-react';
import { VehicleInfo } from '@/lib/api';

interface HeaderProps {
  vehicle: VehicleInfo;
  onUpdateVehicle: (v: VehicleInfo) => void;
  onNewSession: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export default function Header({
  vehicle,
  onUpdateVehicle,
  onNewSession,
  onOpenHistory,
  historyCount,
}: HeaderProps) {
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [year, setYear] = useState(vehicle.year || '');
  const [make, setMake] = useState(vehicle.make || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [mileage, setMileage] = useState(vehicle.mileage || '');

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVehicle({ year, make, model, mileage });
    setShowVehicleModal(false);
  };

  const vehicleDisplay = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 1.5rem'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)'
          }}>
            <Wrench size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                APEX MECHANIC <span style={{ color: 'var(--accent-amber)' }}>AI</span>
              </h1>
              <div className="pulse-dot" title="Virtual Master Tech Online" />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ASE Master Certified • AI Diagnostics • Real-Time Repair Estimates
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Vehicle Info Badge / Trigger */}
          <button
            onClick={() => setShowVehicleModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: '#fff',
              fontSize: '0.82rem',
              transition: 'all 0.2s',
            }}
            title="Configure Active Vehicle"
          >
            <Car size={16} color="var(--accent-amber)" />
            <span>{vehicleDisplay || 'Select Vehicle'}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: '#fff',
              fontSize: '0.82rem',
            }}
          >
            <Clock size={15} color="var(--accent-blue)" />
            <span>History</span>
            {historyCount > 0 && (
              <span style={{
                background: 'var(--accent-blue)',
                color: '#000',
                borderRadius: '50%',
                fontSize: '0.7rem',
                fontWeight: 700,
                width: 18,
                height: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {historyCount}
              </span>
            )}
          </button>

          {/* New Diagnostic Reset */}
          <button
            onClick={onNewSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-full)',
              color: '#fca5a5',
              fontSize: '0.82rem',
            }}
            title="Start new troubleshooting session"
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Vehicle Config Modal */}
      {showVehicleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 440,
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Car color="var(--accent-amber)" size={20} />
              Set Vehicle Details
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Specifying your car helps the technician pinpoint model-specific service bulletins and parts.
            </p>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2019"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Make</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Civic EX"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Current Mileage</label>
                <input
                  type="text"
                  placeholder="e.g. 65,000 miles"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'var(--accent-amber)',
                    color: '#000',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
