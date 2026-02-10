# IT Books Library — Project Report

## 1. Introduction

**IT Books Library** is a full-stack web application that allows users to browse and search IT-related books, view book details, and download PDF copies. The system supports two roles: **user** and **admin**. Regular users can only view and search books and download PDFs; administrators can add, edit, and delete books and upload PDF files.

The project was built as a production-ready application using a simple, maintainable stack: Node.js with Express on the backend, MongoDB with Mongoose for the database, and EJS for server-rendered pages. Authentication is implemented with JWT (stored in httpOnly cookies) and bcrypt for password hashing. File uploads are handled with Multer, with PDFs stored on the server filesystem.

---
<img width="1857" height="973" alt="{3D724432-8C06-402D-B4FD-F449215E8198}" src="https://github.com/user-attachments/assets/bc3966ea-d94c-491a-8aef-858d0556c94b" />
<img width="1856" height="972" alt="{19535041-6545-4C1E-BD8E-D00B2D0011CD}" src="https://github.com/user-attachments/assets/ea623448-ea73-4694-a8cb-b419a9117be8" />
<img width="1858" height="975" alt="{C0506AB6-29BD-411A-9630-9A48E129B10F}" src="https://github.com/user-attachments/assets/12bba525-c27a-451e-80ac-48783f00009b" />
<img width="1856" height="975" alt="{9EF16AD8-9D9F-4554-97C0-62DC413E40C7}" src="https://github.com/user-attachments/assets/bd897449-9b4b-46b4-80e4-8d415db17872" />
<img width="1858" height="973" alt="{84415CDB-2A33-4E3E-BD58-B9E043786718}" src="https://github.com/user-attachments/assets/14f9a263-0cc7-4fc5-9d06-b0beab6d39c9" />
## 2. Goals and Requirements

- Provide a clean, usable interface for browsing and searching books by title or author.
- Allow authenticated users to download book PDFs.
- Restrict book management (create, update, delete, upload) to administrators via role-based access control (RBAC).
- Use a clear MVC structure with proper validation and error handling.
- Keep configuration in environment variables and support deployment (e.g. on Render).

---

## 3. Technology Stack

| Layer        | Technology |
|-------------|------------|
| Backend     | Node.js, Express 4.x |
| Database    | MongoDB (Mongoose 8.x) |
| Auth        | JWT (jsonwebtoken), bcryptjs, cookie-parser |
| Frontend    | EJS templates, vanilla JavaScript, CSS |
| File upload | Multer (PDF only, max 100 MB) |
| Config      | dotenv (.env) |

---

## 4. System Architecture

### 4.1 High-Level Structure

The application follows an **MVC-style** layout:

- **Models** — Mongoose schemas for `User` and `Book`.
- **Controllers** — Request handlers for auth and book CRUD (including file upload/delete and download).
- **Views** — EJS templates for all pages (home, auth, book detail, admin list and forms, error pages).
- **Routes** — Separate route files for web pages and for the JSON API.
- **Middlewares** — Authentication (JWT from cookie), admin-only check, Multer upload, global error handler.

### 4.2 Data Models

**User**

- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required, hashed with bcrypt, not selected by default)
- `role` (String: `"user"` or `"admin"`, default `"user"`)
- `createdAt` (Date)

**Book**

- `title` (String, required)
- `author` (String, required)
- `description` (String, optional)
- `tags` (Array of strings, optional)
- `year` (Number, optional)
- `pdfPath` (String, required) — path to the uploaded PDF
- `coverImageUrl` (String, optional)
- `createdAt` / `updatedAt` (timestamps)

### 4.3 Authentication and Authorization

- **Registration** — Creates a user with `role: "user"`. Passwords are hashed with bcrypt before storage.
- **Login** — Returns a JWT signed with `JWT_SECRET`, stored in an **httpOnly cookie** (same for API and web).
- **Logout** — Clears the auth cookie.
- **Protected routes** — Middleware reads the JWT from the cookie (or `Authorization: Bearer` for API), verifies it, and attaches `req.user`.
- **Admin-only routes** — Additional middleware ensures `req.user.role === "admin"` for create/update/delete book and uploads.

### 4.4 File Handling

- PDFs are uploaded via **Multer** and saved under `uploads/books/` with a timestamped filename.
- Only PDF MIME type is accepted; max file size is **100 MB**.
- The path is stored in `Book.pdfPath`. Download is served via a dedicated route that checks authentication and uses a safe path to avoid directory traversal.
- When a book is deleted, the corresponding PDF file is removed from disk.

---

## 5. Features

### 5.1 For All Visitors

- View the home page with a short tagline and list of books.
- Search books by title or author (query parameter `?q=...`).

### 5.2 For Authenticated Users

- Register and log in.
- Open a book’s detail page (title, author, description, tags, year).
- Download the book’s PDF via a “Download PDF” button (only when logged in).

### 5.3 For Administrators

