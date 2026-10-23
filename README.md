# AralNa (MERN)

React SPA with an Express + MongoDB backend. Students self-register, admins are created from the
seed script or by another admin, students can upload documents with their text extracted
automatically (including OCR for photos), and can generate an AI reviewer (summary, topics,
fun facts, flashcards) from any uploaded document using Groq.

## Run it

1. Backend (folder server): copy .env.example to .env, set MONGO_URI, JWT_SECRET,
   GROQ_API_KEY, set EMAIL_PROVIDER=gmail and configure GMAIL_USER and GMAIL_APP_PASSWORD,
   then npm install, npm run seed:admin, npm run dev
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
- names of people mentioned in the source document
- fun facts
- flashcards, shown as flip cards the student can tap through

The reviewer **Show** filter can display topic headings, named people, timeline years, or key terms.
People names are extracted from the source text when the reviewer is generated; reviewers created
before this field was added need to be regenerated to populate their Names filter.

Past reviewers are listed under Reviewers in the student nav bar. Each generation also logs an
entry the admin dashboard counts (type summary, and flashcards when any were produced), using the
document's first primary topic, so "Most generated topics" starts filling in automatically.

Input text sent to Groq is capped at 12,000 characters, and the AI's own output is capped (at
most 8 primary topics, 12 minor topics, 8 fun facts, 15 flashcards, ~2000-character summary)
so one run can't balloon the database or the response.

## Upload module (/app/upload)

Students can drag and drop, or click to browse for:
- PDF, DOCX, PPTX, TXT — text is extracted directly; scanned PDFs are rendered page by page and read with OCR
- PNG, JPG, JPEG, WEBP — read with OCR (Tesseract), for photos of notes or whiteboards

OCR uses English recognition. Only the extracted text and file metadata are kept in MongoDB;
the uploaded file itself is deleted from disk right after its text is extracted.

## Admin dashboard (/admin)

- Overview: quizzes generated, active students (used the app in the last 7 days), registered
  students, online users, disabled accounts, and the most generated topics. Online presence is
  refreshed while a signed-in app tab is visible and expires after 60 seconds without a heartbeat.
- The account created by `npm run seed:admin` is the super admin. Running the seed script
  again promotes/updates that configured account as the super admin.
- Regular admins can monitor the overview and search/filter the user directory, but cannot
  change account access or create admins.
- Only the super admin can disable or enable accounts and create regular admin accounts.
- Files: admins can view uploaded document names, uploader, upload time, size, and processing
  status. The uploaded binary is deleted after text extraction, and extracted document contents
  are not exposed through the admin files view.

To see sample numbers, run npm run seed:demo in the server folder. Remove them with npm run clear:demo.

## API

POST   /api/auth/register            student sign-up
POST   /api/auth/login
POST   /api/auth/forgot-password     request an email reset code
POST   /api/auth/reset-password      verify a reset code and set a new password
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/presence
POST   /api/documents/upload         multipart/form-data, field name "file"
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/reviewers/generate       body { documentId }
GET    /api/reviewers?documentId=
GET    /api/reviewers/:id
DELETE /api/reviewers/:id
POST   /api/reviewers/:id/quiz       create or open a practice quiz from that reviewer
GET    /api/quizzes                  list published quizzes (admins also see attempt counts)
POST   /api/quizzes                  admin: publish a quiz to all active students
POST   /api/quizzes/generate-from-file admin: generate quiz questions from an uploaded source
DELETE /api/quizzes/:id              creator admin: delete a published quiz and all its attempts; student: hide it and delete own attempts
GET    /api/quizzes/:id              get a quiz without its answer key
GET    /api/quizzes/:id/results      admin: view student scores
POST   /api/quizzes/:id/attempts     student: submit one of up to five attempts
GET    /api/admin/stats              admin only
GET    /api/admin/users?role=&status=&q=
GET    /api/admin/files?page=         admin only; paginated upload metadata and uploader
PATCH  /api/admin/users/:id/active   disable or enable
POST   /api/admin/admins             create another admin

## LMS quizzes

Admins can create quizzes from **Admin workspace → Quizzes**. Each quiz can include multiple-choice,
identification, and true/false questions, and can be published either to all active students or to
specific active students selected by name or email. Admins may also upload a PDF, DOCX, PPTX, TXT,
PNG, JPG, JPEG, or WEBP source, choose 1–50 questions, and generate quiz questions with the configured
Groq model. The generated questions and answer key are available for admin review/editing before
publishing; the temporary source upload is removed after generation. Each student attempt receives a
randomized question order and randomized multiple-choice option order. Students find quizzes assigned
to them under **Quizzes** in their study space. Answers are graded automatically;
identification answers ignore capitalization and extra spaces. Students may submit up to five attempts
per quiz, and every score is recorded. Admins can review all student attempts and scores from the
published quiz list. The quiz API never returns the answer key to students. At the bottom of each
ready reviewer, students can generate a reviewer-specific practice quiz; it is saved to their account
so its five-attempt score history persists.

Admins can delete only assigned quizzes they created; deleting one removes the quiz and all student
attempts for it. Students can remove a quiz from their own list, which also clears only their own
attempt history. The shared quiz and other students' records remain available.

## Security choices

- bcrypt password hashes, never returned by the API.
- JWT in an httpOnly cookie. Role is read from the database on every request.
- A disabled account is rejected on its next request, so it is logged out immediately.
- Inputs must be strings, which blocks NoSQL operator injection.
- Login and register are rate limited, and login errors do not reveal which emails exist.
- Password reset codes are emailed through the configured provider, expire after 10 minutes,
  and are single-use. Reset requests and attempts are rate limited, and reset requests do not
  reveal whether an email is registered.
- Uploads are capped at 20MB and restricted to a fixed list of extensions; a student can only
  read, list or delete their own documents and reviewers.

## Password reset email

For local development, set `EMAIL_PROVIDER=gmail`, `GMAIL_USER` to the full Gmail sender
address, and `GMAIL_APP_PASSWORD` to an App Password for that account (not its regular
sign-in password). Gmail SMTP uses `smtp.gmail.com` on port 587 with required STARTTLS.

To use Gmail's HTTPS API locally or on Render, set `EMAIL_PROVIDER=gmail-api` and configure
`GMAIL_USER`, `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, and
`GMAIL_OAUTH_REFRESH_TOKEN`. Create OAuth credentials in Google Cloud Console, enable the
Gmail API, and authorize the sender account with the `https://www.googleapis.com/auth/gmail.send`
scope to obtain the refresh token. Store all OAuth values as backend environment variables.
This uses HTTPS instead of SMTP, but Google OAuth consent-screen and refresh-token policies
still apply.

For Render, set `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY` to an API key from your Brevo
account, and `BREVO_FROM_EMAIL` to a sender address verified in Brevo. Optionally set
`BREVO_FROM_NAME` (defaults to `AralNa`). Add these in the Render backend service's
Environment settings. Brevo sends over HTTPS, avoiding Render's outbound SMTP connection
timeout. Do not use Gmail credentials for the Render Brevo configuration.

If `EMAIL_PROVIDER` is omitted, local development defaults to Gmail and production defaults
to Brevo. If email configuration is missing or unavailable, password reset requests return
an error without disclosing whether the email belongs to an account.
