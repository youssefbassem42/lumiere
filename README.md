# Lumière — Premium E-Commerce Platform

Lumière is a state-of-the-art, feature-rich e-commerce platform built with the latest technologies. It offers a seamless experience for customers, sellers, and administrators, featuring robust product management, secure checkout, and comprehensive dashboards.

## 🚀 Technologies

Lumière leverages a modern tech stack designed for performance, scalability, and developer experience:

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Hosted on [Neon](https://neon.tech/))
- **ORM**: [Prisma 7+](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Caching**: [Redis](https://redis.io/) (via [ioredis](https://github.com/luin/ioredis))
- **Payments**: [Stripe](https://stripe.com/) & [PayPal](https://www.paypal.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Email**: [Brevo](https://www.brevo.com/) (formerly Sendinblue)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 📂 Project Structure

The project follows a modular, domain-driven architecture to maintain clean separation of concerns:

```text
lumiere/
├── prisma/                  # Database schema, migrations, and seed scripts
├── public/                  # Static assets (images, icons, etc.)
├── src/
│   ├── app/                 # Next.js App Router (Routes, Layouts, API)
│   ├── components/          # Reusable UI components
│   │   ├── admin/           # Admin-specific components
│   │   ├── seller/          # Seller-specific components
│   │   ├── ui/              # Base UI components (Buttons, Inputs, etc.)
│   │   └── product/         # Product-related components
│   ├── lib/                 # Core utilities (DB, Redis, Auth config)
│   ├── modules/             # Domain-driven logic (Services & Repositories)
│   │   ├── admin/           # Admin dashboard logic
│   │   ├── auth/            # Authentication & Authorization
│   │   ├── cart/            # Shopping cart management
│   │   ├── checkout/        # Payment & Order processing
│   │   ├── products/        # Product & Category management
│   │   └── seller/          # Seller dashboard logic
│   ├── services/            # Third-party services (Email, etc.)
│   ├── store/               # Global state (Zustand)
│   ├── types/               # Global TypeScript definitions
│   └── utils/               # Helper functions
├── .env.example             # Template for environment variables
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
└── vercel.json              # Vercel deployment configuration
```

---

## 🛠️ Installation & Local Setup

Follow these steps to get Lumière running on your local machine:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A running PostgreSQL database (or use Neon.tech)
- A Redis instance (local or hosted)

### 2. Clone the Repository
```bash
git clone https://github.com/youssefbassem42/lumiere.git
cd lumiere
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
Copy the `.env.example` file to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> Make sure to set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `REDIS_URL` at a minimum for the app to start.

### 5. Database Setup
Generate the Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```
*(Optional)* Seed the database with sample data:
```bash
npm run db:seed
```

### 6. Run the Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to see your application!

---

## 🚢 Deployment

### Vercel Configuration
This project is optimized for Vercel. Ensure the following environment variables are set in your Vercel project dashboard:

- `DATABASE_URL`: Your database connection string (use pooled URL for runtime).
- `DIRECT_URL`: Your direct connection string (required for migrations via CLI).
- `NEXTAUTH_SECRET`: A secure random string for NextAuth.
- `NEXTAUTH_URL`: Your production URL.
- `NEXT_PUBLIC_APP_URL`: Same as `NEXTAUTH_URL`.
- `REDIS_URL`: URL for your production Redis.

### Build & Deploy
The `vercel.json` file handles the build configuration. The `postinstall` script in `package.json` ensures the Prisma client is generated on every deployment.

```bash
# Manual build check
npm run build
```

---

## 📜 License
This project is private and for internal use only.
