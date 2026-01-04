# Mental Health Assessment Platform

A comprehensive mental health assessment platform with completely separated React frontend and Node.js backend.

## Architecture

This project uses a **completely separated architecture**:

- **Frontend**: Independent React application in `/client` folder
- **Backend**: Independent Node.js API server in `/Server` folder
- **No Shared Dependencies**: Each service has its own package.json and configurations

## Quick Start

### Option 1: Run Both Services Separately

**Frontend:**
```bash
cd client
npm install
npm run dev
```
Frontend runs on: http://localhost:3000

**Backend:**
```bash
cd Server
npm install
npm run dev
```
Backend runs on: http://localhost:5000

### Option 2: Manual Setup

1. **Setup Frontend:**
   ```bash
   cd client
   npm install
   cp .env.example .env  # Configure your frontend variables
   npm run dev
   ```

2. **Setup Backend:**
   ```bash
   cd Server
   npm install
   cp .env.example .env  # Configure your backend variables
   npm run dev
   ```

## Project Structure

```
MentalHealth/
├── client/                    # React Frontend (Port 3000)
│   ├── src/                   # React source code
│   ├── .env                   # Frontend environment variables
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── README.md              # Frontend documentation
├── Server/                    # Node.js Backend (Port 5000)
│   ├── src/                   # Backend source code
│   ├── .env                   # Backend environment variables
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
└── README.md                  # This file
```

## Features

- **Complete Separation**: No shared dependencies or configurations
- **Independent Development**: Frontend and backend can be developed separately
- **Independent Deployment**: Deploy frontend and backend to different servers
- **Environment Isolation**: Separate environment variables for each service
- **Technology Flexibility**: Easy to replace frontend or backend independently

## Development

- **Frontend Development**: Work in `/client` folder, runs on port 3000
- **Backend Development**: Work in `/Server` folder, runs on port 5000
- **API Communication**: Frontend calls backend APIs at http://localhost:5000/api
- **CORS Configured**: Backend allows requests from frontend origin

## Production Deployment

Each service can be deployed independently:

- **Frontend**: Build with `npm run build` and deploy static files
- **Backend**: Deploy Node.js application with `npm start`

## Tech Stack

**Frontend:**
- React 19.2.0, Vite 7.2.4, Tailwind CSS 3.4.0

**Backend:**
- Node.js, Express 5.2.1, MongoDB, JWT, Razorpay