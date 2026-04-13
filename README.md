# ◆ NoteKeeper — Full-Stack Notepad App

A clean, secure, full-stack notepad application built with:
- **Frontend**: Vanilla HTML + CSS + JavaScript (no frameworks)
- **Backend**: Node.js + Express.js (REST API)
- **Database**: MongoDB + Mongoose (ODM)
- **Auth**: JWT tokens + bcrypt password hashing

---

## 📁 Project Structure

```
notepad-app/
├── backend/
│   ├── controllers/
│   │   ├── authController.js    ← Register & login logic
│   │   └── noteController.js    ← CRUD operations for notes
│   ├── middleware/
│   │   └── authMiddleware.js    ← JWT verification
│   ├── models/
│   │   ├── User.js              ← Mongoose User schema
│   │   └── Note.js              ← Mongoose Note schema
│   ├── routes/
│   │   ├── authRoutes.js        ← /api/auth/*
│   │   └── noteRoutes.js        ← /api/notes/*
│   ├── .env.example             ← Environment variable template
│   ├── package.json
│   └── server.js                ← Express entry point
├── frontend/
│   ├── index.html               ← Single-page app (auth + notepad)
│   ├── style.css                ← All styles
│   └── app.js                   ← All frontend JS logic
└── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or newer
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally
  - OR use a free cloud cluster: [MongoDB Atlas](https://www.mongodb.com/atlas)

---

### Step 1 — Clone / Download the project

```bash
# If using git
git clone <repo-url>
cd notepad-app

# Or just navigate to the project folder
cd notepad-app
```

---

### Step 2 — Set up environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
MONGO_URI=mongodb://localhost:27017/notepadapp
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
```

> **MongoDB Atlas users**: Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/notepadapp`

---

### Step 3 — Install dependencies

```bash
cd backend
npm install
```

---

### Step 4 — Start MongoDB (local only)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows (run in PowerShell as Admin)
net start MongoDB

# Linux (systemd)
sudo systemctl start mongod
```

---

### Step 5 — Start the server

```bash
# From inside the /backend folder:

# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

You should see:
```
✅  MongoDB connected successfully
🚀  Server running on http://localhost:5000
```

---

### Step 6 — Open the App

Visit **http://localhost:5000** in your browser.

The Express server serves the frontend static files automatically.

---

## 🔌 REST API Reference

| Method | Endpoint              | Auth Required | Description                  |
|--------|-----------------------|:-------------:|------------------------------|
| POST   | `/api/auth/register`  | ✗             | Register a new user          |
| POST   | `/api/auth/login`     | ✗             | Login and receive JWT token  |
| GET    | `/api/notes`          | ✓             | Get all notes for the user   |
| POST   | `/api/notes`          | ✓             | Create a new note            |
| GET    | `/api/notes/:id`      | ✓             | Get a single note by ID      |
| DELETE | `/api/notes/:id`      | ✓             | Delete a note by ID          |

**Auth header format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Request / Response Examples

### Register
```json
POST /api/auth/register
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123"
}

Response 201:
{
  "message": "Registration successful!",
  "token": "<jwt>",
  "user": { "id": "...", "username": "alice", "email": "alice@example.com" }
}
```

### Create Note
```json
POST /api/notes
Authorization: Bearer <token>
{
  "title": "My First Note",
  "content": "Today I learned something new..."
}

Response 201:
{
  "message": "Note saved successfully!",
  "note": {
    "_id": "...",
    "title": "My First Note",
    "content": "Today I learned something new...",
    "userId": "...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🗃 MongoDB Schemas

### User
```js
{
  username:  String  (required, 3-30 chars)
  email:     String  (required, unique)
  password:  String  (required, bcrypt hashed)
  createdAt: Date    (auto)
  updatedAt: Date    (auto)
}
```

### Note
```js
{
  title:     String              (required, max 100 chars)
  content:   String              (required)
  userId:    ObjectId → User     (required, links note to owner)
  createdAt: Date                (auto)
  updatedAt: Date                (auto)
}
```

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (12 salt rounds)
- **JWT tokens** expire after 7 days
- All note routes protected by the `protect` middleware
- Server verifies note ownership before delete
- Frontend escapes all user content to prevent XSS
- CORS configured (restrict to your domain in production)

---

## 🌐 Deploying to Production

1. **Backend**: Deploy to [Railway](https://railway.app), [Render](https://render.com), or any Node host
2. **Database**: Use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available)
3. **Frontend**: Already served by Express — just deploy the whole project
4. Set environment variables on your host:
   - `MONGO_URI` → your Atlas connection string
   - `JWT_SECRET` → a long random string (use `openssl rand -hex 32`)
   - `PORT` → usually set automatically by the host

---

## 🛠 Tech Stack

| Layer     | Technology         |
|-----------|--------------------|
| Runtime   | Node.js            |
| Framework | Express.js 4.x     |
| Database  | MongoDB + Mongoose |
| Auth      | JWT + bcryptjs     |
| Frontend  | Vanilla JS         |
| Fonts     | IBM Plex Mono, Space Mono |
