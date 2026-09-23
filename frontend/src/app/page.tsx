'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MediaUploader from '@/components/MediaUploader';
import DiagnosisCard from '@/components/DiagnosisCard';
import BookingModal from '@/components/BookingModal';
import HistoryDrawer from '@/components/HistoryDrawer';
import {
  ChatMessage,
  UploadedMedia,
  Diagnosis,
  Booking,
  VehicleInfo,
  sendChatMessage,
  requestDiagnosis
} from '@/lib/api';
import { Send, Wrench, Sparkles, AlertCircle, FileText, ArrowRight } from 'lucide-react';

const QUICK_PROMPTS = [
  "My front brakes are squealing when stopping",
  "Engine rapidly clicking when turning key, won't start",
  "Steam from under the hood and temperature gauge is in the red",
  "Check engine light is flashing and the car is shaking at idle",
];

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

  // Modals / Drawers
  const [bookingDiagnosis, setBookingDiagnosis] = useState<Diagnosis | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session or set default welcome message
  useEffect(() => {
    const savedSession = localStorage.getItem('mechanic_session_id');
    if (savedSession) {
      setSessionId(savedSession);
    }

    // Default senior mechanic welcome
    setMessages([
      {
        id: 'welcome-msg',
        session: savedSession || '',
        sender: 'mechanic',
        message:
          "Hello! I'm Mac, your senior automotive technician. What car are you working on today?\n\n" +
          "Describe any unusual symptoms—grinding brakes, fluid leaks, no-start condition, or dashboard warnings. " +
          "You can also upload photos, record engine sound, or attach a video clip anytime.",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, diagnoses, isSending]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !attachedMedia) return;

    const currentMedia = attachedMedia;
    setInputText('');
    setAttachedMedia(null);
    setIsSending(true);

    // Optimistic user message preview
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session: sessionId || '',
      sender: 'user',
      message: textToSend || `[Attached ${currentMedia?.file_type}]`,
      media_detail: currentMedia || undefined,
      is_ai_generated: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage(
        sessionId,
        textToSend,
        currentMedia?.id,
        vehicle
      );

      // Save session id
      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
        localStorage.setItem('mechanic_session_id', response.session_id);
      }

      // Update vehicle if returned
      if (response.vehicle_info) {
        setVehicle((prev) => ({
          ...prev,
          make: response.vehicle_info.make || prev.make,
          model: response.vehicle_info.model || prev.model,
          year: response.vehicle_info.year || prev.year,
          mileage: response.vehicle_info.mileage || prev.mileage,
        }));
      }

      // Replace or append mechanic response
      setMessages((prev) => [...prev, response.mechanic_message]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          session: sessionId || '',
          sender: 'mechanic',
          message: `⚠️ Connection notice: ${err.message || 'Could not reach mechanic service. Please try again.'}`,
          is_ai_generated: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateDiagnosis = async () => {
    if (!sessionId && messages.length <= 1) {
      alert("Please discuss your vehicle symptoms with the mechanic first.");
      return;
    }

    try {
      setIsDiagnosing(true);
      const activeSession = sessionId || 'new-session';
      const diagnosis = await requestDiagnosis(activeSession);
      setDiagnoses((prev) => [diagnosis, ...prev]);

      // Add a message into the feed linking to the diagnosis
      const diagNoticeMsg: ChatMessage = {
        id: `diag-notice-${Date.now()}`,
        session: activeSession,
        sender: 'mechanic',
        message: `📋 I've synthesized a complete diagnostic report for your vehicle below based on our troubleshooting session. Review the findings and click 'Book Certified Mechanic' whenever you're ready to schedule repair service.`,
        is_ai_generated: diagnosis.ai_generated,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, diagNoticeMsg]);
    } catch (err: any) {
      alert(err.message || 'Failed to synthesize diagnosis.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleNewSession = () => {
    localStorage.removeItem('mechanic_session_id');
    setSessionId(null);
    setAttachedMedia(null);
    setDiagnoses([]);
    setVehicle({ year: '', make: '', model: '', mileage: '' });
    setMessages([
      {
        id: 'new-welcome',
        session: '',
        sender: 'mechanic',
        message: "New diagnostic bay initialized. What vehicle trouble can I troubleshoot for you?",
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleBookClick = (diag: Diagnosis) => {
    setBookingDiagnosis(diag);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const vehicleSummary = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header
        vehicle={vehicle}
        onUpdateVehicle={(v) => setVehicle(v)}
        onNewSession={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={diagnoses.length + bookings.length}
      />

      {/* Main Layout Container */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Chat Feed Column */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 960,
          margin: '0 auto',
          width: '100%',
          padding: '1rem',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Scrollable Conversation Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            paddingBottom: '1rem',
          }}>
            {/* Quick Symptom Chips on Start */}
            {messages.length <= 1 && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                margin: '0.5rem 0',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Common Diagnostic Starters
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.85rem 0' }}>
                  Click a common issue below or type your custom vehicle symptoms:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-glow)',
                        borderRadius: 'var(--radius-full)',
                        color: '#cbd5e1',
                        fontSize: '0.8rem',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-amber)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-glow)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Sender Tag */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0 0.5rem'
                  }}>
                    {!isUser && <Wrench size={12} color="var(--accent-amber)" />}
                    <span>{isUser ? 'You' : 'Senior Mechanic'}</span>
                    {!isUser && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: msg.is_ai_generated ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: msg.is_ai_generated ? '#38bdf8' : '#10b981',
                        border: `1px solid ${msg.is_ai_generated ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {msg.is_ai_generated ? 'Multimodal AI' : 'Deterministic Tech'}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '0.85rem 1.15rem',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isUser ? 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)' : 'var(--bg-card)',
                      border: `1px solid ${isUser ? '#2563eb' : 'var(--border-subtle)'}`,
                      color: '#fff',
                      fontSize: '0.92rem',
                      lineHeight: 1.55,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.message}

                    {/* Media Attachments Preview inside bubble */}
                    {msg.media_detail && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {msg.media_detail.file_type === 'image' && (
                          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: 360 }}>
                            <img
                              src={msg.media_detail.file_url}
                              alt={msg.media_detail.original_name}
                              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 280, objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        {msg.media_detail.file_type === 'audio' && (
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                            <audio controls src={msg.media_detail.file_url} style={{ width: '100%', height: 36 }} />
                          </div>
                        )}
                        {msg.media_detail.file_type === 'video' && (
                          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: 360 }}>
                            <video controls src={msg.media_detail.file_url} style={{ width: '100%', maxHeight: 260 }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* In-Chat Diagnosis Cards */}
            {diagnoses.length > 0 && (
              <div>
                <DiagnosisCard
                  diagnosis={diagnoses[0]}
                  onBookClick={handleBookClick}
                />
              </div>
            )}

            {/* Typing Indicator */}
            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Wrench size={16} className="animate-spin" style={{ color: 'var(--accent-amber)' }} />
                <span>Senior mechanic analyzing symptoms...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Diagnosis Synthesis CTA Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            marginBottom: '0.65rem',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Have you described the full symptoms?
              </span>
            </div>
            <button
              onClick={handleGenerateDiagnosis}
              disabled={isDiagnosing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                background: 'var(--accent-amber)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Sparkles size={14} />
              <span>{isDiagnosing ? 'Synthesizing...' : 'Generate Full Diagnostic Report'}</span>
            </button>
          </div>

          {/* Interactive Chat Input Area */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            {/* Media Uploader Actions */}
            <MediaUploader
              sessionId={sessionId}
              onMediaUploaded={(media) => setAttachedMedia(media)}
              attachedMedia={attachedMedia}
              onRemoveMedia={() => setAttachedMedia(null)}
              disabled={isSending}
            />

            {/* Input Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  attachedMedia
                    ? `Describe where this ${attachedMedia.file_type} was taken or how it behaves...`
                    : "Describe the car sound, warning light, or mechanical issue..."
                }
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isSending || (!inputText.trim() && !attachedMedia)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: isSending || (!inputText.trim() && !attachedMedia)
                    ? 'var(--bg-card)'
                    : 'var(--accent-amber)',
                  color: isSending || (!inputText.trim() && !attachedMedia)
                    ? 'var(--text-dim)'
                    : '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0
                }}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          diagnosis={bookingDiagnosis}
          sessionId={sessionId}
          vehicleInfo={vehicleSummary}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Diagnosis & Booking History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        diagnoses={diagnoses}
        bookings={bookings}
        onSelectDiagnosis={(diag) => {
          setBookingDiagnosis(diag);
        }}
      />
    </div>
  );
}
