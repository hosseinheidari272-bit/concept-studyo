import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { hashPassword } from './authUtils.ts';
import { studioServices } from '../src/data/services.ts';

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'client';
  notes?: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription?: string;
  category: string;
  tags: string[];
  startingPrice: number;
  deliveryTime: string;
  popular?: boolean;
  deliverables: string[];
  discountPercent?: number; // درصد تخفیف شگفت‌انگیز
  isActive?: boolean; // فعال/غیرفعال بودن خدمت در سایت
  featuredTag?: string; // برچسب ویژه ادمین
}

export interface OrderRecord {
  id: string;
  trackingCode: string;
  serviceId: string;
  serviceTitle: string;
  customerName: string;
  customerContact: string;
  urgency: 'normal' | 'express' | 'vip';
  calculatedPrice: number;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  adminNote?: string; // یادداشت داخلی مدیر برای پیگیری
  deliveryLink?: string; // لینک تحویل فایل نهایی به مشتری
  userId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'client';
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  senderRole: 'admin' | 'user';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatThreadRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerContact: string;
  subject: string;
  orderId?: string;
  orderTitle?: string;
  status: 'open' | 'closed';
  unreadByAdmin: number;
  unreadByUser: number;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
}

export interface DatabaseSchema {
  users: UserRecord[];
  services: ServiceRecord[];
  orders: OrderRecord[];
  sessions: SessionRecord[];
  threads: ChatThreadRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Storage {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.initDatabase();
  }

  private initDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // اطمینان از وجود ادمین پیش‌فرض
        if (!parsed.users || !parsed.users.some((u: UserRecord) => u.username === 'admin')) {
          const { hash, salt } = hashPassword('admin123');
          parsed.users = parsed.users || [];
          parsed.users.unshift({
            id: 'admin-root',
            username: 'admin',
            passwordHash: hash,
            salt,
            fullName: 'مدیر استودیو',
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
        }
        if (!parsed.services || parsed.services.length === 0) {
          parsed.services = studioServices.map((s) => ({ ...s, isActive: true, discountPercent: 0 }));
        } else {
          // همگام‌سازی سرویس‌های جدید و توضیحات به‌روز با حفظ قیمت و وضعیت فعال بودن در دیتابیس
          const existingMap = new Map<string, ServiceRecord>(
            parsed.services.map((s: ServiceRecord) => [s.id, s])
          );
          parsed.services = studioServices.map((defaultSvc) => {
            const saved = existingMap.get(defaultSvc.id);
            return {
              ...defaultSvc,
              startingPrice: saved?.startingPrice !== undefined ? saved.startingPrice : defaultSvc.startingPrice,
              isActive: saved?.isActive !== undefined ? saved.isActive : true,
              discountPercent: saved?.discountPercent !== undefined ? saved.discountPercent : 0,
              featuredTag: saved?.featuredTag || defaultSvc.featuredTag,
            };
          });
        }
        parsed.orders = parsed.orders || [];
        parsed.sessions = parsed.sessions || [];
        parsed.threads = parsed.threads || [
          {
            id: 'thread_sample_1',
            customerName: 'محمدرضا کاظمی',
            customerContact: '09129876543',
            subject: 'هماهنگی تحویل ادیت ویدیوی سینمایی (کد: ۸۴۹۲۰۱)',
            orderId: 'sample-order-1',
            orderTitle: 'ساخت و ادیت ویدیوی سینمایی',
            status: 'open',
            unreadByAdmin: 0,
            unreadByUser: 1,
            createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            messages: [
              {
                id: 'msg_1',
                senderRole: 'admin',
                senderName: 'مدیر استودیو',
                text: 'سلام جناب کاظمی، نسخه اولیه تیزر شما تدوین شده و تایم‌لاین پروژه آماده بررسی است. لطفاً نظرتان را بفرمایید.',
                timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
                read: true,
              },
              {
                id: 'msg_2',
                senderRole: 'user',
                senderName: 'محمدرضا کاظمی',
                text: 'درود و خسته نباشید. تیزر فوق‌العاده شده! فقط در ثانیه ۱۵ افکت متن لوگو اگر یکم پرنورتر بشه عالیه.',
                timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
                read: true,
              },
              {
                id: 'msg_3',
                senderRole: 'admin',
                senderName: 'مدیر استودیو',
                text: 'حتماً، اصلاح نور لوگو اعمال شد و خروجی نهایی 4K با لینک مستقیم تا عصر برایتان ارسال خواهد شد.',
                timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
                read: false,
              },
            ],
          },
        ];
        return parsed;
      } catch (err) {
        console.error('Error parsing db.json, reinitializing:', err);
      }
    }

