import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLocalApiRequest } from './offlineApiBridge';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

test('offlineApiBridge returns default services and settings', async () => {
  const storage = new MemoryStorage();
  const res = await handleLocalApiRequest('/api/services', { method: 'GET' }, storage);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.services));
  assert.ok(data.services.length >= 6);
  assert.equal(data.showPrices, true);
});

test('offlineApiBridge supports admin login, order creation, and tracking lookup', async () => {
  const storage = new MemoryStorage();

  // Login as default admin
  const loginRes = await handleLocalApiRequest(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    },
    storage
  );
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.token);
  assert.equal(loginData.user.role, 'admin');

  // Create an order
  const orderRes = await handleLocalApiRequest(
    '/api/orders',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${loginData.token}` },
      body: JSON.stringify({
        serviceId: 'video-editing',
        customerName: 'حسین حیدری',
        customerContact: '09121234567',
        quantity: 2,
        priority: 'express',
        description: 'تیزر تبلیغاتی محصول',
      }),
    },
    storage
  );
  assert.equal(orderRes.status, 200);
  const orderData = await orderRes.json();
  assert.ok(orderData.trackingCode.startsWith('STD-'));

  // Lookup order by trackingCode
  const lookupRes = await handleLocalApiRequest(
    `/api/orders?trackingCode=${orderData.trackingCode}`,
    { method: 'GET' },
    storage
  );
  assert.equal(lookupRes.status, 200);
  const lookupData = await lookupRes.json();
  assert.equal(lookupData.order.customerName, 'حسین حیدری');
});
