import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { storage } from './server/storage.ts';
import { hashPassword, verifyPassword, validateRegistration, generateTrackingCode } from './server/authUtils.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// میان‌افزار احراز هویت با Bearer Token
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'احراز هویت الزامی است' });
  }
  const token = authHeader.split(' ')[1];
  const session = storage.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'نشست شما منقضی شده است' });
  }
  (req as any).user = session;
  next();
}

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی فقط برای مدیر سیستم مجاز است' });
    }
    next();
  });
}

// -----------------------------------------------------------------------------
// مسیرهای API احراز هویت (Auth API)
// -----------------------------------------------------------------------------

// ۱. ثبت نام کاربر جدید با شماره موبایل و مشخصات کامل
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, fullName, phone } = req.body;

  const validation = validateRegistration(username, password, fullName, phone);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const existingUsername = storage.getUserByUsername(username);
  if (existingUsername) {
    return res.status(409).json({ error: 'این نام کاربری قبلاً ثبت شده است' });
  }

  if (phone) {
    const existingPhone = storage.getUserByPhone(phone.trim());
    if (existingPhone) {
      return res.status(409).json({ error: 'این شماره موبایل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.' });
    }
  }

  const { hash, salt } = hashPassword(password);
  const newUser = storage.createUser({
    username: username.trim(),
    passwordHash: hash,
    salt,
    fullName: fullName.trim(),
    phone: phone ? phone.trim() : undefined,
    role: 'client',
  });

  const session = storage.createSession(newUser);
  return res.status(201).json({
    message: 'ثبت نام با موفقیت انجام شد',
    token: session.token,
    user: {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: newUser.role,
    },
  });
});

// ۲. ورود کاربر یا ادمین (پشتیبانی از نام کاربری یا شماره موبایل)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'نام کاربری/شماره موبایل و رمز عبور الزامی است' });
  }

  const user = storage.getUserByUsernameOrPhone(username);
  if (!user) {
    return res.status(404).json({
      notFound: true,
      error: 'کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت نام کنید.',
    });
  }

  const isMatch = verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    return res.status(401).json({ error: 'رمز عبور وارد شده نادرست است' });
  }

  const session = storage.createSession(user);
  return res.json({
    message: 'ورود با موفقیت انجام شد',
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    },
  });
});

// ۳. بررسی هویت کاربر جاری با بازیابی شماره موبایل
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ user: null });
  }
  const token = authHeader.split(' ')[1];
  const session = storage.getSession(token);
  if (!session) {
    return res.json({ user: null });
  }

  const userRec = storage.getUserById(session.userId);
  return res.json({
    user: {
      id: session.userId,
      username: session.username,
      fullName: session.fullName,
      phone: userRec?.phone || session.phone,
      role: session.role,
    },
  });
});

// ۴. خروج
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    storage.deleteSession(token);
  }
  return res.json({ success: true });
});

// -----------------------------------------------------------------------------
// مسیرهای خدمات و قیمت‌ها (Services API)
// -----------------------------------------------------------------------------

app.get('/api/services', (req: Request, res: Response) => {
  const onlyActive = req.query.admin !== 'true';
  const services = storage.getServices(onlyActive);
  return res.json({ services });
});

app.put('/api/services/:id/price', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPrice } = req.body;

  const priceNum = Number(newPrice);
  if (isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: 'مبلغ معتبر نیست' });
  }

  const updated = storage.updateServicePrice(id, priceNum);
  if (!updated) {
    return res.status(404).json({ error: 'خدمت مورد نظر یافت نشد' });
  }

  return res.json({
    message: 'قیمت خدمت با موفقیت بروزرسانی شد',
    service: updated,
  });
});

app.put('/api/services/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = storage.updateService(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'خدمت مورد نظر یافت نشد' });
  }

  return res.json({
    message: 'مشخصات خدمت با موفقیت بروزرسانی شد',
    service: updated,
  });
});

app.post('/api/services/batch-price', adminMiddleware, (req: Request, res: Response) => {
  const { percentChange } = req.body;
  const percent = Number(percentChange);
  if (isNaN(percent)) {
    return res.status(400).json({ error: 'درصد معتبر نیست' });
  }

  const updatedServices = storage.batchUpdatePrices(percent);
  return res.json({
    message: `قیمت تمامی خدمات با تغییر ${percent > 0 ? '+' : ''}${percent}٪ بروزرسانی شد`,
    services: updatedServices,
  });
});

