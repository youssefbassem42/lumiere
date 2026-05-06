import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, DiscountType, OrderStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── Helpers ──────────────────────────────────────────────────────────────────
function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Seed Data ────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding database with high-quality data...\n");

  // 1. Clean existing data (optional but helpful for a fresh start)
  // Note: Be careful with deletions in production!
  await prisma.wishlistItem.deleteMany();
  await prisma.reviewReply.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }); // Keep admin if exists

  const hashedPassword = await bcrypt.hash("Password123", 12);

  // ── 1. Users ───────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@lumiere.store" },
    update: {},
    create: {
      name: "Alexander Lumière",
      email: "admin@lumiere.store",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const seller1User = await prisma.user.create({
    data: {
      name: "Julian Vane",
      email: "julian@vane-atelier.com",
      password: hashedPassword,
      role: "SELLER",
      emailVerified: new Date(),
    },
  });

  const seller2User = await prisma.user.create({
    data: {
      name: "Elena Rossi",
      email: "elena@rossi-home.it",
      password: hashedPassword,
      role: "SELLER",
      emailVerified: new Date(),
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Marcus Aurelius",
      email: "marcus@example.com",
      password: hashedPassword,
      role: "USER",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Users and Roles created.");

  // ── 2. Seller Profiles ────────────────────────────────────────────────────
  const seller1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1User.id,
      shopName: "Vane Atelier",
      description: "Handcrafted minimalist fashion and essentials for the modern wanderer.",
      isApproved: true,
    },
  });

  const seller2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2User.id,
      shopName: "Rossi Casa",
      description: "Fine Italian homeware and curated living room essentials.",
      isApproved: true,
    },
  });

  console.log("✅ Seller Profiles created.");

  // ── 3. Categories ─────────────────────────────────────────────────────────
  const categories = [
    {
      name: "Living",
      description: "Objects for intentional living and home sanctuary.",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
      sub: ["Furniture", "Lighting", "Decor"]
    },
    {
      name: "Tech",
      description: "Premium gadgets that blend form and function.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
      sub: ["Audio", "Desk Essentials", "Mobile"]
    },
    {
      name: "Apparel",
      description: "Timeless garments crafted from natural materials.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68ff25d43d",
      sub: ["Menswear", "Womenswear", "Accessories"]
    },
    {
      name: "Beauty",
      description: "Scientific skincare and evocative fragrances.",
      image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571",
      sub: ["Skincare", "Scent"]
    }
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categories) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        slug: slug(cat.name),
        description: cat.description,
        image: cat.image,
      }
    });
    categoryMap[cat.name] = parent.id;

    for (const subName of cat.sub) {
      const sub = await prisma.category.create({
        data: {
          name: subName,
          slug: slug(subName),
          parentId: parent.id,
        }
      });
      categoryMap[subName] = sub.id;
    }
  }

  console.log("✅ Categories hierarchy created.");

  // ── 4. Products ───────────────────────────────────────────────────────────
  const products = [
    // --- Living ---
    {
      name: "Hans J. Wegner Lounge Chair",
      desc: "An iconic piece of Danish modern design. Solid oak frame with hand-woven paper cord seat. Timeless comfort for your reading nook.",
      price: 1250, compare: 1400, stock: 5, sku: "LIV-WGN-01", 
      cat: "Furniture", seller: seller2.id, featured: true,
      images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c"]
    },
    {
      name: "Brass Floating Pendant",
      desc: "Hand-finished spun brass pendant lamp. Emits a soft, warm glow that elevates any dining or living space.",
      price: 480, compare: null, stock: 12, sku: "LIV-LIT-02", 
      cat: "Lighting", seller: seller2.id, featured: false,
      images: ["https://images.unsplash.com/photo-1534073828943-f801091bb18c"]
    },
    {
      name: "Ceramic Ripple Vase",
      desc: "Matte white ceramic vase with a unique ripple texture. Perfect as a standalone sculpture or for minimal floral arrangements.",
      price: 85, compare: 110, stock: 45, sku: "LIV-DEC-03", 
      cat: "Decor", seller: seller2.id, featured: true,
      images: ["https://images.unsplash.com/photo-1581783898377-1c85bf937427"]
    },

    // --- Tech ---
    {
      name: "Silver Walnut Headphones",
      desc: "Reference-grade studio headphones. Real walnut earcups, sheepskin leather headband, and 45mm neodymium drivers.",
      price: 399, compare: 450, stock: 25, sku: "TCH-AUD-01", 
      cat: "Audio", seller: null, featured: true,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"]
    },
    {
      name: "Anodized Aluminum Keyboard",
      desc: "Mechanical precision in a minimalist package. Hot-swappable switches, Gateron browns, and a solid aluminum case.",
      price: 180, compare: null, stock: 30, sku: "TCH-DSK-02", 
      cat: "Desk Essentials", seller: null, featured: false,
      images: ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae"]
    },
    {
      name: "Titanium Laptop Stand",
      desc: "Elevate your workflow. Precision-milled titanium stand for optimal ergonomics and thermal performance.",
      price: 145, compare: 175, stock: 15, sku: "TCH-DSK-03", 
      cat: "Desk Essentials", seller: null, featured: true,
      images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"]
    },

    // --- Apparel ---
    {
      name: "Raw Denim Work Jacket",
      desc: "14oz Japanese selvedge denim. Triple-stitched seams and solid brass buttons. Designed to age beautifully with every wear.",
      price: 240, compare: 290, stock: 10, sku: "APP-MWR-01", 
      cat: "Menswear", seller: seller1.id, featured: true,
      images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea"]
    },
    {
      name: "Merino Wool Turtle Neck",
      desc: "Extra fine merino wool from sustainable sources. Breathable, soft, and exceptionally warm for the cooler months.",
      price: 135, compare: null, stock: 40, sku: "APP-WWR-02", 
      cat: "Womenswear", seller: seller1.id, featured: false,
      images: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105"]
    },
    {
      name: "Minimalist Leather Cardholder",
      desc: "Full-grain vegetable tanned leather. 4 card slots and a central pocket. Slim profile that disappears in your pocket.",
      price: 55, compare: 75, stock: 100, sku: "APP-ACC-03", 
      cat: "Accessories", seller: seller1.id, featured: false,
      images: ["https://images.unsplash.com/photo-1627123424574-724758594e93"]
    },

    // --- Beauty ---
    {
      name: "Botanic Face Oil",
      desc: "A potent blend of cold-pressed botanicals. Rich in antioxidants and essential fatty acids for a luminous complexion.",
      price: 72, compare: 95, stock: 60, sku: "BTY-SKN-01", 
      cat: "Skincare", seller: null, featured: true,
      images: ["https://images.unsplash.com/photo-1608248597279-f99d160bfcbc"]
    },
    {
      name: "Santal 33 Eau de Parfum",
      desc: "An addictive blend of cardamon, iris, violet, and ambrox. A signature scent that defines modern luxury.",
      price: 215, compare: null, stock: 20, sku: "BTY-SNT-02", 
      cat: "Scent", seller: null, featured: true,
      images: ["https://images.unsplash.com/photo-1541643600914-78b084683601"]
    }
  ];

  const productIds: string[] = [];

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: slug(p.name),
        description: p.desc,
        price: p.price,
        comparePrice: p.compare,
        stock: p.stock,
        sku: p.sku,
        isFeatured: p.featured,
        categoryId: categoryMap[p.cat],
        sellerId: p.seller,
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: `${p.name} - Perspective ${i + 1}`,
          })),
        },
      },
    });
    productIds.push(product.id);
  }

  console.log(`✅ Products: ${productIds.length} created.`);

  // ── 5. Promo Codes ────────────────────────────────────────────────────────
  await prisma.promoCode.createMany({
    data: [
      { code: "LUMIERE10", discountType: "PERCENTAGE", discountValue: 10, isActive: true },
      { code: "WELCOME50", discountType: "FIXED", discountValue: 50, isActive: true },
      { code: "EXPIRED20", discountType: "PERCENTAGE", discountValue: 20, isActive: false, expiryDate: new Date(Date.now() - 86400000) },
    ],
  });

  console.log("✅ Promo Codes created.");

  // ── 6. Orders & Reviews ───────────────────────────────────────────────────
  // Create some realistic orders and reviews
  for (let i = 0; i < 5; i++) {
    const order = await prisma.order.create({
      data: {
        userId: customer1.id,
        subtotal: 100 + (i * 50),
        totalAmount: 100 + (i * 50),
        status: i === 0 ? "DELIVERED" : "PAID",
        currency: "usd",
        items: {
          create: [
            { 
              productId: productIds[i % productIds.length], 
              quantity: 1, 
              price: 100 + (i * 50), 
              productName: products[i % products.length].name,
              productSlug: slug(products[i % products.length].name)
            },
          ],
        },
        payment: {
          create: { 
            amount: 100 + (i * 50), 
            provider: "STRIPE", 
            status: "SUCCESS" 
          }
        }
      },
    });

    if (i % 2 === 0) {
      await prisma.review.create({
        data: {
          rating: 5,
          comment: "Absolutely breathtaking quality. The minimalist design is exactly what I was looking for. Fast shipping too!",
          userId: customer1.id,
          productId: productIds[i % productIds.length],
          isVerifiedPurchase: true,
        },
      });
    }
  }

  console.log("✅ Orders and Verified Reviews created.");

  console.log("\n🎉 Database Seeded Successfully!");
  console.log("----------------------------------");
  console.log(`Admin: admin@lumiere.store / Password123`);
  console.log(`Seller: julian@vane-atelier.com / Password123`);
  console.log(`Customer: marcus@example.com / Password123`);
  console.log("----------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