    // پایگاه داده اولیه
    const { hash, salt } = hashPassword('admin123');
    const initialData: DatabaseSchema = {
      users: [
        {
          id: 'admin-root',
          username: 'admin',
          passwordHash: hash,
          salt,
          fullName: 'مدیر ارشد استودیو',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
      ],
      services: studioServices.map((s) => ({ ...s, isActive: true, discountPercent: 0 })),
      orders: [
        {
          id: 'sample-order-1',
          trackingCode: '849201',
          serviceId: 'video-editing',
          serviceTitle: 'ساخت و ادیت ویدیوی سینمایی',
          customerName: 'محمدرضا کاظمی',
          customerContact: '09129876543',
          urgency: 'express',
          calculatedPrice: 9375000,
          description: 'تیزر معرفی محصول جدید برند پوشاک برای اینستاگرام',
          status: 'in_progress',
          adminNote: 'ادیت اولیه ۵۰٪ آماده شد و جهت بازبینی به تلگرام مشتری ارسال شد.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 'sample-order-2',
          trackingCode: '614729',
          serviceId: 'luxury-web-development',
          serviceTitle: 'طراحی سایت و لندینگ پیج اختصاصی',
          customerName: 'سارا صادقی',
          customerContact: '@sara_sadeghi',
          urgency: 'normal',
          calculatedPrice: 18000000,
          description: 'وب‌سایت اختصاصی با انیمیشن‌های سه‌بعدی و پنل ادمین',
          status: 'pending',
          adminNote: 'نیازمند تماس تلفنی برای هماهنگی دامنه و هاست.',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'sample-order-3',
          trackingCode: '932145',
          serviceId: 'photo-design',
          serviceTitle: 'طراحی عکس و کامپوزیت حرفه‌ای',
          customerName: 'امیرحسین فراهانی',
          customerContact: '09359998877',
          urgency: 'normal',
          calculatedPrice: 3800000,
          description: 'روتوش و فتومونتاژ بیلبوردی محصول آرایشی بهداشتی',
          status: 'completed',
          adminNote: 'فایل‌های لایه‌باز و JPG چاپ تحویل داده شد. تسویه کامل.',
          deliveryLink: 'https://drive.google.com/sample-delivery-pack',
          createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          completedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
      ],
      sessions: [],
      threads: [
        {
          id: 'thread_sample_1',
          customerName: 'محمدرضا کاظمی',
          customerContact: '09129876543',
          subject: 'هماهنگی تحویل ادیت ویدیوی سینمایی (کد: ۸۴۹۲۰۱)',
          orderId: 'sample-order-1',
          orderTitle: 'ساخت و ادیت ویدیوی سینمایی',
          status: 'open',
          unreadByAdmin: 0,
          unreadByUser: 1,
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          messages: [
            {
              id: 'msg_1',
              senderRole: 'admin',
              senderName: 'مدیر استودیو',
              text: 'سلام جناب کاظمی، نسخه اولیه تیزر شما تدوین شده و تایم‌لاین پروژه آماده بررسی است. لطفاً نظرتان را بفرمایید.',
              timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
              read: true,
            },
            {
              id: 'msg_2',
              senderRole: 'user',
              senderName: 'محمدرضا کاظمی',
              text: 'درود و خسته نباشید. تیزر فوق‌العاده شده! فقط در ثانیه ۱۵ افکت متن لوگو اگر یکم پرنورتر بشه عالیه.',
              timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
              read: true,
            },
            {
              id: 'msg_3',
              senderRole: 'admin',
              senderName: 'مدیر استودیو',
              text: 'حتماً، اصلاح نور لوگو اعمال شد و خروجی نهایی 4K با لینک مستقیم تا عصر برایتان ارسال خواهد شد.',
              timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
              read: false,
            },
          ],
        },
      ],
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to db.json:', err);
    }
  }

  // ۱. عملیات کاربران
  public getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  }

