import { db } from "@/lib/db";
import { Role, OrderStatus } from "@prisma/client";

export const adminService = {
  // DASHBOARD
  async getDashboardStats() {
    const [totalUsers, totalVendors, totalProducts, totalOrders, orders, revenueResult, topSellingProducts, topSellers, lowStockAlerts] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.sellerProfile.count(),
      db.product.count(),
      db.order.count(),
      db.order.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { totalAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      db.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { totalAmount: true }
      }),
      db.product.findMany({
        orderBy: { orderItems: { _count: 'desc' } },
        take: 5,
        select: { id: true, name: true, price: true, stock: true, _count: { select: { orderItems: true } } }
      }),
      db.sellerProfile.findMany({
        take: 5,
        include: {
          user: { select: { name: true } },
          _count: { select: { products: true } },
          products: {
            select: {
              orderItems: {
                where: { order: { status: { not: "CANCELLED" } } },
                select: { price: true, quantity: true }
              }
            }
          }
        }
      }),
      db.product.findMany({
        where: { stock: { lte: 5 } },
        take: 5,
        select: { id: true, name: true, stock: true },
        orderBy: { stock: "asc" }
      })
    ]);

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Calculate revenue for top sellers manually since Prisma aggregation on relations can be complex
    const topSellersFormatted = topSellers.map(seller => {
      const revenue = seller.products.reduce((acc, p) => 
        acc + p.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), 0
      );
      return {
        id: seller.id,
        shopName: seller.shopName,
        owner: seller.user.name,
        revenue,
        productCount: seller._count.products
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return { 
      totalUsers, 
      totalVendors, 
      totalProducts, 
      totalOrders, 
      totalRevenue, 
      orders, 
      topSellingProducts, 
      topSellers: topSellersFormatted, 
      lowStockAlerts 
    };
  },

  // USERS
  async getUsers(query: { search?: string, role?: string, page?: number, limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.search ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(query.role ? { role: query.role as any } : {})
    };

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  async updateUserRole(userId: string, role: Role) {
    return db.user.update({ where: { id: userId }, data: { role } });
  },

  async toggleUserRestriction(userId: string, isRestricted: boolean) {
    return db.user.update({ where: { id: userId }, data: { isRestricted } });
  },

  async softDeleteUser(userId: string) {
    return db.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
  },

  // SELLERS
  async getSellers() {
    return db.sellerProfile.findMany({
      include: {
        user: { select: { name: true, email: true, isRestricted: true } },
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async toggleSellerApproval(sellerId: string, isApproved: boolean) {
    return db.sellerProfile.update({ where: { id: sellerId }, data: { isApproved } });
  },

  // PRODUCTS
  async getProducts(query: { search?: string, page?: number, limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = query.search ? {
      name: { contains: query.search, mode: 'insensitive' as const }
    } : {};

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: { 
          category: { select: { name: true } },
          seller: { select: { shopName: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  async deleteProduct(productId: string) {
    return db.product.delete({ where: { id: productId } });
  },

  async toggleFeatured(productId: string, isFeatured: boolean) {
    return db.product.update({ where: { id: productId }, data: { isFeatured } });
  },

  // ORDERS
  async getOrders(query: { page?: number, limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      db.order.count(),
      db.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true, productName: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await db.order.update({ 
      where: { id: orderId }, 
      data: { status },
      include: { user: true }
    });

    const email = order.user?.email || order.guestEmail;
    if (email) {
      await import("@/services/email.service").then(m => m.emailService.sendShippingUpdate({
        to: email,
        orderId: order.id,
        status,
      }).catch(console.error));
    }

    return order;
  },

  // PROMO CODES
  async getPromoCodes() {
    return db.promoCode.findMany({
      orderBy: { createdAt: "desc" }
    });
  },

  async createPromoCode(data: { code: string, discountType: "PERCENTAGE" | "FIXED", discountValue: number, usageLimit: number | null, expiryDate: Date | null }) {
    return db.promoCode.create({ data });
  },

  async deletePromoCode(id: string) {
    return db.promoCode.delete({ where: { id } });
  },

  async togglePromoCode(id: string, isActive: boolean) {
    return db.promoCode.update({ where: { id }, data: { isActive } });
  }
};
