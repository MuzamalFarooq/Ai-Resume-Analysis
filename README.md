# AI Resume Analyzer

A production-ready full-stack SaaS platform for AI-powered resume analysis, ATS scoring, skill gap detection, and mock interview practice.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** JavaScript
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js v5 (Credentials)
- **Styling:** Tailwind CSS + ShadCN-style components
- **File Upload:** UploadThing + direct upload fallback
- **Resume Parsing:** pdf-parse + mammoth
- **AI:** OpenAI API (gpt-4o-mini)
- **Charts:** Recharts
- **Validation:** Zod
- **Deployment:** Vercel-ready

## Features

- Resume upload (PDF/DOCX) with validation
- ATS score checker (keyword, formatting, readability, completeness)
- AI-powered resume parsing and improvement suggestions
- Grammar & spelling analysis
- Section-by-section scoring
- Job description matching with skill gap detection
- AI mock interview generator (10-20 questions)
- Answer evaluation with detailed feedback
- Career recommendation engine
- Analytics dashboard with charts
- Resume history and version comparison
- PDF report export
- Admin dashboard with user management
- Dark/light mode
- Rate limiting and input sanitization

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key
- UploadThing account (optional)

### Installation

```bash
# Clone and install
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/ai-resume-analyzer
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-key
UPLOADTHING_TOKEN=your-token
ADMIN_EMAIL=admin@example.com
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Create Admin User

Register with the email matching `ADMIN_EMAIL` in your `.env.local` to get admin role automatically.

## Project Structure

```
/app
  /(auth)          # Login, register, forgot password
  /(dashboard)     # Protected dashboard pages
  /api             # API route handlers
/components
  /ui              # Reusable UI components
  /layout          # Header, sidebar
  /auth            # Auth forms
  /resume          # Upload components
  /charts          # Recharts components
  /providers       # Theme, auth, toast providers
/lib               # Core utilities (AI, parsing, scoring)
/models            # Mongoose models
/actions           # Server actions
/utils             # Helpers (cn, sanitize)
/middleware.js     # Route protection
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/auth/register` | POST | User registration |
| `/api/resume` | GET/POST | List/create resumes |
| `/api/resume/upload` | POST | Direct file upload |
| `/api/analysis` | POST | Trigger resume analysis |
| `/api/job-match` | POST | Job description matching |
| `/api/interview` | POST | Create interview session |
| `/api/interview/evaluate` | POST | Evaluate answer |
| `/api/admin` | GET | Admin analytics |
| `/api/export/[id]` | GET | PDF export |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

For MongoDB, use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier.

## License

MIT
