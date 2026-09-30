'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Sparkles, FileText, Mic, MicOff, Camera, Video,
  X, Car, AlertTriangle, CheckCircle, ShieldAlert,
  Wrench, CalendarDays, ChevronRight, Disc, Zap,
  Thermometer, Wind, RefreshCcw, Plus, Activity,
  ClipboardList, DollarSign, Copy, Check
} from 'lucide-react';
import {
  ChatMessage, UploadedMedia, Diagnosis, Booking,
  VehicleInfo, sendChatMessage, requestDiagnosis,
  uploadMediaFile, createBooking
} from '@/lib/api';

/* ─── Quick-start chip definitions ─── */
const CHIPS = [
  { label: 'Brakes & Rotors', icon: Disc,        q: 'My front brakes are squealing and grinding heavily when I stop' },
  { label: 'Engine / Starter', icon: Zap,         q: 'Engine won\'t start — rapid clicking when I turn the key' },
  { label: 'Overheating',      icon: Thermometer,  q: 'Temperature gauge is in the red and I see white steam from the bonnet' },
  { label: 'AC Not Cooling',   icon: Wind,         q: 'AC is blowing warm air instead of cold air at idle' },
];

/* ─── Severity helpers ─── */
const SEV_MAP: Record<string, { cls: string; color: string; label: string; bar: string }> = {
  LOW:      { cls: 'badge-low',      color: 'var(--sev-low)',  label: 'Low Risk',        bar: '#34d399' },
  MEDIUM:   { cls: 'badge-medium',   color: 'var(--sev-med)',  label: 'Medium Priority', bar: '#60a5fa' },
  HIGH:     { cls: 'badge-high',     color: 'var(--sev-high)', label: 'High Priority',   bar: '#f59e0b' },
  CRITICAL: { cls: 'badge-critical', color: 'var(--sev-crit)', label: 'Critical',        bar: '#f43f5e' },
};

