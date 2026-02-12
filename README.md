# Healthi Marketplace

A comprehensive e-commerce platform for health and wellness products with employer-funded health wallet integration.

## 🎯 Features

### User Storefront
- **Product Catalog** with advanced filtering and search
- **Wallet & Rewards Integration** for flexible payment options
- **Multi-Category Support** (Fitness, Nutrition, Medical, Mental Health, Testing)
- **Product Cards** with badges, ratings, and discount display
- **Responsive Design** matching Figma specifications
- **Shopping Cart** with real-time updates
- **Order Management** with status tracking

### Admin Panel
- **Dashboard** with key metrics and analytics
- **Product Management** with bulk operations
- **Order Processing** with multi-vendor support
- **Vendor Management** with onboarding and settlements
- **CMS** for banners, pages, and homepage builder
- **Analytics & Reporting**
- **Role-Based Access Control** (RBAC)

## 🎨 Design System

Based on Figma specifications:
- **Primary Color:** #00A59B (Teal)
- **Accent Colors:** #FFC600 (Gold), #0031A7 (Blue)
- **Typography:** Raleway (headings), Source Sans Pro (body)
- **Components:** Modern, premium UI with micro-animations

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Backend (To be implemented)
- Node.js + Express
- PostgreSQL + Prisma
- Redis (caching)
- JWT authentication
- Razorpay integration

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## 🔐 Healthi Program Validation (External)

This marketplace assumes employer program setup is managed in Healthi and validates wallet/reward spend externally during checkout when configured.

### Environment Variables

- `HEALTHI_VALIDATE_URL`  
  Checkout-time validation endpoint provided by Healthi.
- `HEALTHI_API_KEY`  
  Optional API key sent as `x-api-key`.
- `HEALTHI_ENFORCEMENT_MODE`  
  `strict` (default) or `permissive`.
  - `strict`: block checkout if Healthi validation is unavailable/invalid.
  - `permissive`: log failure and fallback to local eligibility rules.
- `HEALTHI_TIMEOUT_MS`  
  Optional timeout for Healthi validation call. Default: `4000`.

### Checkout Behavior

1. Marketplace computes local eligibility from product flags (`wallet_eligible`, `rewards_eligible`).
2. If `HEALTHI_VALIDATE_URL` is configured, marketplace sends cart + requested wallet/rewards to Healthi.
3. Healthi returns approved split (`wallet`, `rewards`, `cash`).
4. Marketplace enforces the approved split and places the order.

## 📁 Project Structure

```
healthi-marketplace/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── layout/      # Layout components
│   │   ├── products/    # Product-related components
│   │   └── admin/       # Admin panel components
│   ├── lib/             # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global styles
├── public/              # Static assets
└── ...config files
```

## 🎯 Core Features Implemented

✅ Design system with brand colors and typography  
✅ Responsive Header with search, wallet display, and cart  
✅ Product Card component with badges and ratings  
✅ Homepage with hero section and category grid  
✅ TypeScript types for all entities  
✅ Utility functions for formatting and validation  

## 📝 Next Steps

### Phase 1 - User Storefront
- [ ] Product listing page with filters
- [ ] Product detail page
- [ ] Shopping cart functionality
- [ ] Checkout flow with wallet integration
- [ ] Order confirmation and tracking
- [ ] User profile and order history

### Phase 2 - Admin Panel
- [ ] Admin authentication and RBAC
- [ ] Dashboard with analytics
- [ ] Product management CRUD
- [ ] Order management and processing
- [ ] Vendor onboarding and management
- [ ] CMS for banners and pages

### Phase 3 - Backend Integration
- [ ] REST API with Express
- [ ] Database schema with Prisma
- [ ] JWT authentication
- [ ] Healthi API integration (SSO, Wallet, Eligibility)
- [ ] Payment gateway integration (Razorpay)
- [ ] Email notifications

### Phase 4 - Advanced Features
- [ ] Real-time inventory updates
- [ ] Advanced analytics and reporting
- [ ] Recommendation engine
- [ ] Multi-language support
- [ ] Mobile app optimization

## 📚 Documentation

- [Product Requirements Document (PRD)](./Healthi_Marketplace_PRD_FINAL.md)
- [Admin Panel Technical Spec](./Admin_Panel_Technical_Spec.md)

## 🎨 Design Reference

- Figma URL: https://www.figma.com/design/FzfI440nb9pdcYJjrzv5LN/Healthi-Trackers

## 👥 Team

Built for Healthi - Making healthcare accessible and affordable.

## 📄 License

Proprietary - All rights reserved.

---

**Built with ❤️ for a healthier India**