  public getUserByPhone(phone: string): UserRecord | undefined {
    if (!phone) return undefined;
    const clean = phone.trim();
    return this.data.users.find((u) => u.phone && u.phone.trim() === clean);
  }

  public getUserByUsernameOrPhone(identifier: string): UserRecord | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.phone && u.phone.trim() === identifier.trim())
    );
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const newUser: UserRecord = {
      ...user,
      id: 'usr_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public getAllUsers(): Omit<UserRecord, 'passwordHash' | 'salt'>[] {
    return this.data.users.map(({ passwordHash, salt, ...rest }) => rest);
  }

  public updateUserPassword(userId: string, newPassword: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.save();
    return true;
  }

  // ۲. خدمات و قیمت‌ها
  public getServices(onlyActive = false): ServiceRecord[] {
    if (onlyActive) {
      return this.data.services.filter((s) => s.isActive !== false);
    }
    return this.data.services;
  }

  public updateServicePrice(id: string, newPrice: number): ServiceRecord | null {
    const service = this.data.services.find((s) => s.id === id);
    if (!service) return null;
    service.startingPrice = newPrice;
    this.save();
    return service;
  }

  public updateService(id: string, updates: Partial<ServiceRecord>): ServiceRecord | null {
    const service = this.data.services.find((s) => s.id === id);
    if (!service) return null;
    Object.assign(service, updates);
    this.save();
    return service;
  }

  public batchUpdatePrices(percentageChange: number): ServiceRecord[] {
    this.data.services.forEach((s) => {
      const delta = (s.startingPrice * percentageChange) / 100;
      s.startingPrice = Math.max(100000, Math.round((s.startingPrice + delta) / 100000) * 100000);
    });
    this.save();
    return this.data.services;
  }

  // ۳. سفارشات
  public getOrders(statusFilter?: string): OrderRecord[] {
    let list = this.data.orders;
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): OrderRecord | undefined {
    return this.data.orders.find((o) => o.id === id || o.trackingCode === id);
  }

  public createOrder(order: Omit<OrderRecord, 'id' | 'createdAt'>): OrderRecord {
    const newOrder: OrderRecord = {
      ...order,
      id: 'ord_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public updateOrderStatus(id: string, status: OrderRecord['status']): OrderRecord | null {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date().toISOString();
    }
    this.save();
    return order;
  }

  public updateOrderAdminNote(id: string, adminNote: string, deliveryLink?: string): OrderRecord | null {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return null;
    order.adminNote = adminNote;
    if (deliveryLink !== undefined) {
      order.deliveryLink = deliveryLink;
    }
    this.save();
    return order;
  }

  public deleteOrder(id: string): boolean {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.data.orders.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ۴. نشست‌ها (Sessions)
  public createSession(user: UserRecord): SessionRecord {
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    const session: SessionRecord = {
      token,
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: new Date().toISOString(),
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public getSession(token: string): SessionRecord | undefined {
    return this.data.sessions.find((s) => s.token === token);
  }

  public deleteSession(token: string): boolean {
    const idx = this.data.sessions.findIndex((s) => s.token === token);
    if (idx !== -1) {
      this.data.sessions.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ۵. گفت‌وگوها و پیام‌های پشتیبانی (Chat & Support Threads)
  public getThreads(options?: { userId?: string; orderId?: string }): ChatThreadRecord[] {
    let list = this.data.threads || [];
    if (options?.userId) {
      list = list.filter((t) => t.userId === options.userId);
    }
    if (options?.orderId) {
      list = list.filter((t) => t.orderId === options.orderId);
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getThreadsForUser(userId: string, phone?: string): ChatThreadRecord[] {
    const cleanPhone = phone ? phone.trim().toLowerCase() : '';
    return (this.data.threads || [])
      .filter((t) => {
        if (t.userId && t.userId === userId) return true;
        if (cleanPhone && t.customerContact && t.customerContact.trim().toLowerCase() === cleanPhone) return true;
        return false;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getThreadsByContact(contact: string): ChatThreadRecord[] {
    const clean = contact.trim().toLowerCase();
    return (this.data.threads || [])
      .filter((t) => t.customerContact && t.customerContact.trim().toLowerCase() === clean)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getOrdersForUser(userId: string, phone?: string): OrderRecord[] {
    const cleanPhone = phone ? phone.trim().toLowerCase() : '';
    return this.getOrders().filter((o) => {
      if (o.userId && o.userId === userId) return true;
      if (cleanPhone && o.customerContact && o.customerContact.trim().toLowerCase() === cleanPhone) return true;
      return false;
    });
  }

  public getThreadById(id: string): ChatThreadRecord | undefined {
    return (this.data.threads || []).find((t) => t.id === id);
  }

  public createThread(params: {
    userId?: string;
    customerName: string;
    customerContact: string;
    subject: string;
    orderId?: string;
    orderTitle?: string;
    initialMessage: string;
    senderRole: 'admin' | 'user';
    senderName: string;
  }): ChatThreadRecord {
    this.data.threads = this.data.threads || [];
    const now = new Date().toISOString();
    const threadId = 'thr_' + crypto.randomUUID().slice(0, 8);
    const firstMsg: ChatMessageRecord = {
      id: 'msg_' + crypto.randomUUID().slice(0, 8),
      senderRole: params.senderRole,
      senderName: params.senderName,
      text: params.initialMessage.trim(),
      timestamp: now,
      read: false,
    };

    const newThread: ChatThreadRecord = {
      id: threadId,
      userId: params.userId,
      customerName: params.customerName.trim(),
      customerContact: params.customerContact.trim(),
      subject: params.subject.trim(),
      orderId: params.orderId,
      orderTitle: params.orderTitle,
      status: 'open',
      unreadByAdmin: params.senderRole === 'user' ? 1 : 0,
      unreadByUser: params.senderRole === 'admin' ? 1 : 0,
      createdAt: now,
      updatedAt: now,
      messages: [firstMsg],
    };

    this.data.threads.unshift(newThread);
    this.save();
    return newThread;
  }

  public addMessageToThread(
    threadId: string,
    message: { senderRole: 'admin' | 'user'; senderName: string; text: string }
  ): ChatThreadRecord | null {
    const thread = this.getThreadById(threadId);
    if (!thread) return null;

    const now = new Date().toISOString();
    const newMsg: ChatMessageRecord = {
      id: 'msg_' + crypto.randomUUID().slice(0, 8),
      senderRole: message.senderRole,
      senderName: message.senderName,
      text: message.text.trim(),
      timestamp: now,
      read: false,
    };

    thread.messages.push(newMsg);
    thread.updatedAt = now;
    if (message.senderRole === 'user') {
      thread.unreadByAdmin = (thread.unreadByAdmin || 0) + 1;
    } else {
      thread.unreadByUser = (thread.unreadByUser || 0) + 1;
    }

    this.save();
    return thread;
  }

  public markThreadRead(threadId: string, readerRole: 'admin' | 'user'): boolean {
    const thread = this.getThreadById(threadId);
    if (!thread) return false;

    if (readerRole === 'admin') {
      thread.unreadByAdmin = 0;
      thread.messages.forEach((m) => {
        if (m.senderRole === 'user') m.read = true;
      });
    } else {
      thread.unreadByUser = 0;
      thread.messages.forEach((m) => {
        if (m.senderRole === 'admin') m.read = true;
      });
    }

    this.save();
    return true;
  }

  public updateThreadStatus(threadId: string, status: 'open' | 'closed'): ChatThreadRecord | null {
    const thread = this.getThreadById(threadId);
    if (!thread) return null;
    thread.status = status;
    this.save();
    return thread;
  }

  public deleteThread(threadId: string): boolean {
    const idx = (this.data.threads || []).findIndex((t) => t.id === threadId);
    if (idx !== -1) {
      this.data.threads.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }
}

export const storage = new Storage();