/* ─── Booking Modal ─── */
function BookingModal({
  diagnosis, sessionId, vehicleInfo, onClose, onSuccess
}: {
  diagnosis: Diagnosis | null;
  sessionId: string | null;
  vehicleInfo: string;
  onClose: () => void;
  onSuccess: (b: Booking) => void;
}) {
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    preferred_date: '', preferred_time_slot: '09:00 AM - 11:00 AM',
    customer_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  const timeSlots = ['09:00 AM - 11:00 AM', '11:00 AM - 01:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email || !form.customer_phone || !form.preferred_date) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true); setError('');
    try {
      const b = await createBooking({
        ...(sessionId ? { session: sessionId } : {}),
        ...(diagnosis?.id ? { diagnosis: diagnosis.id } : {}),
        vehicle_info: vehicleInfo || 'Vehicle',
        service_requested: diagnosis?.recommended_services?.[0]?.name || 'General Inspection',
        ...form
      });
      setBooked(b);
      onSuccess(b);
    } catch (err: any) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (booked) { navigator.clipboard.writeText(booked.booking_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="sidebar-backdrop" onClick={onClose}>
      <div
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="glass animate-slide-up" style={{
          width: '100%', maxWidth: 480, borderRadius: 'var(--r-xl)',
          padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid var(--border-amber)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(245,158,11,0.1)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
                <CalendarDays size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Book Mechanic</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Schedule a workshop appointment</div>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>

          {booked ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sev-low-bg)', border: '1px solid var(--sev-low-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sev-low)', margin: '0 auto 1rem' }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Booking Confirmed!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Your appointment has been scheduled.</p>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '1rem', border: '1px solid var(--border-amber)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Reference</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em' }}>{booked.booking_code}</div>
                </div>
                <button className="btn-ghost" onClick={copyCode} style={{ flexShrink: 0 }}>
                  {copied ? <Check size={14} color="var(--sev-low)" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {booked.preferred_date} · {booked.preferred_time_slot}<br />
                <span style={{ color: 'var(--text-secondary)' }}>{vehicleInfo}</span>
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {diagnosis && (
                <div style={{ background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.2rem' }}>Booking for Diagnosis</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{diagnosis.issue_title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Est. cost: {diagnosis.estimated_cost_range}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Full Name *</label>
                  <input className="input" required value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="Your name" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Email *</label>
                  <input className="input" type="email" required value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} placeholder="email@example.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Phone *</label>
                  <input className="input" type="tel" required value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Preferred Date *</label>
                  <input className="input" type="date" required value={form.preferred_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({ ...p, preferred_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Time Slot</label>
                  <select className="input" value={form.preferred_time_slot} onChange={e => setForm(p => ({ ...p, preferred_time_slot: e.target.value }))}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Additional Notes</label>
                  <textarea className="input" rows={2} value={form.customer_notes} onChange={e => setForm(p => ({ ...p, customer_notes: e.target.value }))} placeholder="Anything else the mechanic should know..." style={{ resize: 'none' }} />
                </div>
              </div>

              {error && (
                <div style={{ background: 'var(--sev-crit-bg)', border: '1px solid var(--sev-crit-border)', borderRadius: 'var(--r-md)', padding: '0.6rem 0.9rem', fontSize: '0.82rem', color: 'var(--sev-crit)' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Booking...</> : <><CalendarDays size={15} />Confirm Appointment</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Diagnostic Sidebar ─── */
function DiagSidebar({
  diagnosis, onClose, onBook
}: { diagnosis: Diagnosis; onClose: () => void; onBook: () => void }) {
  const sev = SEV_MAP[diagnosis.severity] || SEV_MAP.MEDIUM;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${diagnosis.issue_title}\nSeverity: ${diagnosis.severity}\nEst. Cost: ${diagnosis.estimated_cost_range}\n\n${diagnosis.summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="sidebar-backdrop" onClick={onClose} />

      {/* Sidebar Panel */}
      <div className="diag-sidebar">
        {/* Top strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg, var(--amber), ${sev.color})` }} />

        {/* Header */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
              <ClipboardList size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Diagnostic Report</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{diagnosis.ai_generated ? 'AI Generated' : 'Rule-Based Analysis'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-icon" onClick={handleCopy} title="Copy report">
              {copied ? <Check size={15} color="var(--sev-low)" /> : <Copy size={15} />}
            </button>
            <button className="btn-icon" onClick={onClose} title="Close"><X size={15} /></button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Title + Severity */}
          <div>
            <span className={`badge ${sev.cls}`} style={{ marginBottom: '0.6rem' }}>{sev.label}</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.6rem' }}>{diagnosis.issue_title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{diagnosis.summary}</p>
          </div>

          {/* Urgency bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Urgency Level</span>
              <span style={{ fontSize: '0.73rem', color: sev.color, fontWeight: 700 }}>
                {diagnosis.severity === 'CRITICAL' ? '95%' : diagnosis.severity === 'HIGH' ? '75%' : diagnosis.severity === 'MEDIUM' ? '50%' : '25%'}
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--border-faint)', borderRadius: 99 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: diagnosis.severity === 'CRITICAL' ? '95%' : diagnosis.severity === 'HIGH' ? '75%' : diagnosis.severity === 'MEDIUM' ? '50%' : '25%',
                background: `linear-gradient(90deg, var(--amber), ${sev.color})`,
                boxShadow: `0 0 8px ${sev.color}60`,
                transition: 'width 0.8s ease'
              }} />
            </div>
          </div>

          {/* Safety Warning */}
          {diagnosis.safety_warning && (
            <div style={{ background: 'var(--sev-crit-bg)', border: '1px solid var(--sev-crit-border)', borderRadius: 'var(--r-md)', padding: '0.85rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="var(--sev-crit)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--sev-crit)', lineHeight: 1.5 }}>{diagnosis.safety_warning}</span>
            </div>
          )}

          {/* Probable Causes */}
          {diagnosis.probable_causes?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>Probable Causes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {diagnosis.probable_causes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.55rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-faint)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: '0.35rem' }} />
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Services */}
          {diagnosis.recommended_services?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>Recommended Services</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {diagnosis.recommended_services.map((s, i) => (
                  <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-faint)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)',
                        background: s.urgency === 'Immediate' ? 'var(--sev-crit-bg)' : s.urgency === 'Soon' ? 'var(--sev-high-bg)' : 'var(--sev-low-bg)',
                        color: s.urgency === 'Immediate' ? 'var(--sev-crit)' : s.urgency === 'Soon' ? 'var(--sev-high)' : 'var(--sev-low)',
                        border: `1px solid ${s.urgency === 'Immediate' ? 'var(--sev-crit-border)' : s.urgency === 'Soon' ? 'var(--sev-high-border)' : 'var(--sev-low-border)'}`,
                        whiteSpace: 'nowrap', flexShrink: 0
                      }}>{s.urgency}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <DollarSign size={13} color="var(--amber)" />
                      <span style={{ fontSize: '0.82rem', color: 'var(--amber)', fontWeight: 700 }}>{s.estimated_cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Cost */}
          {diagnosis.estimated_cost_range && (
            <div style={{ padding: '1rem', background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Total Estimated Cost</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--amber)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>
                {diagnosis.estimated_cost_range}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>*Estimates based on Indian market rates. Actual costs may vary.</div>
            </div>
          )}
        </div>

        {/* Footer: Book Button */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-faint)', background: 'var(--bg-base)' }}>
          <button className="btn-primary" style={{ width: '100%', padding: '0.7rem' }} onClick={onBook}>
            <CalendarDays size={16} />
            Book a Certified Mechanic
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<UploadedMedia | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo>({ year: '', make: '', model: '', mileage: '' });
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagSidebar, setDiagSidebar] = useState<Diagnosis | null>(null);
  const [bookingDiag, setBookingDiag] = useState<Diagnosis | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const diagnosingRef = useRef(false); // prevents double-trigger

  /* Welcome message */
  useEffect(() => {
    const saved = localStorage.getItem('apex_session_id');
    if (saved) setSessionId(saved);
    setMessages([{
      id: 'welcome',
      session: saved || '',
      sender: 'mechanic',
      message: "Hey, I'm Mac — your AI automotive technician. 🔧\n\nTell me about your vehicle and what symptoms you're noticing. You can describe sounds, warning lights, performance issues, or upload a photo, audio, or video. I'll diagnose the exact fault and give you a repair cost estimate.",
      is_ai_generated: false,
      created_at: new Date().toISOString()
    }]);
  }, []);

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  /* ── Send Message ── */
  const sendMessage = useCallback(async (text?: string) => {
    const msg = text ?? inputText;
    if (!msg.trim() && !attachedMedia) return;

    const media = attachedMedia;
    setInputText('');
    setAttachedMedia(null);
    setIsSending(true);

    const tempMsg: ChatMessage = {
      id: `u-${Date.now()}`, session: sessionId || '',
      sender: 'user', message: msg || `[${media?.file_type} attached]`,
      media_detail: media || undefined, is_ai_generated: false,
      created_at: new Date().toISOString()
    };
    setMessages(p => [...p, tempMsg]);

    try {
      const res = await sendChatMessage(sessionId, msg, media?.id, vehicle);
      if (!sessionId && res.session_id) {
        setSessionId(res.session_id);
        localStorage.setItem('apex_session_id', res.session_id);
      }
      if (res.vehicle_info) {
        setVehicle(p => ({
          year:    res.vehicle_info.year    || p.year,
          make:    res.vehicle_info.make    || p.make,
          model:   res.vehicle_info.model   || p.model,
          mileage: res.vehicle_info.mileage || p.mileage,
        }));
      }
      setMessages(p => [...p, res.mechanic_message]);
    } catch (err: any) {
      setMessages(p => [...p, {
        id: `e-${Date.now()}`, session: sessionId || '',
        sender: 'mechanic',
        message: `⚠ ${err.message || 'Could not reach mechanic service. Please check the backend server.'}`,
        is_ai_generated: false, created_at: new Date().toISOString()
      }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, attachedMedia, sessionId, vehicle]);

  /* ── Generate Diagnosis ── */
  const generateDiagnosis = async () => {
    // Guard against double-trigger (React StrictMode or fast double-click)
    if (diagnosingRef.current || isDiagnosing) return;
    const hasEnoughContext = messages.filter(m => m.sender === 'user').length >= 1;
    if (!sessionId && !hasEnoughContext) {
      setMessages(p => [...p, {
        id: `info-${Date.now()}`, session: '', sender: 'mechanic',
        message: 'Please describe your vehicle symptoms first. I need to understand the issue before generating a diagnosis.',
        is_ai_generated: false, created_at: new Date().toISOString()
      }]);
      return;
    }
    diagnosingRef.current = true;
    setIsDiagnosing(true);
    try {
      const diag = await requestDiagnosis(sessionId!);
      setDiagnoses(p => [diag, ...p]);
      // Don't auto-open sidebar — user opens it via the Issues Panel "Full Report" button
      setMessages(p => [...p, {
        id: `diag-${Date.now()}`, session: sessionId || '',
        sender: 'mechanic',
        message: `📋 Diagnosis complete: **${diag.issue_title}** — Estimated cost: ${diag.estimated_cost_range}. See the Issues Panel on the right for the full breakdown.`,
        is_ai_generated: diag.ai_generated, created_at: new Date().toISOString()
      }]);
    } catch (err: any) {
      setMessages(p => [...p, {
        id: `de-${Date.now()}`, session: sessionId || '',
        sender: 'mechanic',
        message: `ℹ ${err.message || 'Describe vehicle symptoms before generating a report.'}`,
        is_ai_generated: false, created_at: new Date().toISOString()
      }]);
    } finally {
      diagnosingRef.current = false;
      setIsDiagnosing(false);
    }
  };

  /* ── Audio Recording ── */
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `engine_${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        try {
          setIsUploading(true);
          const res = await uploadMediaFile(file, sessionId);
          setAttachedMedia(res.media);
        } catch (err: any) {
          alert(err.message || 'Upload failed.');
        } finally { setIsUploading(false); }
      };
      recorder.start();
      setIsRecording(true);
    } catch { alert('Microphone access denied.'); }
  };

  /* ── File Upload ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await uploadMediaFile(file, sessionId);
      setAttachedMedia(res.media);
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── New Session ── */
  const newSession = () => {
    localStorage.removeItem('apex_session_id');
    setSessionId(null);
    setMessages([{
      id: 'new-welcome', session: '', sender: 'mechanic',
      message: "New session started. What vehicle are we looking at today?",
      is_ai_generated: false, created_at: new Date().toISOString()
    }]);
    setVehicle({ year: '', make: '', model: '', mileage: '' });
    setDiagnoses([]);
    setAttachedMedia(null);
    setDiagSidebar(null);
  };

  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
  const userMessages = messages.filter(m => m.sender === 'user');
  const canDiagnose = userMessages.length >= 1 && sessionId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* ── TOP HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem', height: 56, flexShrink: 0,
        borderBottom: '1px solid var(--border-faint)',
        background: 'rgba(13,13,15,0.97)',
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--amber-dim), var(--amber))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px var(--amber-glow)'
          }}>
            <Wrench size={17} color="#0d0d0f" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Apex Mechanic</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>AI Automotive Diagnostics</div>
          </div>
        </div>

        {/* Vehicle Badge + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {vehicleLabel ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.3rem 0.8rem 0.3rem 0.6rem',
              background: 'var(--amber-subtle)',
              border: '1px solid var(--amber-border)',
              borderRadius: 'var(--r-full)',
            }}>
              <Car size={13} color="var(--amber)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--amber)' }}>{vehicleLabel}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Car size={13} /><span>No vehicle detected yet</span>
            </div>
          )}
          <button className="btn-icon" onClick={newSession} title="Start new session">
            <RefreshCcw size={14} />
          </button>
        </div>
      </header>

      {/* ── BODY: Chat (left) + Issues Panel (right) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Chat Column ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

              {/* Quick-start chips */}
              {userMessages.length === 0 && (
                <div className="glass animate-fade-in" style={{
                  borderRadius: 'var(--r-xl)', padding: '1.1rem',
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem',
                }}>
                  <div style={{ gridColumn: '1 / -1', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Common Issues — tap to start</span>
                  </div>
                  {CHIPS.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <button key={i} onClick={() => sendMessage(c.q)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.55rem',
                        padding: '0.6rem 0.8rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)',
                        borderRadius: 'var(--r-md)', color: 'var(--text-secondary)',
                        fontSize: '0.8rem', fontWeight: 500, textAlign: 'left', transition: 'all 0.18s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber-border)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--amber-subtle)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                      >
                        <Icon size={14} color="var(--amber)" style={{ flexShrink: 0 }} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.28rem', padding: '0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {!isUser && <div className="amber-dot" style={{ width: 5, height: 5 }} />}
                      <span>{isUser ? 'You' : 'Mac — Technician'}</span>
                    </div>
                    <div style={{
                      maxWidth: '82%',
                      padding: '0.75rem 1rem',
                      borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, var(--amber-dim) 0%, #92400e 100%)'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${isUser ? 'rgba(245,158,11,0.38)' : 'var(--border-faint)'}`,
                      color: isUser ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.875rem', lineHeight: 1.65,
                      boxShadow: isUser ? '0 3px 14px rgba(245,158,11,0.18)' : '0 2px 10px rgba(0,0,0,0.3)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {msg.message}
                      {msg.media_detail && (
                        <div style={{ marginTop: '0.7rem', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          {msg.media_detail.file_type === 'image' && (
                            <img src={msg.media_detail.file_url} alt={msg.media_detail.original_name}
                              style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--r-md)', display: 'block', objectFit: 'cover', maxHeight: 240 }} />
                          )}
                          {msg.media_detail.file_type === 'audio' && (
                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--amber)', marginBottom: '0.25rem', fontWeight: 600 }}>Audio Recording</div>
                              <audio controls src={msg.media_detail.file_url} style={{ width: '100%', height: 34 }} />
                            </div>
                          )}
                          {msg.media_detail.file_type === 'video' && (
                            <video controls src={msg.media_detail.file_url} style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--r-md)' }} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking dots */}
              {isSending && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.28rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div className="amber-dot" style={{ width: 5, height: 5 }} /><span>Mac — Technician</span>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)', borderRadius: '14px 14px 14px 4px' }}>
                    <div className="thinking"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Bottom input bar ── */}
          <div style={{
            borderTop: '1px solid var(--border-faint)',
            background: 'rgba(13,13,15,0.97)',
            backdropFilter: 'blur(20px)',
            padding: '0.75rem 1rem',
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {/* Attached media chip */}
              {attachedMedia && (
                <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.7rem', background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', borderRadius: 'var(--r-full)', alignSelf: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 500 }}>📎 {attachedMedia.original_name}</span>
                  <button onClick={() => setAttachedMedia(null)} style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                </div>
              )}
              {/* Input row */}
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <button className="btn-icon" onClick={() => fileInputRef.current?.click()} disabled={isSending || isUploading || isRecording} title="Upload photo or video" style={{ width: 34, height: 34 }}>
                  {isUploading ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Camera size={15} />}
                </button>
                <button className="btn-icon" onClick={toggleRecording} disabled={isSending || isUploading} title={isRecording ? 'Stop recording' : 'Record audio'} style={isRecording ? { width: 34, height: 34, borderColor: 'var(--sev-crit)', color: 'var(--sev-crit)', background: 'var(--sev-crit-bg)' } : { width: 34, height: 34 }}>
                  {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
                <input
                  ref={inputRef} className="input"
                  style={{ flex: 1, borderRadius: 'var(--r-full)', padding: '0.6rem 1.1rem', fontSize: '0.875rem' }}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={attachedMedia ? 'Add context about this file...' : 'Describe your car problem...'}
                  disabled={isSending}
                />
                {canDiagnose && (
                  <button className="btn-primary" onClick={generateDiagnosis} disabled={isDiagnosing}
                    style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                    title="Generate diagnosis with cost estimate">
                    {isDiagnosing ? <div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Sparkles size={13} />}
                    {isDiagnosing ? 'Analysing...' : 'Diagnose'}
                  </button>
                )}
                <button onClick={() => sendMessage()} disabled={isSending || (!inputText.trim() && !attachedMedia)}
                  style={{
                    width: 38, height: 38, borderRadius: 'var(--r-full)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSending || (!inputText.trim() && !attachedMedia) ? 'var(--bg-elevated)' : 'var(--amber)',
                    color: isSending || (!inputText.trim() && !attachedMedia) ? 'var(--text-dim)' : '#0d0d0f',
                    border: '1px solid ' + (isSending || (!inputText.trim() && !attachedMedia) ? 'var(--border-faint)' : 'transparent'),
                    boxShadow: isSending || (!inputText.trim() && !attachedMedia) ? 'none' : '0 0 16px var(--amber-glow)',
                    transition: 'all 0.18s',
                  }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Issues Notepad Panel ── */}
        <div style={{
          width: 300, flexShrink: 0,
          borderLeft: '1px solid var(--border-faint)',
          background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', flexShrink: 0 }}>
              <ClipboardList size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Issues Tracker</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{diagnoses.length} diagnosis{diagnoses.length !== 1 ? 'es' : ''} logged</div>
            </div>
            {diagnoses.length > 0 && (
              <div style={{ fontSize: '0.65rem', color: 'var(--amber)', background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)', borderRadius: 'var(--r-full)', padding: '2px 7px', fontWeight: 700 }}>
                {diagnoses.length}
              </div>
            )}
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.65rem' }}>
            {diagnoses.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', padding: '2rem 1rem', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>No issues logged yet</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Describe your car problem in the chat and tap <strong style={{ color: 'var(--amber)' }}>Diagnose</strong> to log issues here with cost estimates.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {diagnoses.map((diag, idx) => {
                  const sev = SEV_MAP[diag.severity] || SEV_MAP.MEDIUM;
                  return (
                    <div key={diag.id} className="animate-slide-right" style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-faint)',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                      transition: 'border-color 0.18s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--amber-border)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-faint)')}
                    >
                      {/* Severity stripe */}
                      <div style={{ height: 3, background: `linear-gradient(90deg, var(--amber), ${sev.color})` }} />

                      <div style={{ padding: '0.7rem 0.75rem' }}>
                        {/* Badge + index */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span className={`badge ${sev.cls}`} style={{ fontSize: '0.62rem' }}>{sev.label}</span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>#{diagnoses.length - idx}</span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                          {diag.issue_title}
                        </div>

                        {/* Services list with costs */}
                        {diag.recommended_services?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem', marginBottom: '0.55rem' }}>
                            {diag.recommended_services.map((s, si) => (
                              <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>{s.name}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>{s.estimated_cost}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Total cost + Full Report button */}
                        <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Est.</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{diag.estimated_cost_range}</div>
                          </div>
                          <button
                            onClick={() => setDiagSidebar(diag)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.3rem 0.6rem',
                              background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)',
                              borderRadius: 'var(--r-sm)', color: 'var(--amber)',
                              fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#0d0d0f'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--amber-subtle)'; e.currentTarget.style.color = 'var(--amber)'; }}
                          >
                            <FileText size={11} />
                            Full Report
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Book button (only if diagnoses exist) */}
          {diagnoses.length > 0 && (
            <div style={{ padding: '0.65rem', borderTop: '1px solid var(--border-faint)' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
                onClick={() => { setBookingDiag(diagnoses[0]); setShowBooking(true); }}>
                <CalendarDays size={14} />
                Book a Mechanic
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── DIAGNOSTIC DETAIL SIDEBAR ── */}
      {diagSidebar && (
        <DiagSidebar
          diagnosis={diagSidebar}
          onClose={() => setDiagSidebar(null)}
          onBook={() => {
            setBookingDiag(diagSidebar);
            setShowBooking(true);
          }}
        />
      )}

      {/* ── BOOKING MODAL ── */}
      {showBooking && (
        <BookingModal
          diagnosis={bookingDiag}
          sessionId={sessionId}
          vehicleInfo={vehicleLabel}
          onClose={() => { setShowBooking(false); setBookingDiag(null); }}
          onSuccess={b => { setBookings(p => [b, ...p]); setShowBooking(false); setBookingDiag(null); }}
        />
      )}
    </div>
  );
}
