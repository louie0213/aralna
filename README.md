# AralNa (MERN)

React SPA with an Express + MongoDB backend. Students self-register, admins are created from the
seed script or by another admin, students can upload documents with their text extracted
automatically (including OCR for photos), and can generate an AI reviewer (summary, topics,
fun facts, flashcards) from any uploaded document using Groq.

## Run it

1. Backend (folder server): copy .env.example to .env, set MONGO_URI, JWT_SECRET and
   GROQ_API_KEY, then npm install, npm run seed:admin, npm run dev
2. Frontend (folder client): npm install, npm run dev, open http://localhost:5173

## Reviewer generation module (/app/reviewers)

Put your Groq API key in **server/.env**, on the GROQ_API_KEY line:

    GROQ_API_KEY=your_groq_api_key_here
    GROQ_MODEL=llama-3.3-70b-versatile

Get a free key at https://console.groq.com. GROQ_MODEL is optional; it already defaults to
llama-3.3-70b-versatile if you leave it out.

From a document's row on the Upload page, click "Generate reviewer" (only enabled once the
document's status is Ready). The server sends the extracted text to Groq and asks for JSON back,
then saves a Reviewer with:

- a whole-document summary
- primary topics and minor topics
- fun facts
- flashcards, shown as flip cards the student can tap through

Past reviewers are listed under Reviewers in the student nav bar. Each generation also logs an
entry the admin dashboard counts (type summary, and flashcards when any were produced), using the
document's first primary topic, so "Most generated topics" starts filling in automatically.

Input text sent to Groq is capped at 12,000 characters, and the AI's own output is capped (at
most 8 primary topics, 12 minor topics, 8 fun facts, 15 flashcards, ~2000-character summary)
so one run can't balloon the database or the response.

## Upload module (/app/upload)

Students can drag and drop, or click to browse for:
- PDF, DOCX, PPTX, TXT — text is extracted directly
- PNG, JPG, JPEG, WEBP — read with OCR (Tesseract), for photos of notes or whiteboards

Only the extracted text and file metadata are kept in MongoDB; the uploaded file itself is
deleted from disk right after its text is extracted.

## Admin dashboard (/admin)

- Overview: quizzes generated, active students (used the app in the last 7 days), registered
  students, disabled accounts, and the most generated topics.
- Users: search, filter by role or status, disable or enable accounts.
- Add admin: an admin creates another admin account.

To see sample numbers, run npm run seed:demo in the server folder. Remove them with npm run clear:demo.

## API

POST   /api/auth/register            student sign-up
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/documents/upload         multipart/form-data, field name "file"
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/reviewers/generate       body { documentId }
GET    /api/reviewers?documentId=
GET    /api/reviewers/:id
DELETE /api/reviewers/:id
GET    /api/admin/stats              admin only
GET    /api/admin/users?role=&status=&q=
PATCH  /api/admin/users/:id/active   disable or enable
POST   /api/admin/admins             create another admin

## Security choices

- bcrypt password hashes, never returned by the API.
- JWT in an httpOnly cookie. Role is read from the database on every request.
- A disabled account is rejected on its next request, so it is logged out immediately.
- Inputs must be strings, which blocks NoSQL operator injection.
- Login and register are rate limited, and login errors do not reveal which emails exist.
- Uploads are capped at 20MB and restricted to a fixed list of extensions; a student can only
  read, list or delete their own documents and reviewers.
