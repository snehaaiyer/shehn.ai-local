
# BID AI Wedding Assistant

A comprehensive AI-powered wedding planning platform built with React frontend and Python backend services.

## 🚀 Quick Start

### Frontend (React)
```bash
cd react-frontend
npm install
HOST=0.0.0.0 PORT=5000 BROWSER=none npm start
```

### Backend Services
```bash
python service_orchestrator.py
```

## 📁 Project Structure

```
├── react-frontend/          # React application (main frontend)
├── services/               # Backend API services
├── config/                 # Configuration files
├── models/                 # Data models
├── nocodb_schemas/         # Database schemas
└── tests/                  # Test suites
```

## 🎯 Features

- **React Frontend**: Modern, responsive wedding planning interface
- **AI-Powered Recommendations**: Intelligent vendor matching and suggestions  
- **Budget Management**: Comprehensive budget tracking and allocation
- **Vendor Discovery**: Advanced search and filtering capabilities
- **Wedding Preferences**: Style and theme customization
- **Real-time Communication**: Vendor contact and messaging system

## 🔧 Development

The application runs on:
- **Frontend**: React app on port 5000
- **Backend APIs**: Various Python services on ports 8000, 5003, 5004

## 🌐 Access

Once running, access the application at:
- **Main App**: http://localhost:5000 (or your Repl URL)
- **API Services**: Backend services run automatically

## 📊 Architecture

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Python FastAPI services
- **Database**: NocoDB for data management
- **AI Integration**: Multiple AI service providers
- **Search**: Enhanced RAG-based vendor search

## 🧪 Testing

Run the comprehensive test suite:
```bash
python run_tests.py
```
