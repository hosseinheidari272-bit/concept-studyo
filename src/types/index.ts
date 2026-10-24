export type ServiceCategory = 'all' | 'design' | 'video_audio' | 'dev_automation';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription?: string;
  category: ServiceCategory;
  tags: string[];
  startingPrice: number;
  deliveryTime: string;
  popular?: boolean;
  deliverables: string[];
  discountPercent?: number;
  isActive?: boolean;
  featuredTag?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'client';
  ordersCount?: number;
  totalSpent?: number;
  notes?: string;
  createdAt?: string;
}

export interface OrderItem {
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
  adminNote?: string;
  deliveryLink?: string;
  userId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  completedRevenue: number;
  totalUsers: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface ChatMessage {
  id: string;
  senderRole: 'admin' | 'user';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatThread {
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
  messages: ChatMessage[];
}
