import type { FullSeller, AccountUpdateBody } from "../types";

let mockSeller: FullSeller = {
  id: "seller-1",
  email: "jane@kesistore.co.ke",
  phone: "254712345678",
  displayName: "Jane",
  role: "SELLER",
  status: "ACTIVE",
  store: {
    slug: "kesi-store",
    name: "Kesi Store",
    tagline: "Everyday essentials, delivered.",
    description: "Curated shoes, tech, fashion and home goods.",
    logoUrl: "/favicon.svg",
    bannerUrl: "",
    themeColor: "#0f172a",
    currency: "KES",
    supportHours: "Mon–Sat, 8am–8pm",
    social: {
      whatsapp: "254712345678",
    },
  },
  address: {
    city: "Nairobi",
    county: "Nairobi",
    country: "Kenya",
  },
  business: {
    legalName: "Kesi Trading Ltd",
    regNumber: "CRC-123456",
    taxPin: "P123456789",
    isVerified: false,
  },
  payout: {
    provider: "MPESA",
    accountRef: "2547**5678",
    isVerified: true,
  },
   settings: {
    defaultLowStockThreshold: 5,
    autoHideOutOfStock: false,
    notifyLowStock: true,
    notifyNewInquiry: true,
  },
  stats: {
    totalProducts: 14,
    totalOrders: 0,
    totalRevenue: 0,
    totalUnitsSold: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function clone(): FullSeller {
  return JSON.parse(JSON.stringify(mockSeller)) as FullSeller;
}

export const accountService = {
  async get(): Promise<FullSeller> {
    return clone();
  },

  async update(patch: AccountUpdateBody): Promise<FullSeller> {
    const seller = clone();
    if (patch.displayName) seller.displayName = patch.displayName;
    if (patch.phone) seller.phone = patch.phone;
    if (patch.email) seller.email = patch.email;
    if (patch.store) {
      const s = seller.store;
      if (patch.store.name) s.name = patch.store.name;
      if (patch.store.slug) s.slug = patch.store.slug;
      if (patch.store.tagline !== undefined) s.tagline = patch.store.tagline;
      if (patch.store.description !== undefined) s.description = patch.store.description;
      if (patch.store.themeColor) s.themeColor = patch.store.themeColor;
      if (patch.store.currency) s.currency = patch.store.currency;
      if (patch.store.supportHours !== undefined) s.supportHours = patch.store.supportHours;
      if (patch.store.social) {
        s.social = { ...s.social, ...patch.store.social };
      }
    }
    if (patch.address) {
      seller.address = { ...seller.address, ...patch.address };
    }
    if (patch.business) {
      seller.business = { ...seller.business, ...patch.business };
    }
    if (patch.payout) {
      seller.payout = {
        provider: seller.payout?.provider ?? "MPESA",
        accountRef: seller.payout?.accountRef,
        bankName: seller.payout?.bankName,
        isVerified: seller.payout?.isVerified,
        ...patch.payout,
      };
    }
    if (patch.settings) {
      seller.settings = { ...seller.settings, ...patch.settings };
    }
    seller.updatedAt = new Date().toISOString();
    mockSeller = seller;
    return seller;
  },

  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    void input;
  },

  async uploadLogo(file: File): Promise<FullSeller> {
    void file;
    const seller = clone();
    seller.store.logoUrl = "https://cdn.example.com/mock-logo.png";
    mockSeller = seller;
    return seller;
  },

  async uploadBanner(file: File): Promise<FullSeller> {
    void file;
    const seller = clone();
    seller.store.bannerUrl = "https://cdn.example.com/mock-banner.jpg";
    mockSeller = seller;
    return seller;
  },

  async deleteLogo(): Promise<FullSeller> {
    const seller = clone();
    seller.store.logoUrl = undefined;
    mockSeller = seller;
    return seller;
  },

  async deleteBanner(): Promise<FullSeller> {
    const seller = clone();
    seller.store.bannerUrl = undefined;
    mockSeller = seller;
    return seller;
  },

  async updatePayout(body: { accountRef: string }): Promise<FullSeller> {
    const seller = clone();
    seller.payout = {
      provider: seller.payout?.provider ?? "MPESA",
      accountRef: `${body.accountRef.slice(0, 2)}${"*".repeat(Math.max(1, body.accountRef.length - 4))}${body.accountRef.slice(-2)}`,
      bankName: seller.payout?.bankName,
      isVerified: false,
    };
    seller.updatedAt = new Date().toISOString();
    mockSeller = seller;
    return seller;
  },
};
