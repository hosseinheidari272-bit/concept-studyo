import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatThread, ChatAttachment } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { apiFetch as fetch } from '../utils/offlineApiBridge';
import {
  CHAT_ACCEPT_TYPES,
  ChatMessageAttachments,
  PendingAttachmentsPreview,
  VoiceRecorderButton,
  uploadChatAttachmentFile,
} from './ChatAttachmentView';

interface UserChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  initialOrderTitle?: string;
}

export const UserChatModal: React.FC<UserChatModalProps> = ({
  isOpen,
  onClose,
  initialOrderId,
  initialOrderTitle,
}) => {
  const { user, token, openAuthModal } = useAuth();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // حالت فرم درخواست جدید
  const [isNewRequestMode, setIsNewRequestMode] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState(user?.fullName || '');
  const [newCustomerContact, setNewCustomerContact] = useState(user?.phone || '');
  const [newSubject, setNewSubject] = useState(
    initialOrderId ? `پیگیری سفارش ${initialOrderId}` : ''
  );
  const [newMessageText, setNewMessageText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newReqFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const prevThreadIdRef = useRef<string | null>(null);
  const prevMessagesCountRef = useRef<number>(0);

  // آپلود فایل تصویر، ویدیو، ویس یا فایل پروژه به سرور
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    e.target.value = '';

    setIsUploadingMedia(true);
    setErrorMsg('');

    try {
      const result = await uploadChatAttachmentFile(file, token);
      if (result.attachment) {
        setPendingAttachments((prev) => [...prev, result.attachment!]);
      } else if (result.error) {
        setErrorMsg(result.error);
      }
    } catch {
      setErrorMsg('خطا در بارگذاری فایل پیوست');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // واکشی لیست گفت‌وگوها
  const fetchThreads = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/chat/threads';
      if (!token && user?.phone) {
        url += `?contact=${encodeURIComponent(user.phone)}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const freshThreads: ChatThread[] = data.threads || [];
        setThreads(freshThreads);

        // اگر گفت‌وگویی انتخاب شده بود، بررسی شود که حتماً متعلق به این کاربر باشد
        if (selectedThread) {
          const updated = freshThreads.find((t) => t.id === selectedThread.id);
          if (updated) {
            // تنها در صورتی که تغییری در تعداد پیام‌ها یا وضعیت رخ داده باشد آپدیت شود
            setSelectedThread((prev) => {
              if (
                prev &&
                prev.id === updated.id &&
                prev.status === updated.status &&
                prev.messages.length === updated.messages.length &&
                prev.updatedAt === updated.updatedAt
              ) {
                return prev;
              }
              return updated;
            });
          } else {
            // گفت‌وگو در لیست این کاربر وجود ندارد (جلوگیری از نشت اطلاعات)
            setSelectedThread(null);
          }
        }
      }
    } catch {
      // خطا در بارگذاری آرام نادیده گرفته می‌شود
    }
  };

  // همگام‌سازی و ریست کامل داده‌ها به محض تغییر کاربر یا باز شدن مدال
  useEffect(() => {
    if (isOpen) {
      setSelectedThread(null);
      setIsNewRequestMode(Boolean(initialOrderId));
      setErrorMsg('');
      setNewCustomerName(user?.fullName || '');
      setNewCustomerContact(user?.phone || '');
      setNewSubject(
        initialOrderId ? `پیگیری سفارش کد ${initialOrderId} - ${initialOrderTitle || ''}` : ''
      );
      fetchThreads();
    } else {
      setSelectedThread(null);
      setIsNewRequestMode(false);
    }
  }, [isOpen, user?.id, user?.username, initialOrderId]);

  // پولینگ خودکار هر ۳.۵ ثانیه وقتی چت باز است
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchThreads();
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, selectedThread?.id, user?.id]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    }
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceFromBottom <= 80;
    isNearBottomRef.current = isNear;
    setShowScrollBottomBtn(!isNear);
  };

  // اسکرول هوشمند به انتهای پیام‌ها
  useEffect(() => {
    if (!selectedThread) {
      prevThreadIdRef.current = null;
      prevMessagesCountRef.current = 0;
      return;
    }

    const currentCount = selectedThread.messages.length;
    const isThreadSwitched = selectedThread.id !== prevThreadIdRef.current;

    if (isThreadSwitched) {
      prevThreadIdRef.current = selectedThread.id;
      prevMessagesCountRef.current = currentCount;
      isNearBottomRef.current = true;
      setShowScrollBottomBtn(false);
      const timer = setTimeout(() => scrollToBottom('auto'), 50);
      return () => clearTimeout(timer);
    }

    if (currentCount > prevMessagesCountRef.current) {
      prevMessagesCountRef.current = currentCount;
      if (isNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    }
  }, [selectedThread?.id, selectedThread?.messages.length]);

  // باز کردن گفت‌وگو و خواندن پیام‌ها
  const handleSelectThread = async (thread: ChatThread) => {
    setSelectedThread(thread);
    setIsNewRequestMode(false);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/chat/threads/${thread.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedThread(data.thread);
        fetchThreads();
      } else if (res.status === 403) {
        // عدم دسترسی
        setSelectedThread(null);
        setErrorMsg('شما دسترسی به این گفت‌وگو را ندارید');
      }
    } catch {
      // نادیده گرفتن
    }
  };

  // ارسال پیام جدید در گفت‌وگوی جاری
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || (!replyText.trim() && pendingAttachments.length === 0) || isSending) return;

    setIsSending(true);
    setErrorMsg('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/chat/threads/${selectedThread.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: replyText.trim(),
          attachments: pendingAttachments,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedThread(data.thread);
        setReplyText('');
        setPendingAttachments([]);
        isNearBottomRef.current = true;
        setShowScrollBottomBtn(false);
        fetchThreads();
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'خطا در ارسال پیام');
      }
    } catch {
      setErrorMsg('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsSending(false);
    }
  };

  // ایجاد درخواست یا گفت‌وگوی جدید به ادمین
  const handleCreateNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newCustomerName ||
      !newCustomerContact ||
      (!newMessageText.trim() && pendingAttachments.length === 0) ||
      isSending
    ) {
      setErrorMsg('لطفاً نام، شماره تماس و متن پیام یا فایل پیوست را وارد فرمایید');
      return;
    }

    setIsSending(true);
    setErrorMsg('');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chat/threads', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: newCustomerName.trim(),
          customerContact: newCustomerContact.trim(),
          subject: newSubject.trim() || 'درخواست جدید خدمات و مشاوره',
          orderId: initialOrderId,
          orderTitle: initialOrderTitle,
          initialMessage: newMessageText.trim(),
          attachments: pendingAttachments,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsNewRequestMode(false);
        setNewMessageText('');
        setPendingAttachments([]);
        fetchThreads();
        setSelectedThread(data.thread);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'خطا در ثبت درخواست');
      }
    } catch {
      setErrorMsg('خطای غیرمنتظره در ارسال درخواست');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-chat-title"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-md p-2 sm:p-4 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-3xl bg-[#090D16] border border-cyan-500/30 shadow-[0_20px_70px_rgba(0,180,255,0.2)] text-slate-100 m-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ۱. هدر چت */}
        <div className="p-4 sm:px-6 sm:py-4 bg-[#0D1524] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="user-chat-title" className="text-base sm:text-lg font-black text-white">
                  گفت‌وگو و ارتباط با مدیریت استودیو
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  پاسخگویی فعال
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ارسال درخواست، پیگیری مستقیم پروژه‌ها و گفت‌وگو با تیم پشتیبانی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNewRequestMode && (
              <button
                onClick={() => {
                  setIsNewRequestMode(true);
                  setSelectedThread(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>+ درخواست جدید</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="بستن پنجره گفت‌وگو"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ۲. محتوای داخلی: یا فرم درخواست جدید یا چت زنده یا لیست پیام‌ها */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col min-h-[380px] max-h-[520px]">
          {/* اعلان هویت کاربر یا ترغیب مهمان به ورود */}
          {user ? (
            <div className="mb-3 px-3.5 py-2 rounded-2xl bg-cyan-950/25 border border-cyan-500/25 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                <span>گفت‌وگوهای حساب: <strong className="text-white">{user.fullName}</strong></span>
              </span>
              <span className="font-mono text-cyan-300 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
                {user.phone || user.username}
              </span>
            </div>
          ) : (
            <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">⚠️</span>
                <span>شما وارد حساب نشده‌اید. برای تفکیک امن و ذخیره تاریخچه پیام‌ها وارد شوید:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('login');
                }}
                className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition-colors"
              >
                ورود یا ثبت‌نام
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {isNewRequestMode ? (
            /* فرم ارسال درخواست و پیام جدید */
            <form onSubmit={handleCreateNewRequest} className="space-y-4 m-auto w-full max-w-lg">
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                💡 با ثبت پیام زیر، یک رشته گفت‌وگوی مستقیم با مدیریت استودیو ایجاد خواهد شد و پاسخ مدیر سریعاً در همین صفحه و از طریق تماس/پیامک به اطلاع شما می‌رسد.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    نام و نام خانوادگی <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="مثال: علیرضا شمس"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1524] border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    شماره تماس یا آیدی تلگرام <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerContact}
                    onChange={(e) => setNewCustomerContact(e.target.value)}
                    placeholder="0912... یا @username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1524] border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  موضوع درخواست یا کد سفارش
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: سوال درباره زمان تحویل، مشاوره تیزر تبلیغاتی..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1524] border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    متن پیام، ویس یا فایل پروژه <span className="text-cyan-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <VoiceRecorderButton
                      token={token}
                      disabled={isUploadingMedia}
                      onUploaded={(att) => setPendingAttachments((prev) => [...prev, att])}
                      onError={(msg) => setErrorMsg(msg)}
                    />
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => newReqFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      <span>{isUploadingMedia ? 'در حال آپلود...' : '+ پیوست فایل / تصویر / ویدیو'}</span>
                    </button>
                  </div>
                  <input
                    ref={newReqFileInputRef}
                    type="file"
                    accept={CHAT_ACCEPT_TYPES}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <textarea
                  rows={4}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="لطفاً جزئیات سوال یا درخواست خود را بنویسید (امکان ضبط ویس مستقیم یا پیوست فایل، عکس و ویدیو فعال است)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1524] border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none resize-none transition-colors"
                />

                {/* پیش‌نمایش فایل‌ها و ویس‌های پیوست‌شده در فرم درخواست جدید */}
                <div className="mt-2.5">
                  <PendingAttachmentsPreview
                    attachments={pendingAttachments}
                    onRemove={handleRemoveAttachment}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {threads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewRequestMode(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    انصراف و مشاهده گفت‌وگوها
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSending || isUploadingMedia}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2"
                >
                  {isSending ? (
                    <span>در حال ارسال...</span>
                  ) : (
                    <>
                      <span>ارسال درخواست به مدیریت</span>
                      <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : selectedThread ? (
            /* صفحه گفت‌وگوی فعال با پیام‌ها */
            <div className="flex-1 flex flex-col justify-between">
              {/* نوار بالای گفت‌وگو */}
              <div className="mb-3 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedThread(null)}
                    title="بازگشت به لیست پیام‌ها"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>← لیست</span>
                  </button>
                  <div>
                    <h4 className="text-sm font-black text-white line-clamp-1">
                      {selectedThread.subject}
                    </h4>
                    {selectedThread.orderTitle && (
                      <p className="text-[11px] text-cyan-400">
                        مربوط به خدمت: {selectedThread.orderTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedThread.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {selectedThread.status === 'open' ? 'گفت‌وگوی باز' : 'پایان یافته'}
                  </span>
                </div>
              </div>

              {/* محفظه پیام‌ها با مدیریت هوشمند اسکرول */}
              <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden mb-3">
                <div
                  ref={messagesContainerRef}
                  data-testid="user-chat-messages-container"
                  onScroll={handleMessagesScroll}
                  onWheel={handleMessagesScroll}
                  onTouchMove={handleMessagesScroll}
                  className="flex-1 overflow-y-auto space-y-3.5 pr-1 pl-1"
                >
                  {selectedThread.messages.map((msg) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                          {isAdmin && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                          )}
                          <span className="font-bold text-slate-300">
                            {isAdmin ? 'مدیریت و پشتیبانی استودیو' : msg.senderName || 'شما'}
                          </span>
                          <span>•</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed space-y-2 ${
                            isAdmin
                              ? 'bg-[#121E33] border border-cyan-500/30 text-cyan-50 shadow-[0_4px_15px_rgba(0,180,255,0.08)] rounded-tr-none'
                              : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          {msg.attachments && msg.attachments.length > 0 && (
                            <ChatMessageAttachments
                              attachments={msg.attachments}
                              onPreviewImage={(url) => setPreviewImageUrl(url)}
                              isDarkBubble={true}
                            />
                          )}
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollBottomBtn && (
                  <button
                    type="button"
                    onClick={() => {
                      isNearBottomRef.current = true;
                      setShowScrollBottomBtn(false);
                      scrollToBottom('smooth');
                    }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur flex items-center gap-1.5 transition-all z-10 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 animate-bounce text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span>مشاهده پیام‌های جدید</span>
                  </button>
                )}
              </div>

              {/* کادر ارسال پاسخ همراه با دکمه ضبط ویس و پیوست فایل/تصویر/ویدیو */}
              {selectedThread.status === 'open' ? (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <PendingAttachmentsPreview
                    attachments={pendingAttachments}
                    onRemove={handleRemoveAttachment}
                  />

                  <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={CHAT_ACCEPT_TYPES}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => fileInputRef.current?.click()}
                      title="ارسال فایل، تصویر یا ویدیو"
                      aria-label="ارسال فایل، تصویر یا ویدیو"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isUploadingMedia ? (
                        <span className="w-5 h-5 block border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      )}
                    </button>

                    <VoiceRecorderButton
                      token={token}
                      disabled={isUploadingMedia}
                      onUploaded={(att) => setPendingAttachments((prev) => [...prev, att])}
                      onError={(msg) => setErrorMsg(msg)}
                    />

                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پیام بنویسید یا ویس و فایل ارسال کنید..."
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#0D1524] border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isSending || isUploadingMedia || (!replyText.trim() && pendingAttachments.length === 0)}
                      className="px-4 sm:px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <span>ارسال</span>
                      <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-3 text-center rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  این گفت‌وگو توسط مدیریت به عنوان پایان‌یافته علامت‌گذاری شده است. برای طرح موضوع جدید، درخواست جدید ثبت نمایید.
                </div>
              )}
            </div>
          ) : (
            /* لیست گفت‌وگوها */
            <div>
              {threads.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1.5">
                    {user
                      ? `سلام ${user.fullName} عزیز، هنوز گفت‌وگویی ثبت نکرده‌اید`
                      : 'هنوز گفت‌وگویی ثبت نشده است'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                    {user
                      ? 'می‌توانید همین حالا پیام، سوال فنی یا درخواست اختصاصی خود را مستقیماً برای مدیریت استودیو ارسال کنید.'
                      : 'برای پیگیری سفارشات و ارسال درخواست جدید، پیام خود را مستقیماً برای مدیریت استودیو ارسال کنید.'}
                  </p>
                  <button
                    onClick={() => setIsNewRequestMode(true)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] active:scale-95"
                  >
                    + ارسال اولین پیام / درخواست به مدیریت
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">
                      گفت‌وگوهای ثبت‌شده شما ({toPersianDigits(threads.length)})
                    </span>
                    <button
                      onClick={() => setIsNewRequestMode(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      + ارسال درخواست جدید
                    </button>
                  </div>

                  {threads.map((thread) => {
                    const lastMsg = thread.messages[thread.messages.length - 1];
                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleSelectThread(thread)}
                        className="p-3.5 rounded-2xl bg-[#0D1524] hover:bg-[#121E33] border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-300 flex items-center justify-center shrink-0 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-1">
                                {thread.subject}
                              </h5>
                              {thread.unreadByUser > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 animate-pulse">
                                  {toPersianDigits(thread.unreadByUser)} جدید
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : 'بدون پیام'}
                            </p>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-500 block mb-1">
                            {new Date(thread.updatedAt).toLocaleDateString('fa-IR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-xs text-cyan-400 group-hover:translate-x-[-3px] transition-transform inline-block">
                            مشاهده ←
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* لایت‌باکس بزرگ‌نمایی تصویر در چت */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img
            src={previewImageUrl}
            alt="پیش‌نمایش"
            className="max-w-full max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-5 left-5 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
