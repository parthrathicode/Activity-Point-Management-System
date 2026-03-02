# 🎓 Activity Point Management System (APMS) — RVCE

A full-stack web application built for **RV College of Engineering (RVCE)** to digitize and streamline the management of student activity points. The system enables clubs and departments to propose activities, manage approvals through a multi-level hierarchy, and allows students to track their earned points and generate reports.

---

## 🌐 Live Demo

> Deployed on Firebase Hosting

---

## ✨ Features

### 🔐 Role-Based Access Control
The system supports **5 distinct user roles**, each with its own dashboard and permissions:

| Role | Description |
|------|-------------|
| **Dean** | Top-level administrator. Manages counsellors, HODs, clubs, students, and verifies all activities & points. |
| **HOD** | Proposes department-level activities, allocates points to students, and manages department students. |
| **Club** | Proposes club activities, manages activity listings, and allocates points to participating students. |
| **Counsellor** | Reviews student proposals, monitors activity participation, and manages assigned students. |
| **Student** | Views available activities, tracks earned points, and downloads activity reports. |

---

### 📋 Core Modules

- **Activity Proposal & Approval Workflow** — Clubs/HODs propose activities → Counsellors review → Dean gives final approval
- **Point Allocation** — Clubs and HODs allocate points to students after activity completion
- **Point Verification** — Dean verifies and approves point allocations
- **Student Reports** — Students can download their activity point reports as PDF
- **Dashboard Analytics** — Role-specific dashboards with activity and point summaries
- **User Management** — Dean manages all users (counsellors, HODs, clubs, students)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, React Router v7 |
| **Backend / Database** | Firebase Firestore |
| **Authentication** | Firebase Authentication |
| **Hosting** | Firebase Hosting |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **CSV Parsing** | PapaParse |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
src/
├── components/         # Shared layout component
├── config/             # Firebase configuration
├── contexts/           # AuthContext (global auth state)
├── pages/
│   ├── Login.js        # Unified login page
│   ├── Dean/           # Dean dashboard & management pages
│   ├── HOD/            # HOD dashboard & activity pages
│   ├── Club/           # Club dashboard & activity pages
│   ├── Counsellor/     # Counsellor dashboard & review pages
│   └── Student/        # Student dashboard, points & reports
├── App.js              # Route definitions & protected routes
└── index.js            # App entry point
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/parthrathicode/Activity-Point-Management-System.git

# 2. Navigate into the project directory
cd "APMS RVCE"

# 3. Install dependencies
npm install

# 4. Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Firebase Setup

This project uses Firebase for authentication, database, and hosting.

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable **Authentication** (Email/Password) and **Firestore Database**
3. Copy your Firebase config and create `src/config/firebase.js`:

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

> ⚠️ Never commit your actual Firebase credentials. Add `src/config/firebase.js` to `.gitignore` if needed.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the app in development mode at `localhost:3000` |
| `npm run build` | Builds the app for production |
| `npm test` | Launches the test runner |

---

## 👥 User Roles & Login

All users log in from a single login page. The system detects the user's role from Firestore and redirects them to their respective dashboard automatically.

---

## 🏫 About

This project was developed as part of an academic initiative at **RV College of Engineering, Bengaluru** to replace manual activity point tracking with a digital, hierarchical approval system.

---

## 📄 License

This project is intended for academic use at RVCE.