// -----------------------------------------------------------------------------
// مسیرهای سفارشات (Orders API)
// -----------------------------------------------------------------------------

app.get('/api/orders', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const statusFilter = req.query.status as string | undefined;

  if (user.role === 'admin') {
    const allOrders = storage.getOrders(statusFilter);
    return res.json({ orders: allOrders });
  }

  const userRec = storage.getUserById(user.userId);
  const userOrders = storage.getOrdersForUser(user.userId, userRec?.phone || user.phone);
  const filtered = statusFilter && statusFilter !== 'all'
    ? userOrders.filter((o) => o.status === statusFilter)
    : userOrders;
  return res.json({ orders: filtered });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { serviceId, serviceTitle, customerName, customerContact, urgency, calculatedPrice, description } = req.body;

  if (!serviceId || !customerName || !customerContact) {
    return res.status(400).json({ error: 'اطلاعات ضروری سفارش ناقص است' });
  }

  let userId: string | undefined = undefined;
  let finalCustomerName = customerName.trim();
  let finalCustomerContact = customerContact.trim();

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      userId = session.userId;
      finalCustomerName = session.fullName;
      if (session.phone) {
        finalCustomerContact = session.phone;
      }
    }
  }

  const trackingCode = generateTrackingCode();
  const order = storage.createOrder({
    trackingCode,
    serviceId,
    serviceTitle: serviceTitle || 'خدمت استودیو',
    customerName: finalCustomerName,
    customerContact: finalCustomerContact,
    urgency: urgency || 'normal',
    calculatedPrice: Number(calculatedPrice) || 0,
    description: description ? description.trim() : '',
    status: 'pending',
    userId,
  });

  return res.status(201).json({
    message: 'سفارش با موفقیت ثبت و در پایگاه داده ذخیره شد',
    order,
  });
});

// ثبت سفارش دستی توسط ادمین
app.post('/api/admin/orders', adminMiddleware, (req: Request, res: Response) => {
  const { serviceId, serviceTitle, customerName, customerContact, urgency, calculatedPrice, description, status, adminNote, deliveryLink } = req.body;

  if (!serviceId || !customerName || !customerContact) {
    return res.status(400).json({ error: 'اطلاعات ضروری سفارش ناقص است' });
  }

  const trackingCode = generateTrackingCode();
  const order = storage.createOrder({
    trackingCode,
    serviceId,
    serviceTitle: serviceTitle || 'خدمت اختصاصی',
    customerName: customerName.trim(),
    customerContact: customerContact.trim(),
    urgency: urgency || 'normal',
    calculatedPrice: Number(calculatedPrice) || 0,
    description: description ? description.trim() : '',
    status: status || 'pending',
    adminNote: adminNote || '',
    deliveryLink: deliveryLink || '',
  });

  return res.status(201).json({
    message: 'سفارش دستی جدید توسط ادمین ثبت شد',
    order,
  });
});

app.patch('/api/orders/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است' });
  }

  const updated = storage.updateOrderStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'سفارش یافت نشد' });
  }

  return res.json({
    message: 'وضعیت سفارش بروزرسانی شد',
    order: updated,
  });
});

app.patch('/api/orders/:id/note', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminNote, deliveryLink } = req.body;

  const updated = storage.updateOrderAdminNote(id, adminNote || '', deliveryLink);
  if (!updated) {
    return res.status(404).json({ error: 'سفارش یافت نشد' });
  }

  return res.json({
    message: 'یادداشت و لینک تحویل سفارش ذخیره شد',
    order: updated,
  });
});

app.delete('/api/orders/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = storage.deleteOrder(id);
  if (!deleted) {
    return res.status(404).json({ error: 'سفارش یافت نشد' });
  }
  return res.json({ message: 'سفارش با موفقیت حذف گردید' });
});

// -----------------------------------------------------------------------------
// مسیرهای پنل ادمین (Admin API)
// -----------------------------------------------------------------------------

