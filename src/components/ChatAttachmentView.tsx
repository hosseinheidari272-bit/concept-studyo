import React, { useState, useRef, useEffect } from 'react';
import { ChatAttachment } from '../types';
import {
  classifyAttachmentMime,
  formatFileSizeFa,
  formatDurationTimer,
} from '../utils/chatMediaUtils';
import { toPersianDigits } from '../utils/persianDate';
import { apiFetch as fetch } from '../utils/offlineApiBridge';

export const CHAT_ACCEPT_TYPES =
  'image/*,video/*,audio/*,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.psd,.ai,.txt,.csv,.json,.svg,.blend,.fbx,.obj,.glb';

interface ChatMessageAttachmentsProps {
  attachments: ChatAttachment[];
  onPreviewImage: (url: string) => void;
  isDarkBubble?: boolean;
}

export const ChatMessageAttachments: React.FC<ChatMessageAttachmentsProps> = ({
  attachments,
  onPreviewImage,
  isDarkBubble = true,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2">
      {attachments.map((att) => {
        if (att.type === 'video') {
          return (
            <div
              key={att.id}
              className="rounded-xl overflow-hidden border border-slate-700/80 bg-black"
            >
              <video
                src={att.url}
                controls
                preload="metadata"
                className="max-h-60 w-full object-contain"
              />
              <div className="px-2.5 py-1.5 bg-slate-950/90 flex items-center justify-between text-[10px] text-slate-300">
                <span className="truncate max-w-[180px]">{att.name}</span>
                <a
                  href={att.url}
                  download={att.name}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-bold shrink-0"
                >
                  دانلود ویدیو
                </a>
              </div>
            </div>
          );
        }

        if (att.type === 'audio') {
          return (
            <div
              key={att.id}
              className={`rounded-2xl p-2.5 border ${
                isDarkBubble
                  ? 'bg-slate-950/80 border-cyan-500/35 text-slate-100'
                  : 'bg-slate-900/95 border-slate-800 text-white'
              } space-y-2 min-w-[230px] sm:min-w-[260px]`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold text-cyan-300 truncate">
                      {att.name || 'پیام صوتی (ویس)'}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {att.size ? formatFileSizeFa(att.size) : 'فایل صوتی'}
                    </span>
                  </div>
                </div>
                <a
                  href={att.url}
                  download={att.name || 'voice-message.webm'}
                  target="_blank"
                  rel="noreferrer"
                  title="دانلود پیام صوتی"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors shrink-0"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              </div>
              <audio
                src={att.url}
                controls
                preload="metadata"
                className="w-full h-9 rounded-lg"
              />
            </div>
          );
        }

        if (att.type === 'file') {
          const ext = (att.name?.split('.').pop() || 'FILE').toUpperCase().slice(0, 5);
          return (
            <div
              key={att.id}
              className={`rounded-2xl p-3 border ${
                isDarkBubble
                  ? 'bg-slate-950/85 border-cyan-500/35 text-slate-100'
                  : 'bg-slate-900/95 border-slate-800 text-white'
              } flex items-center justify-between gap-3 min-w-[220px]`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 flex flex-col items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-[8px] font-black tracking-tighter uppercase">
                    {ext}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[200px]">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {att.size ? formatFileSizeFa(att.size) : 'فایل پیوست'}
                  </p>
                </div>
              </div>
              <a
                href={att.url}
                download={att.name}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>دانلود</span>
              </a>
            </div>
          );
        }

        // پیش‌فرض: تصویر
        return (
          <div
            key={att.id}
            className="rounded-xl overflow-hidden border border-slate-700/80 bg-black/40"
          >
            <img
              src={att.url}
              alt={att.name}
              onClick={() => onPreviewImage(att.url)}
              className="max-h-60 w-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
            />
          </div>
        );
      })}
    </div>
  );
};

interface PendingAttachmentsPreviewProps {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}

export const PendingAttachmentsPreview: React.FC<PendingAttachmentsPreviewProps> = ({
  attachments,
  onRemove,
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pb-1">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 p-1.5 flex items-center gap-2"
        >
          {att.type === 'image' ? (
            <img src={att.url} alt={att.name} className="w-10 h-10 object-cover rounded-lg" />
          ) : att.type === 'video' ? (
            <video src={att.url} className="w-10 h-10 object-cover rounded-lg" />
          ) : att.type === 'audio' ? (
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          )}
          <div className="max-w-[130px] text-[11px] text-slate-200 truncate">
            <span className="block truncate font-semibold">{att.name}</span>
            <span className="text-[10px] text-cyan-400">
              {att.type === 'audio'
                ? 'ویس / صوت'
                : att.type === 'video'
                ? 'ویدیو'
                : att.type === 'file'
                ? 'فایل پیوست'
                : 'تصویر'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="w-5 h-5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white text-[10px] flex items-center justify-center"
            title="حذف پیوست"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

interface VoiceRecorderButtonProps {
  token?: string | null;
  disabled?: boolean;
  onUploaded: (attachment: ChatAttachment) => void;
  onError: (msg: string) => void;
}

export const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({
  token,
  disabled,
  onUploaded,
  onError,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const shouldUploadRef = useRef<boolean>(true);

  const cleanupRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setSeconds(0);
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const getSupportedAudioMime = (): { mimeType: string; ext: string } => {
    if (typeof MediaRecorder === 'undefined') {
      return { mimeType: 'audio/webm', ext: 'webm' };
    }
    const candidates = [
      { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
      { mimeType: 'audio/webm', ext: 'webm' },
      { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
      { mimeType: 'audio/mp4', ext: 'm4a' },
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c.mimeType)) {
        return c;
      }
    }
    return { mimeType: '', ext: 'webm' };
  };

  const startRecording = async () => {
    if (disabled || isUploadingVoice) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError('مرورگر شما از ضبط مستقیم صدا پشتیبانی نمی‌کند. می‌توانید فایل صوتی را پیوست کنید.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      shouldUploadRef.current = true;

      const { mimeType, ext } = getSupportedAudioMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const recordedChunks = [...chunksRef.current];
        const shouldSend = shouldUploadRef.current;
        cleanupRecording();

        if (!shouldSend || recordedChunks.length === 0) return;

        const actualMime = (mimeType || recorder.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(recordedChunks, { type: actualMime });

        if (blob.size < 200) {
          onError('زمان ضبط ویس بسیار کوتاه بود.');
          return;
        }

        setIsUploadingVoice(true);
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Voice read error'));
            reader.readAsDataURL(blob);
          });

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const timeLabel = new Date()
            .toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            .replace(':', '-');

          const res = await fetch('/api/chat/upload', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              fileName: `ویس-${timeLabel}.${ext}`,
              mimeType: actualMime,
              dataUrl,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.attachment) {
              onUploaded(data.attachment);
            }
          } else {
            const err = await res.json().catch(() => ({}));
            onError(err.error || 'خطا در آپلود پیام صوتی');
          }
        } catch {
          onError('خطا در ارسال ویس به سرور');
        } finally {
          setIsUploadingVoice(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      cleanupRecording();
      onError('دسترسی به میکروفون امکان‌پذیر نیست. لطفاً مجوز میکروفون مرورگر را فعال کنید.');
    }
  };

  const stopAndUploadRecording = () => {
    shouldUploadRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupRecording();
    }
  };

  const cancelRecording = () => {
    shouldUploadRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupRecording();
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 shrink-0 animate-fadeIn">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-mono font-bold text-rose-300 min-w-[38px] text-center">
          {toPersianDigits(formatDurationTimer(seconds))}
        </span>
        <button
          type="button"
          onClick={stopAndUploadRecording}
          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition-colors"
          title="توقف ضبط و افزودن ویس"
        >
          تایید ویس ✓
        </button>
        <button
          type="button"
          onClick={cancelRecording}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
          title="لغو ضبط صدا"
        >
          لغو
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || isUploadingVoice}
      onClick={startRecording}
      title="ضبط پیام صوتی (ویس)"
      aria-label="ضبط پیام صوتی (ویس)"
      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 transition-colors shrink-0 disabled:opacity-50"
    >
      {isUploadingVoice ? (
        <span className="w-5 h-5 block border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      )}
    </button>
  );
};

export async function uploadChatAttachmentFile(
  file: File,
  token?: string | null
): Promise<{ attachment?: ChatAttachment; error?: string }> {
  const check = classifyAttachmentMime(file.type, file.name);
  if (!check.allowed) {
    return {
      error:
        'فرمت فایل مجاز نیست. ارسال تصویر، ویدیو، ویس و فایل‌های پروژه (PDF, ZIP, RAR, Word, Excel, PSD و...) مجاز است.',
    };
  }

  if (file.size > 30 * 1024 * 1024) {
    return {
      error: 'حداکثر حجم مجاز برای هر فایل ۳۰ مگابایت است.',
    };
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/chat/upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      dataUrl,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return { attachment: data.attachment };
  }

  const err = await res.json().catch(() => ({}));
  return { error: err.error || 'خطا در آپلود فایل پیوست' };
}
