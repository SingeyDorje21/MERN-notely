# MERN Notely 📝

Notely is a feature-rich, full-stack note-taking web application built using the MERN stack. It features robust user authentication, a modern responsive glassmorphic user interface, secure notes management, rate limiting, and standard database migrations.

---

## 🛠 Tech Stack

### Frontend
- **Framework & Build Tool:** [React (v19)](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing:** [React Router (v7)](https://reactrouter.com/)
- **Styling:** [Tailwind CSS (v3)](https://tailwindcss.com/) & [daisyUI (v4)](https://daisyui.com/) for rich, premium dark components
- **Icons & Alerts:** [Lucide React](https://lucide.dev/) & [React Hot Toast](https://react-hot-toast.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)

### Backend
- **Server Framework:** [Express.js](https://expressjs.com/) on [Node.js](https://nodejs.org/)
- **Database Object Modeling:** [Mongoose](https://mongoosejs.com/) / MongoDB
- **Authentication:** [Passport.js](http://www.passportjs.org/) (Google OAuth 2.0 Strategy) & [JSON Web Token (JWT)](https://jwt.io/)
- **Middleware:** Cookie Parser, CORS, Express JSON parser
- **Rate Limiting:** [@upstash/ratelimit](https://upstash.com/) + [@upstash/redis](https://upstash.com/) for distributed sliding-window rate limiting (gracefully degrades to direct access if Redis is unavailable)

---

## 📂 Project Structure

The project is structured as a monorepo containing distinct frontend and backend directories:

```text
MERN-notely/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Passport, & Upstash Redis configurations
│   │   │   ├── db.js
│   │   │   ├── passport.js
│   │   │   └── upstash.js
│   │   ├── controllers/     # Controller logic for endpoints
│   │   │   └── notesController.js
│   │   ├── middleware/      # Rate limiter & JWT verification middleware
│   │   │   ├── rateLimiter.js
│   │   │   └── verifyToken.js
│   │   ├── models/          # Mongoose DB schemas (User, Note)
│   │   │   ├── Note.js
│   │   │   └── User.js
│   │   ├── routes/          # API endpoint routes (Auth, Notes)
│   │   │   ├── authRoutes.js
│   │   │   └── notesRoutes.js
│   │   ├── scripts/         # Database migration scripts
│   │   │   └── migrateNotes.js
│   │   └── server.js        # Main Express application entry point
│   ├── .env                 # Backend environment variables (ignored by git)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Navbar, NoteCard, ProtectedRoute, etc.)
│   │   │   ├── DeleteConformationModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NoteCard.jsx
│   │   │   ├── NotesNotFound.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RateLimitedUI.jsx
│   │   ├── context/         # Auth context provider (tracks authenticated user state)
│   │   │   └── AuthContext.jsx
│   │   ├── pages/           # Pages (Home, Detail, Create, Login)
│   │   │   ├── CreatePage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── NoteDetailPage.jsx
│   │   ├── App.jsx          # React app routes configuration
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── README.md
└── package.json             # Root package.json with scripts for building & starting
```

---

## ⚙️ Environment Variables Setup

To run the application, configure a `.env` file under the `/backend` directory.

Create a file named `backend/.env` with the following variables:

```env
PORT=5001
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/notely?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

---

## 🚀 Getting Started

### 1. Install Dependencies

You can install dependencies for both the frontend and backend using the build command in the root folder, or navigate to each directory manually:

**Option A: Automated Root Build Command**
```bash
npm run build
```

**Option B: Manual Installation**
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Database Migration (Optional)

If migrating from an older schema where notes did not require a `userId`, run the one-off migration script to clean up legacy data:

```bash
node backend/src/scripts/migrateNotes.js
```

### 3. Run Locally

Start both servers in development mode:

**Backend:**
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5001` (or your configured `PORT`).

**Frontend:**
```bash
cd frontend
npm run dev
```
The development server will run on `http://localhost:5173`.

---

## 🔒 Authentication Flow

Notely uses a secure OAuth-based authentication system:
1. **Initiation:** The user visits `/login` and clicks the **Sign in with Google** button, hitting `/api/auth/google`.
2. **Google OAuth 2.0:** Passport.js handles the redirection to Google's consent page and processes the callback.
3. **Session Issuance:** Upon successful authentication, the backend signs a JSON Web Token (JWT) containing the user's MongoDB `_id` and sets it in an `httpOnly`, `sameSite: "lax"`, and `secure` (in production) cookie named `token`.
4. **State Hydration:** On page load, the React app's `AuthContext` requests `/api/auth/me` to fetch the logged-in user profile, enabling page-level protection via the `ProtectedRoute` wrapper.

---

## 🛡️ Rate Limiting

The API implements a sliding window rate limiter allowing **100 requests per minute** per client.
- Powered by Upstash Redis.
- Gracefully degrades: If the Redis client fails to connect or errors out, the backend logs the warning and permits requests to pass through uninterrupted.
