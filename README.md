# EstimAgent - AI-Powered Construction Estimation Platform

**EstimAgent** is an intelligent construction estimation tool that automates the process of analyzing architectural drawings and generating accurate material takeoffs and cost estimates. It leverages computer vision and machine learning to detect building elements from floor plans and provides real-time measurements, quantity calculations, and cost breakdowns.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Architecture](#project-architecture)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Development Workflow](#development-workflow)
6. [Deployment Guide](#deployment-guide)
7. [ML Service Setup](#ml-service-setup)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL (Neon for cloud)
- Git

### Local Development Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd EstimAgent
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# 3. Start all services
npm run dev

# Services will start on:
# - Frontend: http://localhost:5173
# - API: http://localhost:5001
# - ML Service: http://localhost:8000
```

---

## 🏗️ Project Architecture

EstimAgent follows a **three-tier microservices architecture**:

### **1. Frontend (React + TypeScript)**
- **Location**: `/client/src`
- **Deployment**: Vercel
- **Technologies**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, React Konva
- **Features**:
  - Interactive canvas-based drawing viewer
  - Real-time AI analysis visualization
  - Manual measurement tools (line, area, count)
  - Drag-and-drop file upload
  - Project and drawing management
  - Dark/light theme support

### **2. Backend API (Node.js + Express)**
- **Location**: `/api`
- **Deployment**: Render
- **Technologies**: Express.js, TypeScript, Drizzle ORM, PostgreSQL
- **Responsibilities**:
  - RESTful API endpoints for CRUD operations
  - File upload handling
  - Database operations
  - Session management
  - CORS configuration

### **3. ML Service (Python + FastAPI)**
- **Location**: `/ml`
- **Deployment**: Render
- **Technologies**: FastAPI, Roboflow Inference SDK, Pillow, NumPy
- **Capabilities**:
  - AI-powered object detection (rooms, walls, doors, windows)
  - Polygon area and perimeter calculations
  - Scale conversion (pixels → real-world measurements)
  - PDF page classification with Tesseract OCR

---

## 💻 Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, React Konva, Zustand, TanStack Query |
| **Backend API** | Node.js, Express.js, TypeScript, Drizzle ORM, Multer |
| **ML Service** | Python 3.11, FastAPI, Roboflow SDK, Tesseract OCR, Pillow, NumPy |
| **Database** | PostgreSQL (Neon Serverless) |
| **Deployment** | Vercel (Frontend), Render (API + ML) |
| **UI Components** | Radix UI, Lucide icons, Chart.js, Recharts |

---

## 📦 Installation & Setup

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd EstimAgent
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Configure Environment Variables**

**Root `.env` file:**
```env
DATABASE_URL=postgresql://user:password@host/database
VITE_API_URL=http://localhost:5001
VITE_ML_URL=http://localhost:8000
NODE_ENV=development
```

**ML Service `.env` (in `/ml` folder):**
```env
ROBOFLOW_API_KEY=your_api_key
ROOM_API_KEY=your_key
ROOM_WORKSPACE=workspace
ROOM_PROJECT=project
ROOM_VERSION=1
WALL_API_KEY=your_key
WALL_WORKSPACE=workspace
WALL_PROJECT=project
WALL_VERSION=1
DOORWINDOW_API_KEY=your_key
DOORWINDOW_WORKSPACE=workspace
DOORWINDOW_PROJECT=project
DOORWINDOW_VERSION=1
```

### **Step 4: Database Setup**

```bash
# Push schema to database
npm run db:push

# Verify connection
npm run db:studio
```

### **Step 5: Install Tesseract OCR (Optional but Recommended)**

**Windows:**
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location: `C:\Program Files\Tesseract-OCR`
3. Verify: `tesseract --version`

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract
```

---

## 🔄 Development Workflow

### **Start All Services**
```bash
npm run dev
```

### **Start Individual Services**
```bash
# Frontend only (port 5173)
npm run dev:frontend

# API only (port 5001)
npm run dev:api

# ML Service only (port 8000)
npm run dev:ml
```

### **Build for Production**
```bash
npm run build
```

### **Database Migrations**
```bash
# Push schema changes
npm run db:push

# Generate migration
npm run db:generate

# View database UI
npm run db:studio
```

---

## 🚀 Deployment Guide

### **Frontend Deployment (Vercel)**

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository

2. **Configure Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist/client`

3. **Set Environment Variables:**
   - `VITE_API_URL` = `https://your-api.onrender.com`
   - `VITE_ML_URL` = `https://your-ml.onrender.com`

4. **Deploy:**
   - Click "Deploy"

### **Backend API Deployment (Render)**

1. **Create Web Service:**
   - Connect GitHub repository
   - Select `/api` as root directory

2. **Configure:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

3. **Set Environment Variables:**
   - `DATABASE_URL` = your PostgreSQL connection string
   - `NODE_ENV` = production
   - `CORS_ORIGIN` = your frontend URL

4. **Deploy**

### **ML Service Deployment (Render)**

1. **Create Web Service:**
   - Connect GitHub repository
   - Select `/ml` as root directory

2. **Configure:**
   - Runtime: Python 3.11
   - Build Command: `bash render-build.sh`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables:**
   - All Roboflow API keys (see `.env` example)

4. **Deploy**

---

## 🔧 ML Service Setup

### **Local Setup**

```bash
cd ml
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### **Test the Service**

```bash
# Check if running
curl http://localhost:8000/test

# View API docs
http://localhost:8000/docs
```

### **Common Issues**

**Issue: "uvicorn: command not found"**
```bash
pip install uvicorn
```

**Issue: "ModuleNotFoundError"**
```bash
cd ml
pip install -r requirements.txt
```

**Issue: Port 8000 already in use**
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
python -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

---

## 📊 Database Schema

### **Core Tables**

**projects** - Project metadata
- `id`, `name`, `description`, `location`, `client_info`, `status`
- Timestamps: `created_at`, `updated_at`

**drawings** - Floor plans and documents
- `id`, `project_id`, `file_name`, `file_url`, `file_type`, `scale`
- `is_ai_processed`, `processing_status`
- Timestamps: `created_at`, `updated_at`

**takeoffs** - Detected elements and measurements
- `id`, `drawing_id`, `element_type`, `element_name`, `quantity`
- `area`, `length`, `width`, `height`, `cost_per_unit`, `total_cost`
- `is_detected_by_ai`, `is_verified`
- Timestamps: `created_at`, `updated_at`

**saved_analyses** - AI analysis results
- `id`, `project_id`, `drawing_id`, `analysis_data` (JSON)
- `total_items`, `total_cost`, `element_types`
- Timestamps: `created_at`, `updated_at`

**product_skus** - Product catalog
- `id`, `sku`, `name`, `description`, `trade_class_id`
- `material_cost`, `labor_cost`, `markup_percentage`
- Timestamps: `created_at`, `updated_at`

**suppliers** - Supplier management
- `id`, `name`, `contact_name`, `email`, `phone`
- `specialties`, `lead_time`, `rating`
- Timestamps: `created_at`, `updated_at`

---

## 🔌 API Endpoints

### **Projects**
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### **Drawings**
- `POST /api/drawings` - Upload drawing
- `GET /api/drawings/:id` - Get drawing details
- `DELETE /api/drawings/:id` - Delete drawing

### **Takeoffs**
- `POST /api/takeoffs` - Create takeoff
- `GET /api/drawings/:id/takeoffs` - Get all takeoffs
- `PUT /api/takeoffs/:id` - Update takeoff
- `DELETE /api/takeoffs/:id` - Delete takeoff

### **Analysis**
- `POST /api/analyze` - Run AI analysis
- `POST /api/upload-pdf` - Upload and process PDF
- `POST /api/analyze-pages` - Analyze PDF pages

### **ML Service**
- `POST /analyze` - Main analysis endpoint
- `POST /upload-pdf` - Upload PDF for processing
- `GET /health` - Health check

---

## 🐛 Troubleshooting

### **Frontend Issues**

**Problem: CORS errors**
- Ensure API and ML service URLs are correct in `.env`
- Check CORS configuration in API service

**Problem: Images not loading**
- Verify file URLs are absolute in production
- Check file storage permissions

### **API Issues**

**Problem: Database connection failed**
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Test connection: `npm run db:studio`

**Problem: File upload fails**
- Check `/uploads` directory exists
- Verify file permissions
- Check max file size (50MB default)

### **ML Service Issues**

**Problem: Analysis not running**
- Verify ML service is running on port 8000
- Check Roboflow API keys are set
- View logs: `http://localhost:8000/docs`

**Problem: Tesseract not found**
- Install Tesseract binary (see Installation section)
- Add to PATH environment variable
- Restart ML service

**Problem: PDF classification fails**
- Tesseract will fallback to heuristics automatically
- Check logs for warnings
- No crashes - always functional

---

## 📝 Environment Variables Reference

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:5001
VITE_ML_URL=http://localhost:8000
```

### **API (.env)**
```env
DATABASE_URL=postgresql://user:password@host/database
NODE_ENV=development
ML_API_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
```

### **ML Service (.env)**
```env
ROBOFLOW_API_KEY=your_key
ROOM_API_KEY=your_key
ROOM_WORKSPACE=workspace
ROOM_PROJECT=project
ROOM_VERSION=1
WALL_API_KEY=your_key
WALL_WORKSPACE=workspace
WALL_PROJECT=project
WALL_VERSION=1
DOORWINDOW_API_KEY=your_key
DOORWINDOW_WORKSPACE=workspace
DOORWINDOW_PROJECT=project
DOORWINDOW_VERSION=1
```

---

## 🔐 Security Notes

- **CORS**: Uses specific origins (not wildcard) with credentials
- **File Upload**: Max 50MB, supported formats: PNG, JPG, JPEG, PDF
- **Database**: Use environment variables for sensitive credentials
- **API Keys**: Store in `.env` files (never commit to git)

---

## 📚 Project Structure

```
EstimAgent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration
│   └── package.json
├── api/                    # Express API server
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   └── package.json
├── ml/                     # Python ML service
│   ├── app.py             # FastAPI application
│   ├── pdf_processor.py   # PDF processing
│   ├── requirements.txt    # Python dependencies
│   └── render-build.sh    # Deployment script
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
├── package.json           # Root package.json
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind CSS config
└── README.md              # This file
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally: `npm run dev`
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review environment variable configuration
3. Check service logs in respective terminals
4. Verify all services are running on correct ports

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🎯 Key Features

✅ **AI-Powered Analysis** - Automatic detection of rooms, walls, doors, windows
✅ **Real-time Measurements** - Instant area, perimeter, and length calculations
✅ **Manual Tools** - Line, area, and count measurement tools
✅ **PDF Support** - Multi-page PDF upload with intelligent page classification
✅ **Cost Estimation** - Material pricing and cost breakdowns
✅ **Project Management** - Create, organize, and track projects
✅ **Dark Mode** - Professional dark theme support
✅ **Responsive Design** - Works on desktop and tablets
✅ **Export Reports** - Generate PDF reports with estimates

---

## 🚀 Deployment Status

- **Frontend**: Deployed on Vercel
- **API**: Deployed on Render
- **ML Service**: Deployed on Render
- **Database**: PostgreSQL (Neon Serverless)

---

**Last Updated**: December 2024
**Version**: 1.0.0
