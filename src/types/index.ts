export type ServiceCategory = 'all' | 'design' | 'video_audio' | 'dev_automation';

export type CoinDesignId = 'royal_crest' | 'cyber_hex' | 'solar_nova' | 'imperial_shield';

export interface CoinPackageItem {
  id: string;
  coins: number;
  coinAmount?: number;
  priceToman: number;
  title: string;
  subtitle?: string;
  badge?: string;
  designId: CoinDesignId;
  popular?: boolean;
  isActive?: boolean;
}

export interface CoinSystemSettings {
  enabled: boolean;
  coinName: string;
  coinSymbol?: string;
  activeDesign: CoinDesignId;
  unitPriceToman: number;
  packages: CoinPackageItem[];
}

export interface PromoBannerSettings {
  enabled: boolean;
  text: string;
  badgeText?: string;
  stickyOnScroll: boolean;
  linkText?: string;
  linkUrl?: string;
  linkHash?: string;
}

export type PaymentGatewayProvider = 'zarinpal' | 'zibal' | 'custom_link';

export interface PaymentGatewaySettings {
  onlineEnabled: boolean;
  activeProvider: PaymentGatewayProvider;
  sandboxMode: boolean;
  zarinpalMerchantId: string;
  zibalMerchantId: string;
  customPaymentUrl: string;
  cardToCardEnabled: boolean;
  cardNumber: string;
  shebaNumber: string;
  cardHolderName: string;
  bankName: string;
  paymentInstruction: string;
}

export interface SiteSettings {
  showPrices: boolean;
  telegramUrl: string;
  baleUrl: string;
  coinSystem: CoinSystemSettings;
  promoBanner: PromoBannerSettings;
  paymentGateway: PaymentGatewaySettings;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  type: 'mint_grant' | 'admin_grant' | 'purchase_topup' | 'topup_request' | 'order_payment' | 'admin_deduct';
  amount: number;
  balanceAfter?: number;
  priceToman?: number;
  description?: string;
  note?: string;
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
}

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
  coins?: number;
  coinEnabled?: boolean;
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
  paidWithCoins?: boolean;
  coinsSpent?: number;
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
  totalMintedCoins?: number;
  pendingTopupRequests?: number;
}

export interface ChatAttachment {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  senderRole: 'admin' | 'user';
  senderName: string;
  text: string;
  attachments?: ChatAttachment[];
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

export interface TestimonialItem {
  id: string;
  category: '3d' | 'branding' | 'web';
  name: string;
  role: string;
  company: string;
  service: string;
  avatarColor?: string;
  initials?: string;
  outcome: string;
  rating: number; // 1-5
  date: string;
  quote: string;
  verified?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  userId?: string;
  orderId?: string;
  trackingCode?: string;
  createdAt?: string;
}
