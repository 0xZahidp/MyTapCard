# MyTapCard 🪪

> **One link. Tap. QR. NFC.**  
> Next-generation digital identity and contactless smart business card platform.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack-Router%20%26%20Start-ff4154)](https://tanstack.com/router)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**MyTapCard** is a full-featured digital card and identity solution designed for professionals, creators, and teams. Share your contact info, social presence, portfolio, and payment methods with a single tap or scan.

Live production: [mytapcard.online](https://www.mytapcard.online)

---

## ✨ Features

- **Personalized Public Profile**: Share your branded digital card at `/@username`.
- **NFC & Dynamic QR Codes**: Instant contactless sharing with QR code download and vCard contact export.
- **Interactive Photo Studio**:
  - Client-side image cropping with circular preview, 90° rotation, and zoom controls.
  - Automatic WebP compression client-side to ensure fast loading times.
- **70+ Social & Contact Integrations**: Pre-styled brand icons and deep links for LinkedIn, GitHub, WhatsApp, Telegram, X, Instagram, YouTube, Discord, Spotify, and more.
- **Payment & Financial Channels**: Share payment links and cryptocurrency wallets (bKash, Nagad, Rocket, Stripe, PayPal, Bitcoin, Ethereum, Solana, USDT).
- **Rich Bio Editor**: In-app markdown formatting (bold, italic, custom links, quotes, lists).
- **Pro & Referral Engine**:
  - Earn free Pro days by inviting friends via personal referral links.
  - Short usernames (3–4 chars) reserved for Pro members.
  - Verified badges and custom card themes.
- **Enterprise-Grade Security**:
  - Supabase Auth with email confirmations and Google OAuth support.
  - Secure password management requiring verification of the current password.
  - Postgres Row Level Security (RLS) enforcing access control on all tables and storage buckets.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / [React 19](https://react.dev/)
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based routing)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [DotLottie](https://lottiefiles.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Image Cropping**: [react-easy-crop](https://github.com/ValentinH/react-easy-crop)
- **State & Data Fetching**: [TanStack Query](https://tanstack.com/query)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Supabase](https://supabase.com) project

### 1. Clone the repository

```bash
git clone https://github.com/0xZahidp/MyTapCard.git
cd MyTapCard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment configuration

Copy the template environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and populate your credentials:

```env
VITE_PUBLIC_BASE_URL=http://localhost:3000
AUTH_URL=http://localhost:3000

# Supabase Credentials
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# OAuth (Optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

> **Security Note**: Never commit `.env.local` or sensitive secrets to a public repository. `.env.local` is excluded by default in `.gitignore`.

### 4. Database Setup

Apply the SQL migrations located in `supabase/migrations/` to your Supabase project:

```bash
# Using Supabase CLI:
npx supabase db push
```

Or execute the SQL migration files sequentially in the Supabase SQL Editor.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal) in your browser.

---

## 📁 Project Structure

```
my-tap-card/
├── public/                 # Static assets, brand icons, and animations
│   ├── animations/         # Lottie animation files
│   └── brand-icons/        # 70+ SVG brand and social icons
├── src/
│   ├── components/         # Reusable UI & layout components
│   │   ├── cards/          # Card editor & preview components
│   │   ├── ui/             # Radix UI primitives & styled components
│   │   └── image-crop-dialog.tsx # Interactive avatar cropper modal
│   ├── hooks/              # Custom React hooks (auth, pro status, theme)
│   ├── integrations/       # Supabase client and types
│   ├── lib/                # Utility functions (image compression, crop, OAuth)
│   └── routes/             # TanStack file-based routes
│       ├── _authenticated/ # Protected routes (dashboard, profile, settings, links)
│       └── auth.*          # Authentication routes (login, register, reset-password)
├── supabase/
│   └── migrations/         # PostgreSQL schema & RLS migrations
├── .env.example            # Environment variables template
└── vite.config.ts          # Vite configuration
```

---

## 🔒 Security & Data Protection

- **Row Level Security (RLS)**: Enforced across profiles, links, referrals, and card designs.
- **Server-Side Operations**: Admin-level privileges and Pro approval logic run securely inside Postgres security-definer functions.
- **Client Storage**: All profile images are cropped and compressed before upload to minimize storage footprint and bandwidth.

---

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server |
| `npm run build` | Builds the production bundle |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint |
| `npm run format` | Formats code with Prettier |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
