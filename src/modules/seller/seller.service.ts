import { db } from "@/lib/db";

export const sellerService = {
  async getProfile(userId: string) {
    return db.sellerProfile.findUnique({ where: { userId } });
  },

  async updateProfile(userId: string, data: { shopName: string; description?: string; logoUrl?: string }) {
    return db.sellerProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  },

  async getProducts(sellerId: string) {
    return db.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  },

  async getOrders(sellerId: string) {
    const orderItems = await db.orderItem.findMany({
      where: {
        product: { sellerId },
      },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    // Group by order
    const ordersMap = new Map();
    for (const item of orderItems) {
      if (!ordersMap.has(item.orderId)) {
        ordersMap.set(item.orderId, {
          ...item.order,
          items: [],
          sellerTotal: 0,
        });
      }
      const order = ordersMap.get(item.orderId);
      order.items.push(item);
      order.sellerTotal += item.price * item.quantity;
    }

    return Array.from(ordersMap.values());
  },

  async getAnalytics(sellerId: string) {
    const [productsCount, orderItems, lowStock] = await Promise.all([
      db.product.count({ where: { sellerId } }),
      db.orderItem.findMany({
        where: { product: { sellerId }, order: { status: { not: "CANCELLED" } } },
        include: { order: true },
      }),
      db.product.findMany({
        where: { sellerId, stock: { lte: 5 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: "asc" },
        take: 5
      })
    ]);

    const uniqueOrderIds = new Set(orderItems.map(item => item.orderId));
    const totalOrders = uniqueOrderIds.size;
    const totalEarnings = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Group by product for top products
    const productStats = new Map();
    for (const item of orderItems) {
      if (!productStats.has(item.productId)) {
        productStats.set(item.productId, { name: item.productName, sales: 0, revenue: 0 });
      }
      const stat = productStats.get(item.productId);
      stat.sales += item.quantity;
      stat.revenue += item.price * item.quantity;
    }
    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Group by month for earnings trends
    const monthlyEarningsMap = new Map();
    for (const item of orderItems) {
      const month = item.order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyEarningsMap.set(month, (monthlyEarningsMap.get(month) || 0) + (item.price * item.quantity));
    }
    const monthlyEarnings = Array.from(monthlyEarningsMap.entries())
      .map(([month, earnings]) => ({ month, earnings }))
      .slice(-6); // Last 6 months

    return { 
      totalProducts: productsCount, 
      totalOrders, 
      totalEarnings, 
      topProducts, 
      lowStock,
      monthlyEarnings
    };
  },

  async register(userId: string, data: { shopName: string; description?: string }) {
    return db.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.create({
        data: {
          userId,
          shopName: data.shopName,
          description: data.description,
          isApproved: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: "SELLER" },
      });

      return profile;
    });
  },
};
