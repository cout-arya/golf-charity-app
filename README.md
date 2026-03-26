# 🏌️ ImpactLinks Golf — Charity Subscription Platform

A subscription-based golf platform where every Stableford round you play contributes to life-changing charities and enters you into a monthly prize draw.

> Built with **React** · **Supabase** · **TailwindCSS** · **Framer Motion** · **Recharts**

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/cout-arya/golf-charity-app.git
cd golf-charity-app

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

The app will be available at **http://localhost:3000**

---

## 🔑 Test Accounts

Two pre-seeded accounts are available for testing all features:

| Role    | Email                        | Password       | Access URL                           |
|---------|------------------------------|----------------|--------------------------------------|
| **Admin** | `admin@impactlinks.test`   | `Admin@1234`   | http://localhost:3000/admin          |
| **User**  | `user@impactlinks.test`    | `User@1234`    | http://localhost:3000/dashboard      |

### Admin Account (`admin@impactlinks.test`)
- Full access to the **Admin Dashboard** with 5 tabs:
  - **Overview** — Platform stats, prize pool growth chart, subscriber count
  - **Users** — View all registered users and their subscription status
  - **Draws Engine** — Simulate random/algorithmic draws, analyze payouts, publish official results
  - **Charities** — Add, edit, and delete charity partners
  - **Winners** — Approve/reject winner proofs and manage payouts
- Has a **Yearly subscription** (active)

### User Account (`user@impactlinks.test`)
- Access to the **User Dashboard**:
  - **Subscription Status** — Active monthly plan with renewal date
  - **Score Tracking** — 5 pre-loaded Stableford scores (33, 25, 41, 18, 29)
  - **Supported Charity** — First Tee, with 10% contribution (adjustable)
  - **Impact Winnings** — 1 pending 3-match win (£75.00, awaiting proof upload)
  - **Participation Summary** — Draw eligibility status
- Has a **Monthly subscription** (active)

---

## 📁 Project Structure

```
golf-charity-app/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable React components
│   │   └── ProtectedRoute.jsx  # Role-based access control
│   ├── context/
│   │   └── AuthContext.jsx     # Auth + subscription state management
│   ├── lib/
│   │   └── supabaseClient.js   # Supabase client initialization
│   ├── pages/
│   │   ├── Landing.jsx         # Public landing page
│   │   ├── Login.jsx           # Auth (sign in / sign up)
│   │   ├── Subscribe.jsx       # Subscription plans + simulated Stripe checkout
│   │   ├── Charities.jsx       # Charity directory with search & select
│   │   ├── Dashboard.jsx       # User dashboard (scores, winnings, charity)
│   │   ├── AdminDashboard.jsx  # Admin panel (users, draws, charities, winners)
│   │   └── Profile.jsx         # User profile settings
│   └── styles/
│       ├── index.css           # Aura Impact design system (CSS variables)
│       └── tailwind.css        # Compiled TailwindCSS output
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql      # Full database schema
│       └── 002_fix_rls_recursion.sql  # RLS infinite recursion fix
├── scripts/
│   └── seed.mjs                # Test data seed script
├── tailwind.config.js          # TailwindCSS configuration
└── package.json
```

---

## 🧩 Key Features

| Feature | Description |
|---------|-------------|
| **Subscription Plans** | Monthly (£9.99) and Yearly (£89.99) with simulated Stripe checkout |
| **Score Tracking** | 5-score rolling system with Stableford validation (1-45) |
| **Monthly Draw** | Random and algorithmic draw modes with 3/4/5-match tiers |
| **Prize Pool** | Auto-calculated: 40% (5-match jackpot), 35% (4-match), 25% (3-match) |
| **Charity Integration** | Select a charity, adjust contribution %, track impact |
| **Winner Verification** | Upload proof → Admin approves → Payout tracked |
| **Admin Dashboard** | Full platform management with analytics |

---

## 🛠️ Tech Stack

- **Frontend**: React (CRA), TailwindCSS, Framer Motion, Recharts, Lucide React
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Row-Level Security)
- **Payment**: Simulated Stripe checkout (ready for production keys)
- **Design**: Aura Impact dark-mode design system with UI/UX Pro Max standards

---

## 📝 Environment Variables

Create a `.env.local` file in the project root:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## 📜 License

This project is developed for Digital Heroes as part of a Full Stack Training program.