- Everything above, plus:
- **Admin panel** (`/admin`) — list all books with Edit and Delete actions.
- **Add book** — form with title, author, description, tags, year, PDF upload (required), optional cover image URL.
- **Edit book** — same fields; PDF can be left unchanged or replaced.
- **Delete book** — removes the book document and the PDF file from the server.

### 5.4 Seeding

- If environment variables `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` are set, the application creates (or promotes to admin) a user with that email and role `admin` on startup.

---

## 6. Project Structure

```
├── config/
│   └── db.js                 # MongoDB connection (MONGODB_URI or MONGO_URI)
├── controllers/
│   ├── authController.js    # register, login, logout
│   └── bookController.js    # getBooks, getBookById, createBook, updateBook, deleteBook, downloadBook
├── middlewares/
│   ├── authMiddleware.js    # optionalAuth, protect, adminOnly, cookie name
│   ├── errorHandler.js      # global error handler (JSON or EJS 500/404)
│   └── uploadMiddleware.js  # Multer config: PDF only, 100 MB, uploads/books/
├── models/
│   ├── Book.js
│   └── User.js
├── routes/
│   ├── index.js             # page routes (/, /register, /login, /books/:id, /admin, etc.)
│   └── api.js               # /api/auth/*, /api/books
├── views/
│   ├── partials/            # header.ejs, footer.ejs
│   ├── admin/               # index.ejs, book-form.ejs
│   ├── home.ejs, register.ejs, login.ejs, book-detail.ejs
│   └── 404.ejs, 500.ejs
├── public/
│   ├── css/style.css
│   └── js/main.js
├── uploads/books/           # uploaded PDFs (created at runtime)
├── server.js                # app setup, EJS, cookie-parser, routes, static, 404, errorHandler
├── package.json
├── README.md
├── postman_collection.json  # API collection for Postman
└── PROJECT_REPORT.md       # this report
```

---

## 7. API Summary

Base URL: **`/api`**

| Method | Endpoint              | Auth    | Description |
|--------|------------------------|--------|-------------|
| POST   | `/auth/register`       | No      | Register (name, email, password); sets cookie |
| POST   | `/auth/login`         | No      | Login (email, password); sets cookie |
| POST   | `/auth/logout`        | Optional| Clear cookie |
| GET    | `/books`              | No      | List books; optional `?q=search` |
| GET    | `/books/:id`          | No      | Get one book |
| POST   | `/books`              | Admin   | Create book (multipart: title, author, pdf, etc.) |
| PUT    | `/books/:id`          | Admin   | Update book (multipart; pdf optional) |
| DELETE | `/books/:id`          | Admin   | Delete book and its PDF file |

Responses are JSON (`{ success, data }` or `{ success, error }`). Auth is via cookie or `Authorization: Bearer <token>`.

---

## 8. Web Pages

| Path                    | Description |
|-------------------------|-------------|
| `/`                     | Home: hero, quote, book list (search via form → `?q=`) |
| `/register`             | Registration form |
| `/login`                | Login form |
| `/books/:id`            | Book detail; “Download PDF” for logged-in users |
| `/books/:id/download`   | Serves PDF (authenticated only) |
| `/admin`                | Admin: list books, Edit/Delete, “Add new book” |
| `/admin/books/new`      | Add book form |
| `/admin/books/:id/edit` | Edit book form |
| 404 / 500               | Error pages (EJS) |

---

## 9. Environment Variables

| Variable              | Required | Description |
|-----------------------|----------|-------------|
| `MONGODB_URI` or `MONGO_URI` | Yes  | MongoDB connection string |
| `JWT_SECRET`          | Yes      | Secret for signing JWTs |
| `PORT`                | No       | Server port (default 5000) |
| `ADMIN_SEED_EMAIL`    | No       | Email for admin seed user |
| `ADMIN_SEED_PASSWORD` | No       | Password for admin seed user |

---

## 10. Running the Project

**Install and run (development):**

```bash
npm install
# Create .env with MONGODB_URI (or MONGO_URI), JWT_SECRET, optionally ADMIN_* and PORT
npm run dev
```

**Production:**

```bash
npm start
```

Then open `http://localhost:5000` (or the configured port).

**Deployment (e.g. Render):**  
Set env vars in the dashboard; build command `npm install`, start command `npm start`. Note: uploaded PDFs are stored on the filesystem; for persistent storage across deploys, consider a persistent disk or object storage (e.g. S3).

---


## 11. Security and Validation

- Passwords are hashed with bcrypt (no plain-text storage).
- JWT in httpOnly cookie reduces XSS exposure; SameSite and Secure (in production) are used.
- Admin actions are protected by role middleware.
- File upload: only PDF MIME type; max size 100 MB; paths validated on download/delete to prevent directory traversal.
- Input validation and error handling in controllers; global error handler returns appropriate status codes and messages (e.g. 400 for “File too large” with a clear message).

---

## 12. Conclusion

IT Books Library is a complete full-stack application with authentication, role-based access, file upload and download, search, and a simple but clear UI. The structure (MVC, env config, middlewares, separate API and page routes) is suitable for further development and deployment. The project includes a README, API documentation, and a Postman collection for testing the API.