app.get('/api/admin/users', adminMiddleware, (_req: Request, res: Response) => {
  const users = storage.getAllUsers();
  const orders = storage.getOrders();

  const usersWithStats = users.map((u) => {
    const userOrders = orders.filter((o) => o.userId === u.id || o.customerName === u.fullName);
    const totalSpent = userOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.calculatedPrice || 0), 0);
    return {
      ...u,
      ordersCount: userOrders.length,
      totalSpent,
    };
  });

  return res.json({ users: usersWithStats });
});

app.get('/api/admin/stats', adminMiddleware, (_req: Request, res: Response) => {
  const orders = storage.getOrders();
  const users = storage.getAllUsers();

  const totalRevenue = orders
    .filter((o) => o.status === 'completed' || o.status === 'in_progress')
    .reduce((sum, o) => sum + (o.calculatedPrice || 0), 0);

  const completedRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.calculatedPrice || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  return res.json({
    totalOrders: orders.length,
    totalRevenue,
    completedRevenue,
    totalUsers: users.length,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    cancelledOrders,
  });
});

// تغییر رمز عبور ادمین
app.put('/api/admin/change-password', adminMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۵ کاراکتر باشد' });
  }

  const success = storage.updateUserPassword(user.userId, newPassword);
  if (!success) {
    return res.status(500).json({ error: 'خطا در تغییر رمز عبور' });
  }

  return res.json({ message: 'رمز عبور ادمین با موفقیت تغییر یافت' });
});

// -----------------------------------------------------------------------------
// مسیرهای گفت‌وگو، پیام‌ها و پشتیبانی (Chat & Support API)
// -----------------------------------------------------------------------------

// ۱. دریافت لیست گفت‌وگوها با ایزولاسیون کامل برای هر کاربر
app.get('/api/chat/threads', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let user: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) user = session;
  }

  // ۱. ادمین به تمام گفت‌وگوها دسترسی دارد
  if (user && user.role === 'admin') {
    const threads = storage.getThreads();
    return res.json({ threads });
  }

  // ۲. هر کاربر فقط و فقط پیام‌های خودش را می‌بیند
  if (user && user.role === 'client') {
    const userRec = storage.getUserById(user.userId);
    const threads = storage.getThreadsForUser(user.userId, userRec?.phone || user.phone);
    return res.json({ threads });
  }

  // ۳. کاربر مهمان صرفاً در صورت وارد کردن دقیق شماره تماس خودش
  const contact = req.query.contact as string | undefined;
  if (contact && contact.trim().length >= 8) {
    const threads = storage.getThreadsByContact(contact.trim());
    return res.json({ threads });
  }

  // در سایر حالت‌ها لیست خالی برگردانده می‌شود تا اطلاعات افشا نشود
  return res.json({ threads: [] });
});

// ۲. دریافت جزئیات یک گفت‌وگو با اعتبارسنجی سطح دسترسی
app.get('/api/chat/threads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const thread = storage.getThreadById(id);
  if (!thread) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }

  const authHeader = req.headers.authorization;
  let sessionUser: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionUser = storage.getSession(authHeader.split(' ')[1]);
  }

  // بررسی دقیق مالکیت گفت‌وگو
  if (sessionUser && sessionUser.role === 'admin') {
    // ادمین مجاز است
  } else if (sessionUser && sessionUser.role === 'client') {
    const userRec = storage.getUserById(sessionUser.userId);
    const owns =
      thread.userId === sessionUser.userId ||
      (userRec?.phone && thread.customerContact.trim().toLowerCase() === userRec.phone.trim().toLowerCase()) ||
      (sessionUser.phone && thread.customerContact.trim().toLowerCase() === sessionUser.phone.trim().toLowerCase());
    if (!owns) {
      return res.status(403).json({ error: 'شما دسترسی به این گفت‌وگو را ندارید' });
    }
  } else {
    const contact = req.query.contact as string | undefined;
    if (!contact || thread.customerContact.trim().toLowerCase() !== contact.trim().toLowerCase()) {
      return res.status(403).json({ error: 'شما دسترسی به این گفت‌وگو را ندارید' });
    }
  }

  const role = sessionUser && sessionUser.role === 'admin' ? 'admin' : 'user';
  storage.markThreadRead(id, role);
  return res.json({ thread: storage.getThreadById(id) });
});

