'use client';

import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Video, X, Loader2, StopCircle, FileAudio, FileVideo, FileImage } from 'lucide-react';
import { uploadMediaFile, UploadedMedia } from '@/lib/api';

interface MediaUploaderProps {
  sessionId: string | null;
  onMediaUploaded: (media: UploadedMedia) => void;
  attachedMedia: UploadedMedia | null;
  onRemoveMedia: () => void;
  disabled?: boolean;
}

export default function MediaUploader({
  sessionId,
  onMediaUploaded,
  attachedMedia,
  onRemoveMedia,
  disabled
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadMediaFile(file, sessionId);
      onMediaUploaded(res.media);
    } catch (err: any) {
      alert(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `engine_sound_${Date.now()}.webm`, { type: 'audio/webm' });

        try {
          setIsUploading(true);
          const res = await uploadMediaFile(file, sessionId);
          onMediaUploaded(res.media);
        } catch (err: any) {
          alert(err.message || 'Error uploading recorded audio.');
        } finally {
          setIsUploading(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone permission denied or not supported in this browser.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Media Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {/* Photo / Inspection Image Button */}
        <button
          type="button"
          disabled={disabled || isUploading || isRecording}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*';
              fileInputRef.current.click();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            transition: 'all 0.15s'
          }}
          title="Upload photo of dashboard, leak, brake pad, or engine"
        >
          <ImageIcon size={15} color="var(--accent-amber)" />
          <span>Photo</span>
        </button>

        {/* Audio Recording / Upload Button */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopAudioRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.7rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontSize: '0.78rem',
              animation: 'pulse 1.5s infinite'
            }}
          >
            <StopCircle size={15} />
            <span>Stop Recording</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={startAudioRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.7rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.78rem'
            }}
            title="Record engine knock, belt squeal, or rattle sound"
          >
            <Mic size={15} color="#38bdf8" />
            <span>Record Sound</span>
          </button>
        )}

        {/* Video Upload Button */}
        <button
          type="button"
          disabled={disabled || isUploading || isRecording}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'video/*';
              fileInputRef.current.click();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '0.78rem'
          }}
          title="Upload short video of smoke, wobble, or leak"
        >
          <Video size={15} color="#a855f7" />
          <span>Video</span>
        </button>

        {isUploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
            <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {/* Attached Media Pill */}
      {attachedMedia && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.35rem 0.75rem',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: '#fef08a',
          maxWidth: '100%',
          width: 'fit-content'
        }}>
          {attachedMedia.file_type === 'image' && <FileImage size={16} color="var(--accent-amber)" />}
          {attachedMedia.file_type === 'audio' && <FileAudio size={16} color="#38bdf8" />}
          {attachedMedia.file_type === 'video' && <FileVideo size={16} color="#a855f7" />}
          <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {attachedMedia.original_name} ({formatSize(attachedMedia.file_size)})
          </span>
          <button
            type="button"
            onClick={onRemoveMedia}
            style={{ color: '#f87171', display: 'flex', alignItems: 'center' }}
            title="Remove attachment"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
