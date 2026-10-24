import test from 'node:test';
import assert from 'node:assert/strict';
import { storage } from './storage.ts';

test('Chat thread creation and messaging works correctly', () => {
  // ۱. ایجاد گفت‌وگوی جدید
  const thread = storage.createThread({
    customerName: 'کاربر تستی',
    customerContact: '09120000000',
    subject: 'درخواست مشاوره اختصاصی',
    initialMessage: 'سلام، مایل به مشاوره در زمینه تیزر هستم.',
    senderRole: 'user',
    senderName: 'کاربر تستی',
  });

  assert.ok(thread.id.startsWith('thr_'));
  assert.equal(thread.customerName, 'کاربر تستی');
  assert.equal(thread.messages.length, 1);
  assert.equal(thread.messages[0].senderRole, 'user');
  assert.equal(thread.unreadByAdmin, 1);
  assert.equal(thread.unreadByUser, 0);

  // ۲. پاسخ ادمین به گفت‌وگو
  const updated = storage.addMessageToThread(thread.id, {
    senderRole: 'admin',
    senderName: 'مدیریت استودیو',
    text: 'درود، درخواست شما دریافت شد و زمان جلسه تعیین گردید.',
  });

  assert.ok(updated);
  assert.equal(updated.messages.length, 2);
  assert.equal(updated.unreadByUser, 1);

  // ۳. خوانده شدن توسط کاربر
  storage.markThreadRead(thread.id, 'user');
  const readThread = storage.getThreadById(thread.id);
  assert.ok(readThread);
  assert.equal(readThread.unreadByUser, 0);

  // ۴. خوانده شدن توسط ادمین
  storage.markThreadRead(thread.id, 'admin');
  const readByAdmin = storage.getThreadById(thread.id);
  assert.ok(readByAdmin);
  assert.equal(readByAdmin.unreadByAdmin, 0);

  // ۵. بستن گفت‌وگو
  const closed = storage.updateThreadStatus(thread.id, 'closed');
  assert.ok(closed);
  assert.equal(closed.status, 'closed');

  // ۶. حذف گفت‌وگوی تستی
  const deleted = storage.deleteThread(thread.id);
  assert.equal(deleted, true);
});
