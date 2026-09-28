# AI-Powered Threat Intelligence Impact Analyzer

This project is a full-stack application that automatically collects, analyzes (using Google Gemini), and correlates cyber threat intelligence with organizational assets.

## Prerequisites

- Node.js (v18+)
- PostgreSQL installed and running on default port 5432
- Google Gemini API Key

## Setup Instructions

### 1. Database Setup
Create a PostgreSQL database named `threat_analyzer`:
```bash
createdb threat_analyzer
```
*(Or create it via pgAdmin/psql)*

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Update the `.env` file with your PostgreSQL credentials and Gemini API Key:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/threat_analyzer?schema=public"
   GEMINI_API_KEY="your-gemini-api-key"
   JWT_SECRET="your-secret-key"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma migrations to create the tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL (usually `http://localhost:5173`) in your browser.

## Features implemented
- User Authentication (JWT)
- Asset Inventory Management
- Threat Intelligence RSS Scraping
- AI-Powered Threat Analysis via Gemini 2.5 Flash
- Impact Correlation Engine
- Dashboard Statistics
