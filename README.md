# Backend Ledger Service

A robust, double-entry ledger backend system built with Node.js, Express, and MongoDB. This service handles user authentication, account management, and secure financial transactions using atomicity and idempotency.

## 🌐 Live Deployment

The project is live and hosted on Render:
**[https://backend-ledger-5vxa.onrender.com/](https://backend-ledger-5vxa.onrender.com/)**

## 🚀 Features

- **Authentication & Authorization**
  - Secure user registration and login with bcrypt password hashing.
  - JWT-based authentication via cookies and headers.
  - Role-based access control (Admin/System vs. Standard User).
- **Account Management**
  - Users can create and manage multiple financial accounts in different currencies.
  - Real-time balance derivation via ledger aggregation (no stale balance states).
- **Immutable Ledger System**
  - All transactions require matching DEBIT and CREDIT ledger entries.
  - Ledger entries are strictly immutable at the MongoDB schema level.
- **Secure Transactions**
  - **Idempotency Keys:** Prevents duplicate transactions caused by network retries.
  - **MongoDB Transactions:** Ensures atomicity (all-or-nothing execution) during funds transfer.
  - Status tracking (`PENDING`, `COMPLETED`, `FAILED`, `REVERSED`).
- **Notifications**
  - Automated transactional and registration emails via Nodemailer.

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Database:** MongoDB & Mongoose
- **Security:** bcryptjs, jsonwebtoken, cookie-parser
- **Email:** Nodemailer

## 📁 Project Structure

```
backend-ledger/
├── src/
│   ├── config/          # Environment and Database configuration
│   ├── controllers/     # Route logic (Auth, Account, Transaction)
│   ├── middlewares/     # JWT Verification, Role validations
│   ├── models/          # Mongoose Schemas (User, Account, Ledger, Transaction)
│   ├── routes/          # Express route definitions
│   └── services/        # Email and external services
├── app.js               # Express application setup
├── server.js            # Node HTTP server entry point
└── package.json
```

## ⚙️ Setup & Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sumit6511/backend-ledger
   cd backend-ledger
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and configure the following variables:

   ```env
   PORT=3000
   MONGO_URI=<Your MongoDB Connection String (Must support replica sets for sessions/transactions)>
   JWT_SECRET_KEY=<Your JWT Secret>
   ```

4. **Start the Application:**
   - **Development Mode** (with Nodemon):
     ```bash
     npm run dev
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register a new user.
- `POST /login` - Authenticate and receive a JWT.
- `POST /logout` - Invalidate the current session.

### Accounts (`/api/accounts`)

- `POST /create` - Create a new account for the authenticated user.
- `GET /` - Retrieve all accounts owned by the authenticated user.
- `GET /balance/:accountId` - Retrieve the dynamically aggregated balance of an account.

### Transactions (`/api/transactions`)

- `POST /create` - Initiate a secure transfer between two accounts. Requires an `idempotencyKey` in the request body.
- `POST /system/initial-funds` _(Admin Only)_ - Seed an account with initial funds from the SYSTEM account.

## 🔒 Security & Best Practices

- **Double-Entry Accuracy:** Balances are never updated statically. They are dynamically reduced by `SUM(CREDIT) - SUM(DEBIT)` directly from actual ledger rows.
- **Mongoose Sessions:** Crucial transfers execute within `session.startTransaction()` guaranteeing data consistency across multiple collections.
- **Immutability Hooks:** `ledger.model.js` uses Mongoose pre-hooks (`findOneAndUpdate`, `updateOne`, `deleteOne`, etc.) to absolutely forbid updates or deletes to existing ledger rows.

## 📄 License

This project is licensed under the ISC License.
