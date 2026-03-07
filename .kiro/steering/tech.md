# Technology Stack

## Core Technologies

- **Frontend**: React 18.2.0 with React Router 6.20.1
- **Backend**: Node.js with Express 4.18.2
- **Database**: MySQL 8.0+
- **Reverse Proxy**: Nginx (deployment)

## Key Libraries

### Backend
- `mysql2` (3.6.5) - Database driver with connection pooling
- `csv-parser` (3.0.0) - Product CSV import
- `cors` (2.8.5) - Cross-origin resource sharing
- `dotenv` (16.3.1) - Environment configuration
- `express` - REST API framework

### Testing
- `jest` (29.7.0) - Test runner for both frontend and backend
- `supertest` (6.3.3) - HTTP assertion library
- `fast-check` (3.15.0) - Property-based testing library
- `@testing-library/react` (14.1.2) - React component testing

### Development
- `nodemon` (3.0.2) - Auto-reload for backend development
- `react-scripts` (5.0.1) - React build tooling

## Common Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm start                # Start production server (port 5000)
npm run dev              # Start with auto-reload (nodemon)
npm test                 # Run tests with Jest
```

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm start                # Start dev server (port 3000)
npm run build            # Production build
npm test                 # Run tests (non-watch mode)
```

### Database
```bash
cd database
mysql -u root -p < schema.sql    # Initialize database schema
```

## Environment Configuration

Backend requires `.env` file (see `backend/.env.example`):
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `PORT` (default: 5000)
- `NODE_ENV` (development/production)
- `CSV_FILE_PATH` (default: ../product_list.csv)

## Port Allocation

- **3000**: React development server
- **3306**: MySQL database
- **5000**: Node.js API server
- **80**: Nginx reverse proxy (production)

## Build System

- **Frontend**: Create React App (react-scripts)
- **Backend**: Node.js native (no bundler)
- **Testing**: Jest with coverage reporting
