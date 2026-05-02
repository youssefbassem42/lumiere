import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── Helpers ──────────────────────────────────────────────────────────────────
function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Seed Data ────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Users ───────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lumiere.store" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@lumiere.store",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      name: "Jane Doe",
      email: "jane@example.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      name: "John Smith",
      email: "john@example.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  console.log(`✅ Users: ${admin.name}, ${user1.name}, ${user2.name}`);

  // ── 2. Categories ─────────────────────────────────────────────────────────
  const categoriesData = [
    {
      name: "Electronics",
      description: "Latest gadgets and tech accessories",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600",
      children: [
        { name: "Smartphones", description: "Flagship and budget phones" },
        { name: "Laptops", description: "Notebooks and ultrabooks" },
        { name: "Audio", description: "Headphones, speakers and more" },
      ],
    },
    {
      name: "Fashion",
      description: "Curated luxury fashion pieces",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600",
      children: [
        { name: "Men's Wear", description: "Menswear essentials" },
        { name: "Women's Wear", description: "Womenswear collection" },
        { name: "Accessories", description: "Bags, belts and jewelry" },
      ],
    },
    {
      name: "Home & Living",
      description: "Elevate your living space",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
      children: [
        { name: "Furniture", description: "Modern furniture pieces" },
        { name: "Decor", description: "Home decoration items" },
      ],
    },
    {
      name: "Beauty",
      description: "Premium skincare and cosmetics",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
      children: [
        { name: "Skincare", description: "Serums, creams and treatments" },
        { name: "Fragrance", description: "Luxury perfumes and colognes" },
      ],
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: slug(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slug(cat.name),
        description: cat.description,
        image: cat.image,
      },
    });
    categoryMap[cat.name] = parent.id;

    for (const child of cat.children) {
      const sub = await prisma.category.upsert({
        where: { slug: slug(child.name) },
        update: {},
        create: {
          name: child.name,
          slug: slug(child.name),
          description: child.description,
          parentId: parent.id,
        },
      });
      categoryMap[child.name] = sub.id;
    }
  }

  console.log(`✅ Categories: ${Object.keys(categoryMap).length} created`);

  // ── 3. Products ───────────────────────────────────────────────────────────
  const productsData = [
    // Electronics > Smartphones
    { name: "Galaxy Ultra S26", description: "Samsung's flagship with 200MP camera, titanium frame, and AI-powered features. The ultimate smartphone experience.", price: 1199.99, comparePrice: 1399.99, stock: 45, sku: "SM-S26U", category: "Smartphones", featured: true, images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"] },
    { name: "iPhone 17 Pro", description: "Apple's most advanced iPhone ever. A18 Bionic chip, ProMotion display, and revolutionary camera system.", price: 1099.00, comparePrice: null, stock: 120, sku: "APL-IP17P", category: "Smartphones", featured: true, images: ["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600"] },
    { name: "Pixel 10 Pro", description: "Google's AI-first smartphone with Tensor G5 chip. Best-in-class computational photography.", price: 899.00, comparePrice: 999.00, stock: 30, sku: "GGL-PX10P", category: "Smartphones", featured: false, images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600"] },

    // Electronics > Laptops
    { name: "MacBook Pro M4 16\"", description: "Supercharged by M4 Pro chip. Up to 22 hours battery life. Liquid Retina XDR display.", price: 2499.00, comparePrice: null, stock: 25, sku: "APL-MBP16", category: "Laptops", featured: true, images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600"] },
    { name: "ThinkPad X1 Carbon Gen 12", description: "Ultra-lightweight business laptop. 14\" 2.8K OLED display, Intel Core Ultra processor.", price: 1849.00, comparePrice: 2099.00, stock: 18, sku: "LNV-X1C12", category: "Laptops", featured: false, images: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600"] },
    { name: "Dell XPS 15", description: "InfinityEdge display with stunning 3.5K OLED panel. Perfect for creators and professionals.", price: 1599.00, comparePrice: null, stock: 35, sku: "DLL-XPS15", category: "Laptops", featured: false, images: ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"] },

    // Electronics > Audio
    { name: "Sony WH-1000XM6", description: "Industry-leading noise cancellation with 40-hour battery life. Hi-Res Audio and LDAC support.", price: 399.99, comparePrice: 449.99, stock: 80, sku: "SNY-XM6", category: "Audio", featured: true, images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"] },
    { name: "AirPods Pro 3", description: "Adaptive Audio. Personalized Spatial Audio. USB-C MagSafe case with built-in speaker.", price: 249.00, comparePrice: null, stock: 200, sku: "APL-APP3", category: "Audio", featured: false, images: ["https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600"] },

    // Fashion > Men's Wear
    { name: "Cashmere Overcoat", description: "Premium Italian cashmere overcoat. Tailored fit with satin lining. Available in charcoal and navy.", price: 890.00, comparePrice: 1200.00, stock: 12, sku: "FSH-COC01", category: "Men's Wear", featured: true, images: ["https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600"] },
    { name: "Slim Fit Chinos", description: "Stretch cotton chinos with a modern slim fit. Comfortable all-day wear.", price: 79.99, comparePrice: null, stock: 150, sku: "FSH-CHN01", category: "Men's Wear", featured: false, images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600"] },
    { name: "Oxford Dress Shirt", description: "Classic button-down Oxford shirt in premium Egyptian cotton. Wrinkle-resistant finish.", price: 59.99, comparePrice: 89.99, stock: 200, sku: "FSH-OXF01", category: "Men's Wear", featured: false, images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"] },

    // Fashion > Women's Wear
    { name: "Silk Midi Dress", description: "Elegant silk midi dress with delicate draping. Perfect for evening occasions.", price: 450.00, comparePrice: 599.00, stock: 20, sku: "FSH-SMD01", category: "Women's Wear", featured: true, images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"] },
    { name: "Leather Biker Jacket", description: "Genuine lambskin leather jacket with silver-tone hardware. Timeless rebel style.", price: 650.00, comparePrice: null, stock: 15, sku: "FSH-LBJ01", category: "Women's Wear", featured: false, images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"] },

    // Fashion > Accessories
    { name: "Italian Leather Tote", description: "Handcrafted full-grain Italian leather tote bag. Spacious interior with laptop sleeve.", price: 320.00, comparePrice: 420.00, stock: 30, sku: "FSH-ILT01", category: "Accessories", featured: true, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"] },
    { name: "Minimalist Watch", description: "Swiss-made quartz movement. Sapphire crystal glass. 40mm case with leather strap.", price: 275.00, comparePrice: null, stock: 40, sku: "FSH-MNW01", category: "Accessories", featured: false, images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"] },

    // Home & Living > Furniture
    { name: "Scandinavian Lounge Chair", description: "Mid-century modern design with solid oak frame and premium wool upholstery.", price: 799.00, comparePrice: 999.00, stock: 10, sku: "HM-SLC01", category: "Furniture", featured: true, images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"] },
    { name: "Walnut Coffee Table", description: "Solid walnut coffee table with hairpin legs. Minimalist design for modern living rooms.", price: 349.00, comparePrice: null, stock: 22, sku: "HM-WCT01", category: "Furniture", featured: false, images: ["https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600"] },

    // Home & Living > Decor
    { name: "Ceramic Vase Set", description: "Set of 3 handmade ceramic vases in earthy tones. Each piece is unique.", price: 89.99, comparePrice: 129.99, stock: 60, sku: "HM-CVS01", category: "Decor", featured: false, images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600"] },
    { name: "Linen Throw Blanket", description: "100% French linen throw blanket. Naturally breathable and gets softer with every wash.", price: 120.00, comparePrice: null, stock: 45, sku: "HM-LTB01", category: "Decor", featured: false, images: ["https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600"] },

    // Beauty > Skincare
    { name: "Hyaluronic Acid Serum", description: "Triple-weight hyaluronic acid serum for deep hydration. Dermatologist recommended.", price: 42.00, comparePrice: 58.00, stock: 300, sku: "BTY-HAS01", category: "Skincare", featured: true, images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"] },
    { name: "Vitamin C Moisturizer", description: "Brightening moisturizer with 15% vitamin C complex. SPF 30 protection included.", price: 38.00, comparePrice: null, stock: 180, sku: "BTY-VCM01", category: "Skincare", featured: false, images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600"] },

    // Beauty > Fragrance
    { name: "Oud Noir Eau de Parfum", description: "Luxury fragrance with notes of oud wood, saffron, and amber. Long-lasting 12+ hours.", price: 185.00, comparePrice: 220.00, stock: 50, sku: "BTY-ONP01", category: "Fragrance", featured: true, images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=600"] },
    { name: "Fresh Citrus Cologne", description: "Light and refreshing cologne with bergamot, lemon, and white musk. Perfect for daily wear.", price: 65.00, comparePrice: null, stock: 100, sku: "BTY-FCC01", category: "Fragrance", featured: false, images: ["https://images.unsplash.com/photo-1594035910387-fea081e42953?w=600"] },
  ];

  const productIds: string[] = [];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: slug(p.name) },
      update: {},
      create: {
        name: p.name,
        slug: slug(p.name),
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        sku: p.sku,
        isFeatured: p.featured,
        isPublished: true,
        categoryId: categoryMap[p.category],
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: `${p.name} - Image ${i + 1}`,
          })),
        },
      },
    });
    productIds.push(product.id);
  }

  console.log(`✅ Products: ${productIds.length} created`);

  // ── 4. Reviews ────────────────────────────────────────────────────────────
  const reviewers = [user1.id, user2.id];
  const reviewComments = [
    "Absolutely love this product! Exceeded my expectations.",
    "Great quality for the price. Would definitely recommend.",
    "Good product overall. Shipping was fast.",
    "Decent quality. Not the best but solid for the price.",
    "Amazing! This is exactly what I was looking for.",
    "Very satisfied with my purchase. Will buy again.",
  ];

  let reviewCount = 0;
  for (let i = 0; i < productIds.length; i++) {
    // Each product gets 1-2 reviews
    const numReviews = Math.min(reviewers.length, (i % 2) + 1);
    for (let j = 0; j < numReviews; j++) {
      const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId: reviewers[j], productId: productIds[i] } },
      });
      if (!existing) {
        await prisma.review.create({
          data: {
            rating: 3 + Math.floor(Math.random() * 3), // 3-5
            comment: reviewComments[(i + j) % reviewComments.length],
            userId: reviewers[j],
            productId: productIds[i],
          },
        });
        reviewCount++;
      }
    }
  }

  console.log(`✅ Reviews: ${reviewCount} created`);

  // ── 5. Sample Cart ────────────────────────────────────────────────────────
  const cart = await prisma.cart.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      items: {
        create: [
          { productId: productIds[0], quantity: 1 },
          { productId: productIds[6], quantity: 2 },
        ],
      },
    },
  });
  console.log(`✅ Cart: created for ${user1.name} (${cart.id})`);

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
