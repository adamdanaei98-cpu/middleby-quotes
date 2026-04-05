# Middleby QuoteCraft — Food Processing Equipment Quotes

Full-stack quote management system for Middleby Food Processing (RapidVisionPak, Thurne, PacProInc).

## Tech Stack

- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT (HTTP-only cookies) + bcrypt password hashing
- **Hosting:** Vercel (recommended)
- **Database hosting:** Neon or Supabase (free tier)

---

## Quick Start (5 minutes)

### 1. Get a database

Go to [neon.tech](https://neon.tech) and create a free PostgreSQL database.
Copy the connection string — it looks like:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Set up the project

```bash
# Clone or download this folder
cd middleby-quotes

# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# Edit .env and paste your database URL
# Also change JWT_SECRET to a random string
```

### 3. Set up the database

```bash
# Push the schema to your database
npx prisma db push

# Seed with demo data (users, customers, companies, catalog)
npx prisma db seed

# Optional: open Prisma Studio to browse your data
npx prisma studio
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL = your Neon connection string
# JWT_SECRET = your random secret
```

Or push to GitHub and connect the repo to [vercel.com](https://vercel.com).

---

## Demo Accounts

| Name             | Email                       | Password    | Role         |
|------------------|-----------------------------|-------------|--------------|
| John Smith       | jsmith@middleby.com         | sales123    | Salesperson  |
| Sarah Johnson    | sjohnson@middleby.com       | review123   | Reviewer     |
| Mike Chen        | mchen@middleby.com          | manager123  | Manager      |
| Lisa Rodriguez   | lrodriguez@middleby.com     | super123    | Supervisor   |

---

## Project Structure

```
middleby-quotes/
├── app/
│   ├── layout.js              # Root layout (fonts, metadata)
│   ├── page.js                # Root redirect
│   ├── globals.css            # Tailwind + base styles
│   ├── (auth)/
│   │   └── login/page.js      # Login screen
│   ├── (dashboard)/
│   │   ├── layout.js          # Auth check + nav bar
│   │   ├── builder/page.js    # Quote builder
│   │   ├── margin/page.js     # Margin calculator
│   │   ├── pdf/page.js        # PDF preview
│   │   └── admin/page.js      # Admin panel
│   └── api/
│       ├── auth/
│       │   ├── login/route.js  # POST login
│       │   ├── logout/route.js # POST logout
│       │   └── me/route.js     # GET current user
│       ├── customers/route.js  # GET/POST customers
│       ├── quotes/
│       │   ├── route.js        # GET/POST quotes
│       │   └── [id]/route.js   # GET/PATCH single quote
│       └── catalog/route.js    # GET catalog
├── components/
│   ├── AuthProvider.js         # Auth context
│   └── NavBar.js               # Navigation bar
├── lib/
│   ├── auth.js                 # JWT + user helpers
│   └── db.js                   # Prisma client
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.mjs                # Demo data seed
└── package.json
```

---

## Database Schema

- **User** — accounts with bcrypt passwords, roles, company access
- **Customer** — customer database (name, plant, address, contacts)
- **Company** — sub-brands (RVP, Thurne, PacPro) with colors, rates, logos
- **CatalogSection** — sections within each company
- **CatalogItem** — items with fixed/variable pricing, options
- **Quote** — full quote with status workflow, selections snapshot
- **AuditLog** — who did what, when

## Quote Workflow

```
Draft → Submitted (by salesperson)
     → Reviewed (by reviewer)
     → Approved (by manager)
     → Rejected (at any stage by reviewer/manager)
```

## Role Permissions

| Action              | Salesperson | Reviewer | Manager | Supervisor |
|---------------------|:-----------:|:--------:|:-------:|:----------:|
| Create quotes       | ✓           | ✓        | ✓       | ✓          |
| See own quotes      | ✓           | ✓        | ✓       | ✓          |
| See submitted quotes|             | ✓        |         | ✓          |
| Review quotes       |             | ✓        |         | ✓          |
| See reviewed quotes |             |          | ✓       | ✓          |
| Approve quotes      |             |          | ✓       | ✓          |
| Admin panel         |             |          | ✓       | ✓          |
| See ALL quotes      |             |          |         | ✓          |
