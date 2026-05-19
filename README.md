# MediSense 🏥

> **Real-time hospital ward monitoring platform for ICU & clinical teams.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-medisense--peach.vercel.app-blue?style=for-the-badge&logo=vercel)](https://medisense-peach.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

---

## 🌐 Live Demo

**[https://medisense-peach.vercel.app/](https://medisense-peach.vercel.app/)**

---

## 📖 Overview

MediSense is a real-time hospital ward monitoring dashboard designed for clinical teams managing ICU and general ward patients. It provides live patient vitals, bed status tracking, IV fluid gauges, and instant critical alerts — all in a clean, role-aware interface.

---

## ✨ Features

- 🛏️ **Ward Overview** — Live bed grid showing patient status, occupancy, and vitals at a glance
- 📊 **Patient Detail** — Time-series vitals charts (heart rate, SpO₂, BP, temperature) with historical readings
- 🚨 **Alert System** — Real-time critical alert banners with toast notifications for threshold breaches
- 💉 **IV Gauge** — Visual fluid level indicators per patient bed
- 👤 **Role-Based Auth** — Nurse, doctor, and admin roles with protected routes
- 🛠️ **Admin Panel** — User management, ward configuration, and system settings
- 📱 **PWA Support** — Installable on mobile/tablet for bedside use
- ⚡ **Realtime Sync** — Supabase Realtime subscriptions for live data updates without polling

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Edge Functions | Supabase Edge Functions (Deno) |
| Deployment | Vercel |

---

## 🗂️ Project Structure

```
medisense/
├── public/                  # Static assets & PWA icons
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # App shell with nav & sidebar
│   │   ├── BedCard.jsx      # Individual bed status card
│   │   ├── AlertBanner.jsx  # Top-bar critical alert strip
│   │   ├── AlertToast.jsx   # Toast notification popups
│   │   ├── IVGauge.jsx      # IV fluid level gauge
│   │   ├── ReadingsChart.jsx# Vitals time-series chart
│   │   ├── AddPatientModal.jsx
│   │   ├── EditPatientModal.jsx
│   │   └── SessionModal.jsx
│   ├── context/             # React Context providers
│   │   ├── AuthContext.jsx  # Authentication state
│   │   ├── AlertContext.jsx # Alert/notification state
│   │   ├── WardContext.jsx  # Ward & bed data state
│   │   └── RealtimeContext.jsx # Supabase Realtime subscriptions
│   ├── pages/               # Route-level page components
│   │   ├── LoginPage.jsx
│   │   ├── WardOverviewPage.jsx
│   │   ├── PatientDetailPage.jsx
│   │   ├── AlertsPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── SettingsPage.jsx
│   └── utils/
│       └── supabase.js      # Supabase client initialization
└── supabase/
    └── functions/           # Supabase Edge Functions
        ├── ingest-reading/  # IoT device data ingestion
        ├── create-user/     # Managed user creation
        └── check-offline-devices/ # Device health checks
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### 1. Clone the repo

```bash
git clone https://github.com/Shubhk02/MediSense.git
cd MediSense/medisense
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `medisense/` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. Fork this repo
2. Import it into [Vercel](https://vercel.com/)
3. Set the root directory to `medisense`
4. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in Vercel's project settings
5. Deploy 🚀

---

## 📄 License

MIT © [Shubh](https://github.com/Shubhk02)