// ۳. ایجاد گفت‌وگوی جدید با الصاق خودکار شناسه و شماره کاربر
app.post('/api/chat/threads', (req: Request, res: Response) => {
  const { customerName, customerContact, subject, orderId, orderTitle, initialMessage, userId } = req.body;

  if (!initialMessage || !initialMessage.trim()) {
    return res.status(400).json({ error: 'متن پیام الزامی است' });
  }

  const authHeader = req.headers.authorization;
  let senderRole: 'admin' | 'user' = 'user';
  let senderName = customerName;
  let boundUserId = userId;
  let finalCustomerName = customerName;
  let finalCustomerContact = customerContact;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      if (session.role === 'admin') {
        senderRole = 'admin';
        senderName = 'مدیریت استودیو';
      } else {
        boundUserId = session.userId;
        senderName = session.fullName;
        finalCustomerName = session.fullName;
        if (session.phone) {
          finalCustomerContact = session.phone;
        }
      }
    }
  }

  if (!finalCustomerName || !finalCustomerContact) {
    return res.status(400).json({ error: 'نام و شماره تماس برای ثبت گفت‌وگو الزامی است' });
  }

  const thread = storage.createThread({
    userId: boundUserId,
    customerName: finalCustomerName.trim(),
    customerContact: finalCustomerContact.trim(),
    subject: subject || (orderId ? `پیگیری سفارش کد ${orderId}` : 'درخواست جدید مشاوره و خدمات'),
    orderId,
    orderTitle,
    initialMessage: initialMessage.trim(),
    senderRole,
    senderName,
  });

  return res.status(201).json({
    message: 'گفت‌وگو با موفقیت ایجاد شد',
    thread,
  });
});

// ۴. ارسال پیام جدید با بررسی سطح دسترسی کاربر
app.post('/api/chat/threads/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'متن پیام نمی‌تواند خالی باشد' });
  }

  const thread = storage.getThreadById(id);
  if (!thread) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }

  const authHeader = req.headers.authorization;
  let senderRole: 'admin' | 'user' = 'user';
  let senderName = thread.customerName;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = storage.getSession(authHeader.split(' ')[1]);
    if (session) {
      if (session.role === 'admin') {
        senderRole = 'admin';
        senderName = 'مدیریت استودیو';
      } else {
        const userRec = storage.getUserById(session.userId);
        const owns =
          thread.userId === session.userId ||
          (userRec?.phone && thread.customerContact.trim().toLowerCase() === userRec.phone.trim().toLowerCase()) ||
          (session.phone && thread.customerContact.trim().toLowerCase() === session.phone.trim().toLowerCase());
        if (!owns) {
          return res.status(403).json({ error: 'شما مجاز به ارسال پیام در این گفت‌وگو نیستید' });
        }
        senderName = session.fullName;
      }
    }
  } else {
    const contact = req.body.contact || req.query.contact;
    if (!contact || thread.customerContact.trim().toLowerCase() !== String(contact).trim().toLowerCase()) {
      return res.status(403).json({ error: 'شما مجاز به ارسال پیام در این گفت‌وگو نیستید' });
    }
  }

  const updatedThread = storage.addMessageToThread(id, {
    senderRole,
    senderName,
    text: text.trim(),
  });

  return res.json({
    message: 'پیام ارسال شد',
    thread: updatedThread,
  });
});

// ۵. تغییر وضعیت گفت‌وگو (بستن یا بازگشایی) توسط ادمین
app.patch('/api/chat/threads/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'open' && status !== 'closed') {
    return res.status(400).json({ error: 'وضعیت نامعتبر است' });
  }

  const updated = storage.updateThreadStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }

  return res.json({ message: 'وضعیت گفت‌وگو تغییر یافت', thread: updated });
});

// ۶. حذف گفت‌وگو توسط ادمین
app.delete('/api/chat/threads/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = storage.deleteThread(id);
  if (!deleted) {
    return res.status(404).json({ error: 'گفت‌وگو یافت نشد' });
  }
  return res.json({ message: 'گفت‌وگو حذف شد' });
});

// -----------------------------------------------------------------------------
// مانت Vite در محیط Dev
// -----------------------------------------------------------------------------
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
