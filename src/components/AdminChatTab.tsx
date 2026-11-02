import React, { useState, useEffect, useRef } from 'react';
import { ChatThread, ChatAttachment, UserProfile, OrderItem } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { apiFetch as fetch } from '../utils/offlineApiBridge';
import {
  CHAT_ACCEPT_TYPES,
  ChatMessageAttachments,
  PendingAttachmentsPreview,
  VoiceRecorderButton,
  uploadChatAttachmentFile,
} from './ChatAttachmentView';

interface AdminChatTabProps {
  token: string;
  users: UserProfile[];
  orders: OrderItem[];
  preSelectedOrderId?: string | null;
  preSelectedUserId?: string | null;
  onClearPreSelected?: () => void;
  showNotification: (type: 'success' | 'error', text: string) => void;
}

export const AdminChatTab: React.FC<AdminChatTabProps> = ({
  token,
  users,
  orders,
  preSelectedOrderId,
  preSelectedUserId,
  onClearPreSelected,
  showNotification,
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'orders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // دیالوگ شروع گفت‌وگوی جدید
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<'user' | 'order' | 'custom'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customContact, setCustomContact] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [initialMessageText, setInitialMessageText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const prevThreadIdRef = useRef<string | null>(null);
  const prevMessagesCountRef = useRef<number>(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = '';

    setIsUploadingMedia(true);
    try {
      const result = await uploadChatAttachmentFile(file, token);
      if (result.attachment) {
        setPendingAttachments((prev) => [...prev, result.attachment!]);
      } else if (result.error) {
        showNotification('error', result.error);
      }
    } catch {
      showNotification('error', 'خطا در بارگذاری فایل پیوست');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // واکشی گفت‌وگوها با جلوگیری از ری‌رندرهای تکراری در صورت عدم تغییر دیتا
  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/chat/threads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming: ChatThread[] = data.threads || [];
        setThreads((prev) => {
          if (prev.length === incoming.length) {
            const isIdentical = prev.every((t, i) => {
              const other = incoming[i];
              return (
                other &&
                t.id === other.id &&
                t.status === other.status &&
                t.unreadByAdmin === other.unreadByAdmin &&
                t.messages.length === other.messages.length &&
                t.updatedAt === other.updatedAt
              );
            });
            if (isIdentical) {
              return prev; // حفظ ارجاع برای جلوگیری از ری‌رندرهای بی‌مورد
            }
          }
          return incoming;
        });
      }
    } catch {
      // خطا در پس‌زمینه
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 3500);
    return () => clearInterval(interval);
  }, [token]);

  // اسکرول اختصاصی محفظه پیام‌ها (بدون تحت‌تاثیر قرار دادن اسکرول پنجره یا والد)
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    }
  };

  // تشخیص موقعیت اسکرول کاربر (اگر کاربر به بالا اسکرول کرده باشد، اسکرول خودکار قفل می‌شود)
  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // اگر فاصله از پایین کمتر از 80 پیکسل باشد کاربر در انتهای چت است
    const isNear = distanceFromBottom <= 80;
    isNearBottomRef.current = isNear;
    setShowScrollBottomBtn(!isNear);
  };

  // مدیریت هوشمند اسکرول: فقط هنگام باز شدن اولیه گفت‌وگو یا در صورت حضور کاربر در انتهای چت
  useEffect(() => {
    const currentThread = threads.find((t) => t.id === selectedThreadId);
    if (!currentThread) {
      prevThreadIdRef.current = null;
      prevMessagesCountRef.current = 0;
      return;
    }

    const currentCount = currentThread.messages.length;
    const isThreadSwitched = selectedThreadId !== prevThreadIdRef.current;

    if (isThreadSwitched) {
      // گفت‌وگوی جدید انتخاب شده است -> اسکرول قطعی به انتها
      prevThreadIdRef.current = selectedThreadId;
      prevMessagesCountRef.current = currentCount;
      isNearBottomRef.current = true;
      setShowScrollBottomBtn(false);
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
      return () => clearTimeout(timer);
    }

    // پیام جدیدی در همین گفت‌وگو دریافت شده
    if (currentCount > prevMessagesCountRef.current) {
      prevMessagesCountRef.current = currentCount;
      // اگر کاربر در حال مطالعه پیام‌های قبلی است (اسکرول به بالا)، موقعیت او مختل نشود
      if (isNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    }
    // در صورت تکرار پولینگ و عدم تغییر تعداد پیام‌ها، هیچ اسکرولی رخ نمی‌دهد
  }, [selectedThreadId, threads]);

  // اگر از تب سفارشات یا کاربران با دکمه ارسال پیام هدایت شده باشد
  useEffect(() => {
    if (preSelectedOrderId) {
      const existing = threads.find((t) => t.orderId === preSelectedOrderId);
      if (existing) {
        setSelectedThreadId(existing.id);
      } else {
        const order = orders.find((o) => o.id === preSelectedOrderId);
        if (order) {
          setNewChatType('order');
          setSelectedOrderId(order.id);
          setCustomSubject(`پیگیری سفارش کد ${order.trackingCode} - ${order.serviceTitle}`);
          setInitialMessageText(`سلام جناب ${order.customerName} عزیز، وضعیت سفارش شما (${order.serviceTitle}) بررسی شد.`);
          setIsNewChatModalOpen(true);
        }
      }
      if (onClearPreSelected) onClearPreSelected();
    } else if (preSelectedUserId) {
      const existing = threads.find((t) => t.userId === preSelectedUserId);
      if (existing) {
        setSelectedThreadId(existing.id);
      } else {
        const usr = users.find((u) => u.id === preSelectedUserId);
        if (usr) {
          setNewChatType('user');
          setSelectedUserId(usr.id);
          setCustomSubject(`پیام مدیریت استودیو به ${usr.fullName}`);
          setInitialMessageText(`درود ${usr.fullName} گرامی، از اعتماد و همراهی شما با استودیو سپاسگزاریم.`);
          setIsNewChatModalOpen(true);
        }
      }
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedOrderId, preSelectedUserId, threads]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  // انتخاب گفت‌وگو و علامت‌گذاری به عنوان خوانده‌شده
  const handleSelectThread = async (threadId: string) => {
    setSelectedThreadId(threadId);
    try {
      await fetch(`/api/chat/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchThreads();
    } catch {
      // نادیده گرفتن
    }
  };

  // ارسال پیام
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || (!replyText.trim() && pendingAttachments.length === 0) || isSending) return;

    const textToSend = replyText.trim();
    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/threads/${selectedThreadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: textToSend,
          attachments: pendingAttachments,
        }),
      });

      if (res.ok) {
        setReplyText('');
        setPendingAttachments([]);
        // هنگام ارسال پیام توسط خود ادمین، صفحه به پایین هدایت شود
        isNearBottomRef.current = true;
        setShowScrollBottomBtn(false);
        await fetchThreads();
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        showNotification('error', 'خطا در ارسال پیام');
      }
    } catch {
      showNotification('error', 'خطا در ارتباط با سرور');
    } finally {
      setIsSending(false);
    }
  };

  // ایجاد گفت‌وگوی جدید توسط ادمین
  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialMessageText.trim()) {
      showNotification('error', 'متن پیام اولیه الزامی است');
      return;
    }

    let customerName = customName.trim();
    let customerContact = customContact.trim();
    let orderId: string | undefined = undefined;
    let orderTitle: string | undefined = undefined;
    let userId: string | undefined = undefined;
    let subject = customSubject.trim() || 'پیام مدیریت استودیو';

    if (newChatType === 'user') {
      const targetUser = users.find((u) => u.id === selectedUserId) || users[0];
      if (!targetUser) {
        showNotification('error', 'لطفاً کاربر را انتخاب کنید');
        return;
      }
      customerName = targetUser.fullName;
      customerContact = targetUser.phone || targetUser.username;
      userId = targetUser.id;
      subject = customSubject.trim() || `گفت‌وگو با ${targetUser.fullName}`;
    } else if (newChatType === 'order') {
      const targetOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
      if (!targetOrder) {
        showNotification('error', 'لطفاً سفارش را انتخاب کنید');
        return;
      }
      customerName = targetOrder.customerName;
      customerContact = targetOrder.customerContact;
      orderId = targetOrder.id;
      orderTitle = targetOrder.serviceTitle;
      userId = targetOrder.userId;
      subject = customSubject.trim() || `پیگیری سفارش ${targetOrder.trackingCode}`;
    }

    if (!customerName || !customerContact) {
      showNotification('error', 'مشخصات مخاطب ناقص است');
      return;
    }

    try {
      const res = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          customerName,
          customerContact,
          subject,
          orderId,
          orderTitle,
          initialMessage: initialMessageText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification('success', 'گفت‌وگوی جدید با موفقیت ایجاد شد');
        setIsNewChatModalOpen(false);
        setInitialMessageText('');
        fetchThreads();
        setSelectedThreadId(data.thread.id);
      } else {
        showNotification('error', 'خطا در ایجاد گفت‌وگو');
      }
    } catch {
      showNotification('error', 'خطای سرور');
    }
  };

  // تغییر وضعیت باز/بسته
  const handleToggleStatus = async (threadId: string, currentStatus: 'open' | 'closed') => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/chat/threads/${threadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showNotification('success', `وضعیت گفت‌وگو به ${nextStatus === 'open' ? 'باز' : 'بسته شده'} تغییر یافت`);
        fetchThreads();
      }
    } catch {
      showNotification('error', 'خطا در تغییر وضعیت');
    }
  };

  // فیلتر گفت‌وگوها
  const filteredThreads = threads.filter((t) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'unread'
        ? t.unreadByAdmin > 0
        : Boolean(t.orderId);

    const matchesSearch =
      !searchQuery.trim() ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerContact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-[550px] overflow-hidden rounded-2xl bg-[#080C14] border border-slate-800">
      {/* ستون راست: لیست پیام‌ها و گفت‌وگوها */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-l border-slate-800 flex flex-col bg-[#0B111E]">
        {/* هدر ستون */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white">گفت‌وگوها</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {toPersianDigits(threads.length)}
            </span>
          </div>

          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-1.5"
          >
            <span>+ پیام جدید</span>
          </button>
        </div>

        {/* فیلتر و جستجو */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، شماره یا موضوع..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none"
          />

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1 rounded-lg font-bold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              همه ({toPersianDigits(threads.length)})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`flex-1 py-1 rounded-lg font-bold transition-colors ${
                activeFilter === 'unread'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              پاسخ‌نشده ({toPersianDigits(threads.filter((t) => t.unreadByAdmin > 0).length)})
            </button>
            <button
              onClick={() => setActiveFilter('orders')}
              className={`flex-1 py-1 rounded-lg font-bold transition-colors ${
                activeFilter === 'orders'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سفارشات
            </button>
          </div>
        </div>

        {/* لیست آیتم‌های گفت‌وگو */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              گفت‌وگویی یافت نشد. می‌توانید با دکمه «پیام جدید» با هر کاربر گفت‌وگو را آغاز نمایید.
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              const lastMsg = thread.messages[thread.messages.length - 1];
              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`p-3.5 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-cyan-950/40 border-r-2 border-r-cyan-400'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white line-clamp-1">
                      {thread.customerName}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(thread.updatedAt).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] text-cyan-300/80 line-clamp-1 mb-1">
                    {thread.subject}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : 'بدون پیام'}
                    </p>
                    {thread.unreadByAdmin > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-400 text-slate-950 shrink-0">
                        {toPersianDigits(thread.unreadByAdmin)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ستون چپ: پنل گفت‌وگوی انتخابی و پیام‌ها */}
      <div className="flex-1 flex flex-col bg-[#070A10] overflow-hidden">
        {selectedThread ? (
          <>
            {/* هدر گفت‌وگوی فعال */}
            <div className="p-3.5 sm:px-5 border-b border-slate-800 bg-[#0B111E] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm">
                  {selectedThread.customerName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {selectedThread.customerName}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      ({selectedThread.customerContact})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{selectedThread.subject}</span>
                    {selectedThread.orderTitle && (
                      <span className="text-cyan-400 font-bold">
                        • {selectedThread.orderTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(selectedThread.id, selectedThread.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedThread.status === 'open'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                  }`}
                >
                  {selectedThread.status === 'open' ? 'بستن گفت‌وگو' : 'بازگشایی مجدد'}
                </button>
              </div>
            </div>

            {/* بدنه پیام‌ها همراه با مدیریت هوشمند اسکرول */}
            <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
              <div
                ref={messagesContainerRef}
                data-testid="admin-chat-messages-container"
                onScroll={handleMessagesScroll}
                onWheel={handleMessagesScroll}
                onTouchMove={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
              >
                {selectedThread.messages.map((msg) => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">
                          {isAdmin ? 'شما (مدیریت استودیو)' : msg.senderName || selectedThread.customerName}
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
                        className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed space-y-2 ${
                          isAdmin
                            ? 'bg-cyan-600 text-slate-950 font-medium rounded-tl-none shadow-[0_4px_15px_rgba(0,229,255,0.15)]'
                            : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tr-none'
                        }`}
                      >
                        {msg.attachments && msg.attachments.length > 0 && (
                          <ChatMessageAttachments
                            attachments={msg.attachments}
                            onPreviewImage={(url) => setPreviewImageUrl(url)}
                            isDarkBubble={!isAdmin}
                          />
                        )}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* دکمه پرش به انتهای پیام‌ها در صورتی که کاربر به بالا اسکرول کرده باشد */}
              {showScrollBottomBtn && (
                <button
                  type="button"
                  onClick={() => {
                    isNearBottomRef.current = true;
                    setShowScrollBottomBtn(false);
                    scrollToBottom('smooth');
                  }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/95 hover:bg-slate-850 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold shadow-[0_4px_25px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-2 transition-all duration-200 z-10 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 animate-bounce text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>پرش به پیام‌های جدید</span>
                </button>
              )}
            </div>

            {/* قالب‌های پاسخ سریع */}
            <div className="px-4 py-2 border-t border-slate-800/60 bg-[#0A0F1A] flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
              <span className="text-slate-500 whitespace-nowrap font-bold">پاسخ‌های آماده:</span>
              <button
                onClick={() => setReplyText('سلام وقت بخیر، سفارش شما در حال آماده‌سازی و ادیت است و طبق زمان‌بندی تحویل خواهد شد.')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
              >
                آماده‌سازی سفارش
              </button>
              <button
                onClick={() => setReplyText('سلام، فایل نهایی آماده تحویل است. لطفاً پیش‌فاکتور را بررسی فرمایید تا لینک مستقیم ارسال گردد.')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
              >
                تحویل فایل نهایی
              </button>
              <button
                onClick={() => setReplyText('درود، اصلاحات مدنظر شما انجام شد و نسخه جدید در دسترس است.')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
              >
                اعمال اصلاحات
              </button>
            </div>

            {/* کادر ارسال پیام همراه با ضبط ویس و پیوست فایل/تصویر/ویدیو */}
            <div className="p-3 sm:p-4 bg-[#0B111E] border-t border-slate-800 space-y-2">
              <PendingAttachmentsPreview
                attachments={pendingAttachments}
                onRemove={handleRemoveAttachment}
              />

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
                  title="پیوست فایل، تصویر یا ویدیو"
                  aria-label="پیوست فایل، تصویر یا ویدیو"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors shrink-0 disabled:opacity-50"
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
                  onError={(msg) => showNotification('error', msg)}
                />

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="متن پاسخ مدیریت به مشتری (یا ارسال ویس، فایل، تصویر و ویدیو)..."
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSending || isUploadingMedia || (!replyText.trim() && pendingAttachments.length === 0)}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                >
                  <span>ارسال پاسخ</span>
                  <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              یک گفت‌وگو را از ستون راست انتخاب کنید
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              می‌توانید پیام‌های مشتریان را مشاهده نمایید یا با کلیک روی «پیام جدید» گفت‌وگو را با هر کاربر یا برای هر سفارش آغاز کنید.
            </p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,229,255,0.25)]"
            >
              + شروع گفت‌وگوی جدید با مشتری
            </button>
          </div>
        )}
      </div>

      {/* مدال شروع گفت‌وگوی جدید توسط ادمین */}
      {isNewChatModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setIsNewChatModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-slate-950 border border-cyan-500/30 p-6 text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                شروع گفت‌وگوی جدید با مشتری
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* نوع مخاطب */}
            <div className="flex rounded-xl bg-slate-900 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setNewChatType('user')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  newChatType === 'user' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                کاربران ثبت‌نامی ({toPersianDigits(users.length)})
              </button>
              <button
                type="button"
                onClick={() => setNewChatType('order')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  newChatType === 'order' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                مربوط به سفارش ({toPersianDigits(orders.length)})
              </button>
              <button
                type="button"
                onClick={() => setNewChatType('custom')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  newChatType === 'custom' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                شماره/مخاطب آزاد
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-3.5">
              {newChatType === 'user' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    انتخاب کاربر
                  </label>
                  <select
                    value={selectedUserId || (users[0]?.id || '')}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.username}) {u.phone ? `- ${u.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : newChatType === 'order' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    انتخاب سفارش
                  </label>
                  <select
                    value={selectedOrderId || (orders[0]?.id || '')}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        کد {o.trackingCode} - {o.customerName} ({o.serviceTitle})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      نام مشتری
                    </label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="نام و نام خانوادگی"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      شماره تماس / آیدی
                    </label>
                    <input
                      type="text"
                      required
                      value={customContact}
                      onChange={(e) => setCustomContact(e.target.value)}
                      placeholder="0912..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  موضوع گفت‌وگو
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="مثال: پیگیری طراحی تیزر، هماهنگی جلسه تحویل..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  پیام اولیه مدیریت به مشتری <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={initialMessageText}
                  onChange={(e) => setInitialMessageText(e.target.value)}
                  placeholder="متن پیام را بنویسید..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black"
                >
                  ایجاد و ارسال پیام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* پیش‌نمایش تمام‌صفحه تصویر در چت ادمین */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
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
