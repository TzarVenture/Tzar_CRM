# 🚀 Tzar Enterprise CRM — Multi-Brand Sales & Operations Platform

> A production-grade Enterprise Sales, Multi-Brand Lead Ingestion, Meta WhatsApp Business API Chat, and Client Onboarding CRM built for the **Tzar Group** holding company and its 4 core business entities:
>
> 1. **Tzar Venture (`tzar`)**: Digital Marketing, Web Development, Creative & Tech Agency.
> 2. **Adshalaa (`adshalaa`)**: EdTech, Online & Offline Professional Certification Platform.
> 3. **CrownLeaf (`crownleaf`)**: Corporate Gifting & Merchandise Store.
> 4. **Titepo (`titepo`)**: Kids Toys & Return Gifts E-Commerce Store.

---

## 🌟 Core Features

- 🏢 **Multi-Tenant Brand Centralization**: Single MongoDB Atlas database storing and managing leads, chat conversations, clients, files, and ad metrics cleanly segregated by brand slug (`tzar`, `adshalaa`, `crownleaf`, `titepo`).
- ⚡ **High-Density Smart Lead Grid Workspace**: Replaces clunky Kanban boards with a fast, virtualized data grid featuring brand filter pills, SLA countdown timers, stage KPI counters, and slide-over lead workspace drawers.
- 💬 **Meta WhatsApp Cloud API Live Chat**: 2-way conversation console, Meta HSM template messaging, automated chatbot flow builder, and bulk broadcast campaigns.
- 📥 **Real-Time Ingestion API (`POST /api/v1/ingest`)**: High-performance REST endpoint for Next.js websites (Tzar & Adshalaa), Shopify (CrownLeaf), and WordPress (Titepo) form submissions.
- 🎯 **Meta Facebook Lead Ads Webhooks (`POST /api/v1/webhooks/meta`)**: Direct Graph API integration receiving instant Facebook Lead Ads forms across all Meta Pages.
- 🔐 **NextAuth.js v5 Authentication & RBAC**: Role-based permissions (`SUPER_ADMIN`, `BDE`, `ACCOUNT_MANAGER`), password hashing, and secure sessions.
- 📁 **Centralized File Vault**: Categorized document management across leads & clients (Proposals, Invoices, Studio Shoots, NDAs, Brand Assets).
- 🔑 **Client Onboarding Portal**: Client-facing portal (`/portal/[clientId]`) with passcode authentication for onboarding checklists and deliverable access.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components + Client Modules)
- **Language**: TypeScript 5 (Strict Mode, 0 Errors)
- **Styling**: Tailwind CSS v4 + Lucide Icons + Custom Tzar Glass Design System
- **Database**: MongoDB Atlas via Mongoose ODM 8
- **Authentication**: NextAuth.js v5 + bcryptjs
- **API Transport**: Axios + Zod Schema Validation

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
cd tzar-crm
npm install
```

### 2. Environment Variables Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Ensure `.env.local` includes:
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MongoDB Atlas Database URI
MONGODB_URI=mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority

# NextAuth v5 Secret
AUTH_SECRET=tzar_crm_dev_secret_key_8f9a2b4c6e1d3f5a7b9c1d3e5f7a9b1c
NEXTAUTH_URL=http://localhost:3000

# Ingestion API Key (Used by Tzar & Adshalaa websites)
TZAR_INGEST_API_KEY=tzar_live_ingest_key_demo

# Meta Cloud API Credentials
WHATSAPP_PHONE_NUMBER_ID=1285212938002596
WHATSAPP_PERMANENT_ACCESS_TOKEN=EAATfTEm...
WHATSAPP_VERIFY_TOKEN=tzar_whatsapp_webhook_verify_token_2026
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Bootstrap Default Accounts & Pipelines
Open [http://localhost:3000/api/seed](http://localhost:3000/api/seed) once to seed default super admin user, BDE user, and multi-brand sample leads.

**Default Login Credentials**:
- **Super Admin**: `admin@tzar.agency` / `admin123`
- **BDE (Sales Rep)**: `bde@tzar.agency` / `bde123`

---

## 🔌 Web App Ingestion Code Snippet (For Tzar & Adshalaa)

Paste this 10-line fetch code inside your Next.js website form submit API handlers (`/api/contact` or `/api/submit-form`):

```javascript
try {
  await fetch("http://localhost:3000/api/v1/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tzar-api-key": process.env.TZAR_INGEST_API_KEY || "tzar_live_ingest_key_demo",
    },
    body: JSON.stringify({
      business: "tzar", // Use "tzar" for Tzar website, "adshalaa" for Adshalaa website
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city || "",
      country: formData.country || "India",
      interestedServices: formData.services || [],
      requirementsMessage: formData.message || "",
      tzarData: {
        domainName: formData.domain || "",
      },
    }),
  });
} catch (crmErr) {
  console.error("Central CRM Ingestion Error:", crmErr);
}
```

---

## 🎯 Meta Lead Ads Webhook Setup

1. Go to [Meta for Developers](https://developers.facebook.com/) ➔ Create a Business App.
2. Add **Webhooks** product ➔ Select **Page** object.
3. Subscribe to **`leadgen`** event:
   - **Callback URL**: `https://your-crm-domain.com/api/v1/webhooks/meta`
   - **Verify Token**: `tzar_whatsapp_webhook_verify_token_2026`
4. Map Facebook Page IDs in `src/app/api/v1/webhooks/meta/route.ts` to automatically route incoming ad leads to `crownleaf`, `titepo`, `adshalaa`, or `tzar`.

---

## 📦 Production Deployment

### Deploy on Vercel (Recommended)
1. Push code to GitHub repository.
2. Import project in [Vercel](https://vercel.com/).
3. Add environment variables from `.env.local`.
4. Click **Deploy**.
5. Trigger `https://your-app.vercel.app/api/seed` once to bootstrap production database.

---

## 📄 License
Internal Proprietary Software — **Tzar Venture Holdings & Associated Entities**. All rights reserved.
