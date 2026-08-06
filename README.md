# MediQueue — Hospital Queue Management System

A full-stack real-time hospital queue management system that eliminates waiting room chaos. Patients book appointments and track their live queue position from anywhere. Doctors manage their queue in real time. Receptionists handle walk-ins. Admins oversee the entire hospital.

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios
- Socket.io Client
- Lucide React

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JSON Web Tokens (JWT)
- bcrypt
- Nodemailer

---

## Features

### Patient
- Register and log in
- Book appointments by selecting hospital, department, doctor and date
- View live queue position and estimated wait time
- Real-time updates via WebSocket when queue moves
- Cancel appointments
- View full appointment history with doctor's diagnosis notes
- Receive in-app notifications (turn alerts, reminders)

### Doctor
- View today's live queue with current patient being served
- Call in next patient, skip, or mark as done
- Browse this week's full schedule grouped by day
- Add diagnosis notes per appointment
- Pause or resume the queue
- Mark as on leave (auto-cancels today's appointments and notifies patients)
- Configure working days, max patients per day, and slot preference

### Receptionist
- Register walk-in patients (new or existing)
- Search existing patients by name, phone or email
- Book appointments on behalf of patients
- Mark appointments as emergency (moves to front of queue)
- View all registered patients in a table
- View and cancel individual patient appointments

### Admin
- View analytics dashboard — daily volume chart, busiest departments, KPI cards
- Add departments, doctors and receptionists
- View all doctors with status (available / on leave / unavailable)
- System overview with total counts

---

## Project Structure

```
hospital-queue-system/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   └── receptionistController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Appointment.js
│   │   ├── Department.js
│   │   ├── Doctor.js
│   │   ├── Hospital.js
│   │   ├── Notification.js
│   │   ├── Patient.js
│   │   ├── Queue.js
│   │   ├── Receptionist.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   └── receptionistRoutes.js
│   ├── services/
│   │   └── queueService.js
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx
    │   │   ├── DoctorDashboard.jsx
    │   │   ├── Login.jsx
    │   │   ├── PatientDashboard.jsx
    │   │   ├── ReceptionistDashboard.jsx
    │   │   └── RegisterPatient.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── .env
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally **or** a MongoDB Atlas connection string

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/hospital-queue-system.git
cd hospital-queue-system
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/hospital_queue
JWT_SECRET=your_jwt_secret_here
PORT=5000

# Optional — email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

Seed the database with demo data:

```bash
npm run seed
```

Start the backend server:

```bash
npm run dev       # development (nodemon)
npm start         # production
```

The backend runs on `http://localhost:5000`.

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

---

## Demo Accounts

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | adminpassword123 |
| Receptionist | suresh@hospital.com | receppassword123 |
| Doctor — Cardiology | khushi@hospital.com | doctorpassword123 |
| Doctor — Neurology | siddharth@hospital.com | doctorpassword123 |
| Doctor — Pediatrics | rahul@hospital.com | doctorpassword123 |
| Doctor — Dermatology | meera@hospital.com | doctorpassword123 |
| Patient | sanjana@patient.com | patientpassword123 |

> 19 additional patient accounts are seeded with the format `name@patient.com` / `patientpassword123`

---

## API Overview

All routes are prefixed with `/api`.

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Login, register patient, get current user |
| `/api/admin` | Analytics, manage hospitals, departments, doctors, receptionists |
| `/api/doctor` | Profile, live queue, queue actions, schedule, availability |
| `/api/patient` | Book appointments, live tokens, history, notifications |
| `/api/receptionist` | Walk-in booking, patient search, cancel appointments |

All protected routes require a `Bearer <token>` header set automatically by the frontend via Axios interceptor.

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinDoctorRoom` | Client → Server | Subscribe to a doctor's queue updates |
| `joinUserRoom` | Client → Server | Subscribe to a patient's notifications |
| `queueUpdated` | Server → Client | Fired when a doctor's queue changes |
| `notificationReceived` | Server → Client | Fired when a patient receives a notification |

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | No | Server port (default: 5000) |
| `SMTP_HOST` | No | SMTP server for email notifications |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password / app password |
| `SMTP_FROM` | No | Sender email address |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_SOCKET_URL` | Yes | Backend Socket.io URL |

---

## Scripts

### Backend

```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start with node
npm run seed    # Seed database with demo data
```

### Frontend

```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
```

---

## Deployment Notes

- Set `MONGODB_URI` to your MongoDB Atlas connection string in production
- Update CORS origins in `backend/server.js` to include your production frontend URL
- Set `VITE_API_URL` and `VITE_SOCKET_URL` in the frontend `.env` to your deployed backend URL
- The frontend can be deployed to Vercel, Netlify or any static host
- The backend can be deployed to Render, Railway, or any Node.js host

---

## License

MIT
