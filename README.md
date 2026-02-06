# Co-Working Dashboard

A unified dashboard to manage work alongside AI agents. Track tasks, projects, ideas, and reading lists with clear human vs AI attribution.

## Features

- **Kanban Board**: Drag-and-drop task management with human/AI badges
- **Projects View**: Syncs from davidai knowledge base (17 projects)
- **Ideas Dashboard**: Track ideas from brainstorm → shipped
- **Reading Lists**: Manage articles with progress tracking
- **Activity Timeline**: Audit trail showing who (human or agent) did what

## Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **Database**: PostgreSQL (Vercel Postgres)
- **UI**: Tailwind CSS + Radix UI components
- **Drag-and-drop**: @dnd-kit
- **Data fetching**: SWR

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/davidwischnewski31-coder/co-working-dashboard.git
cd co-working-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local and add your DATABASE_URL
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Setup

The dashboard requires PostgreSQL. You can use:
- **Local PostgreSQL**: Install from [postgresql.org](https://www.postgresql.org/)
- **Vercel Postgres**: Free tier at [vercel.com/storage/postgres](https://vercel.com/storage/postgres)

Create database and run migrations:
```bash
# Set DATABASE_URL in .env.local
npm run migrate
```

## davidai Integration

The Projects view syncs from David's AI OS at `/Users/David/davidai/knowledge/projects/`.

To sync projects:
1. Navigate to Projects page
2. Click "Sync Projects" button
3. Projects are imported from README.md files in davidai

## Human vs AI Attribution

Every task, idea, and action tracks:
- **Owner**: Name (David, software-engineer, etc.)
- **Owner Type**: human | agent
- **Agent Metadata**: Model, iterations, tokens (for agents)

This appears as badges throughout the UI:
- 👤 Human actions (blue badge)
- 🤖 Agent actions (purple badge with model info)

## Deployment

### Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Import project in Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL` (from Vercel Postgres)

3. Run migrations on production database:
```bash
# In Vercel dashboard, use Vercel Postgres console or:
vercel env pull
npm run migrate
```

## Project Structure

```
/
├── app/
│   ├── (dashboard)/          # Dashboard routes
│   │   ├── kanban/           # Kanban board
│   │   ├── projects/         # Projects view
│   │   ├── ideas/            # Ideas management
│   │   ├── reading/          # Reading lists
│   │   └── activity/         # Activity log
│   └── api/                  # API routes
│       ├── tasks/
│       ├── projects/
│       ├── ideas/
│       ├── reading-lists/
│       ├── articles/
│       └── activity/
├── components/               # React components
│   ├── kanban/
│   ├── projects/
│   ├── ideas/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── db.ts                 # PostgreSQL client
│   ├── validations.ts        # Zod schemas
│   ├── utils.ts              # Helper functions
│   ├── hooks/                # SWR hooks
│   └── sync/                 # davidai sync logic
├── migrations/
│   └── 001_init.sql          # Database schema
└── scripts/
    └── migrate.js            # Migration runner
```

## API Routes

### Tasks
- `GET /api/tasks` - List tasks (filters: status, project_id, owner_type)
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/projects/sync` - Sync from davidai

### Ideas
- `GET /api/ideas` - List ideas (filters: status, category)
- `POST /api/ideas` - Create idea

### Reading Lists
- `GET /api/reading-lists` - List reading lists
- `POST /api/reading-lists` - Create reading list
- `GET /api/articles` - List articles
- `POST /api/articles` - Add article

### Activity
- `GET /api/activity` - Activity log (filters: entity_type, actor_type, limit)

## Development

```bash
# Start dev server
npm run dev

# Run migrations
npm run migrate

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

## Author

David Wischnewski
