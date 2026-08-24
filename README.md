# MediFlow — Clinical Healthcare Management Platform

MediFlow is a modern clinical workspace featuring intelligent appointment scheduling, AI pre-visit & post-visit summaries, automated email notifications, and Google Calendar synchronization.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and provide your credentials:
```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret string for signing authentication tokens
- `OPENROUTER_API_KEY` — API key for OpenRouter LLM pre/post-visit summaries
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` — Email notifications
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — Google Calendar integration

### 3. Database Migration
```bash
npx drizzle-kit push
```

### 4. Build and Start
```bash
npm run build
npm start
```
The application will run on `http://localhost:3000`.

---

## 📅 Google Calendar Integration Setup

To enable Google Calendar synchronization:

1. **Create or Select a Google Cloud Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing project.

2. **Enable Google Calendar API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Google Calendar API** and click **Enable**.

3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** > **OAuth consent screen**.
   - Select **External** (or **Internal** for Workspace organizations).
   - Fill in the required application details (App Name: *MediFlow*, User Support Email).
   - Under **Scopes**, add `https://www.googleapis.com/auth/calendar.events`.
   - Under **Test Users**, add the Google email addresses of users testing the integration while the app is in testing mode.

4. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Select **Application type**: **Web application**.
   - Name: *MediFlow Web Client*.
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:3000/api/calendar/callback` (for local development)
     - `https://<your-domain>/api/calendar/callback` (for production)

5. **Configure Environment Variables in `.env`**:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
   ```

---

## 💊 Medication Reminder System

MediFlow provides an automated, deterministic medication reminder engine that translates clinical prescriptions into timely patient notifications without altering medical dosages or instructions.

### 1. Architecture & Data Model
- **`medication_reminders` Table**:
  - `id`: Primary key
  - `appointment_id`: Reference to completed consultation
  - `patient_id`: Reference to patient
  - `medication_name`: Name of medication
  - `dosage`: Prescribed dosage (e.g., `650mg`, `500mg`, `10ml`)
  - `instructions`: Doctor's instructions (e.g., `Take after meals`, `With water`)
  - `frequency`: Dosage schedule description (e.g., `Twice daily`, `Every 8 hours`)
  - `start_date`: Start timestamp
  - `end_date`: End timestamp calculated from prescribed course duration
  - `reminder_time`: Comma-separated scheduled times (e.g., `09:00,21:00`)
  - `status`: `ACTIVE`, `COMPLETED`, or `CANCELLED`
  - `last_sent_at`: Timestamp of latest reminder dispatched

### 2. Supported Schedules
The deterministic parser safely extracts the following frequencies into standardized reminder slots:
- **Once daily (OD / QD)**: `09:00`
- **Twice daily (BD / BID)**: `09:00, 21:00`
- **Three times daily (TID / TDS)**: `08:00, 14:00, 20:00`
- **Four times daily (QID / QDS)**: `08:00, 12:00, 16:00, 20:00`
- **Every 8 hours (q8h)**: `08:00, 16:00, 00:00`
- **Every 6 hours (q6h)**: `06:00, 12:00, 18:00, 00:00`
- **Every 12 hours (q12h)**: `08:00, 20:00`
- **Once daily Morning / Night**: `08:00` / `21:00`
- **As needed (PRN)**: Stored as active prescription without arbitrary automated alerts.

### 3. Background Scheduler & Duplicate Prevention
- **5-Minute Polling Cycle**: Evaluates active medication courses and checks if current time matches any scheduled reminder slots.
- **Deterministic Deduplication**: Uses occurrence-level idempotency keys (`med_reminder_<reminderId>_<date>_<time>`) backed by database constraints on `notification_logs`.
- **Zero Duplicates**: Multiple scheduler cycles in the same time window will never send duplicate emails.

### 4. Failure Isolation & Retries
- **Asynchronous Execution**: Email dispatch runs asynchronously and never blocks consultation completion or dashboard operations.
- **Backoff Retry**: Failed transient email attempts are queued in `notification_logs` and retried up to 3 times with exponential backoff.

### 5. Expiration & Cancellation Handling
- When `current time > end_date`, reminder status transitions automatically to `COMPLETED` and alerts cease.
- When an appointment is cancelled or invalidated by physician leave, associated active reminders transition immediately to `CANCELLED`.

### 6. API Endpoints
- `GET /api/medications/reminders`: Returns medication reminders for the authenticated patient with role-based access control.
- `GET /api/appointments/:id`: Includes `medicationReminders` array for the appointment.

