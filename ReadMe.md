# 🏦 Bank Management System API

> A robust, secure, and fully relational backend API for managing core banking operations.

This project was developed to demonstrate advanced relational database management, secure API design, and strict architectural standards. It is built with Node.js, Express, and TypeScript. To showcase deep database proficiency, this project **strictly avoids ORMs**, relying entirely on **Raw SQL** (via `pg`) and PostgreSQL's native capabilities like Triggers, Views, and Check Constraints.

## ✨ Key Features

- **Advanced Relational Database Design:** Fully normalized database up to 3NF, ensuring data integrity and zero redundancy.
- **Raw SQL Implementation:** Direct execution of parameterized queries to interact with the database.
- **Automated Database Logic:**
  - **Triggers:** Automatically updates account balances upon transaction inserts.
  - **Views:** Aggregates complex relational data (e.g., unified customer and account details) for cleaner API responses.
- **Robust Security:**
  - Complete mitigation of **SQL Injection** using Parameterized Queries.
  - Password hashing utilizing `bcrypt`.
  - Stateless authentication and session management via **JWT (JSON Web Tokens)**.
  - Role-Based Access Control (**Authorization**) for `Administrator` and `Employee` tiers.
- **Interactive API Docs:** Auto-generated, interactive Swagger UI documentation.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg` / `node-postgres`)
- **Security:** `jsonwebtoken`, `bcrypt`
- **Documentation:** `swagger-jsdoc`, `swagger-ui-express`

## 📦 Core Modules

1. **Authentication & Security:** User registration, secure login, and role-based route protection.
2. **Customer Management:** Registering, updating, and searching customer profiles (Restricted to Employees).
3. **Account Management:** Opening and closing accounts, and fetching details via SQL Views.
4. **Transaction Processing:** Handling deposits, withdrawals, and transfers with strict database `CHECK` constraints to prevent negative balances.
5. **Loan Management:** Registering loans, tracking statuses, and processing installment payments using complex SQL aggregations (`json_agg`).
6. **Employee Administration:** Secure endpoint for managing branch staff (Restricted to Administrators).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)

### Installation

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/YOUR-USERNAME/bank-management-system.git](https://github.com/YOUR-USERNAME/bank-management-system.git)
   cd bank-management-system
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Database Setup:**
   - Create a PostgreSQL database named `bank_db`.
   - Run the provided SQL script to build the schema, insert seed data, and create triggers/views:
     ```bash
     psql -U postgres -d bank_db -f ./database/schema.sql
     ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and configure the following variables:

   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=bank_db
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key
   PORT=3000
   ```

5. **Run the Application:**
   ```bash
   # Run in development mode (with hot-reload)
   npm run dev
   ```

## 📖 API Documentation (Swagger)

Once the server is running, the interactive API documentation is available at:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

You can use the Swagger UI interface to authenticate, attach your Bearer Token, and test all available endpoints directly from your browser.

## 🔒 Security Notice

This project adheres to strict database security guidelines. User inputs are never concatenated directly into SQL strings. All endpoints processing financial data or sensitive user information are protected and require a valid JWT Bearer Token with the appropriate role permissions.
