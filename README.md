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
