# EstimAgent - Project Architecture & Overview

## Executive Summary

**EstimAgent** is an AI-powered construction estimation platform that automates the process of analyzing architectural drawings and generating accurate material takeoffs and cost estimates. The tool leverages computer vision and machine learning to detect building elements (rooms, walls, doors, windows) from uploaded floor plans and provides real-time measurements, quantity calculations, and cost breakdowns.

---

## 🏗️ System Architecture

EstimAgent follows a **three-tier microservices architecture** with clear separation of concerns:

### **1. Frontend (React + TypeScript)**
- **Technology Stack**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Location**: `/client/src`
- **Deployment**: Vercel (https://estimagent.vercel.app)
- **Key Features**:
  - Interactive canvas-based drawing viewer using React Konva
  - Real-time AI analysis visualization
  - Manual measurement tools (line, area, count)
  - Drag-and-drop file upload
  - Project and drawing management
  - Cost estimation and reporting
  - Dark/light theme support

### **2. Backend API (Node.js + Express)**
- **Technology Stack**: Express.js, TypeScript, Drizzle ORM, PostgreSQL (Neon)
- **Location**: `/api`
- **Deployment**: Render (https://aiestimagent-api.onrender.com)
- **Responsibilities**:
  - RESTful API endpoints for CRUD operations
  - File upload handling and storage
  - Database operations (projects, drawings, takeoffs, analyses)
  - Session management and authentication
  - Proxy requests to ML service
  - CORS configuration for cross-origin requests

### **3. ML Service (Python + FastAPI)**
- **Technology Stack**: FastAPI, Roboflow Inference SDK, Pillow, NumPy
- **Location**: `/ml`
- **Deployment**: Render (https://aiestimagent.onrender.com)
- **Responsibilities**:
  - AI-powered object detection using three specialized models:
    - **Room Detection Model**: Identifies room boundaries
    - **Wall Detection Model**: Detects walls and partitions
    - **Door & Window Model**: Locates doors and windows
  - Polygon area and perimeter calculations
  - Scale conversion (drawing pixels → real-world measurements)
  - Returns normalized predictions with bounding boxes, masks, and metrics

---

## 📊 Database Schema

**Database**: PostgreSQL (Neon Serverless)

### Core Tables:

1. **`projects`**
   - Project metadata (name, description, location, client, status)
   - Timestamps for creation and updates

2. **`drawings`**
   - Linked to projects (foreign key)
   - File information (name, URL, type, scale)
   - AI processing status (pending, processing, complete, error)
   - Scale factor (e.g., "1/4\" = 1'")

3. **`takeoffs`**
   - Linked to drawings (foreign key)
   - Element details (type, name, quantity, area, length, dimensions)
   - Cost information (cost per unit, total cost)
   - AI detection metadata (coordinates, masks, confidence)
   - Manual edit tracking (original vs. edited values)
   - Product SKU linking for pricing

4. **`saved_analyses`**
   - Stores complete AI analysis results
   - Analysis metadata (total items, total cost, element types)
   - Linked to projects and drawings

5. **`material_costs`** & **`product_skus`**
   - Material pricing database
   - SKU-based product catalog
   - Custom pricing overrides

6. **`reports`**
   - Generated reports storage
   - Report metadata and configuration

---

## 🔄 Data Flow & Request Lifecycle

### **AI Analysis Workflow**:

```
1. User uploads floor plan image (Frontend)
   ↓
2. File sent to API service (/api/analyze)
   ↓
3. API proxies request to ML service with scale and analysis types
   ↓
4. ML service runs three detection models in parallel:
   - Room detection → calculates area (sq ft) and perimeter (ft)
   - Wall detection → calculates length (ft)
   - Door/Window detection → counts instances
   ↓
5. ML service applies scale conversion (pixels → real-world units)
   ↓
6. ML service returns normalized predictions with:
   - Bounding boxes (x, y, width, height)
   - Segmentation masks (polygon points)
   - Confidence scores
   - Real-world measurements (area_sqft, perimeter_ft, length_ft)
   ↓
7. API service stores results in database (takeoffs table)
   ↓
8. Frontend displays results on interactive canvas
   - Visual overlays on drawing
   - Summary cards with totals
   - Detailed breakdown by element type
```

### **Manual Measurement Workflow**:

```
1. User selects measurement tool (line/area/count)
   ↓
2. User draws on canvas (clicks to define points)
   ↓
3. Frontend calculates measurements using scale factor
   ↓
4. User assigns category and saves
   ↓
5. Frontend sends takeoff data to API
   ↓
6. API stores in database with detectedByAi=false
   ↓
7. Measurement appears in takeoff panel
```

---

## 🎨 Key Features & Components

### **Frontend Components** (`/client/src/components`):

- **`interactive-floor-plan.tsx`**: Main canvas component using React Konva
  - Zoom/pan controls
  - Layer management (image, AI overlays, manual measurements)
  - Selection and editing tools
  - Real-time dimension display

- **`realtime-analysis-panel.tsx`**: Shows AI detection results in real-time
  - Element counts and measurements
  - Confidence scores
  - Visual indicators

- **`takeoff-panel.tsx`**: Organized view of all takeoffs
  - Grouped by element type
  - Summary cards with totals
  - Edit/delete functionality
  - Export capabilities

- **`calibration-tool.tsx`**: Scale calibration interface
  - User draws known distance
  - Inputs actual measurement
  - Calculates scale factor

- **`report-generator.tsx`**: PDF report generation
  - Cost breakdowns
  - Material lists
  - Visual snapshots

- **`ai-chat-widget.tsx`**: AI assistant for queries and guidance

### **API Endpoints** (`/api/routes.ts`):

- `POST /api/analyze` - Proxy AI analysis to ML service
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `POST /api/drawings` - Upload drawing
- `GET /api/drawings/:id/takeoffs` - Get all takeoffs for a drawing
- `POST /api/takeoffs` - Create manual takeoff
- `PUT /api/takeoffs/:id` - Update takeoff
- `DELETE /api/takeoffs/:id` - Delete takeoff
- `POST /api/reports` - Generate report

### **ML Endpoints** (`/ml/app.py`):

- `POST /analyze` - Main analysis endpoint
  - Accepts: image file, scale, analysis types (rooms, walls, doors, windows)
  - Returns: normalized predictions with measurements

- `GET /health` - Health check endpoint

---

## 🔧 Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, React Konva, Wouter (routing), TanStack Query, Zustand (state) |
| **Backend API** | Node.js, Express.js, TypeScript, Drizzle ORM, Multer (file uploads), Axios |
| **ML Service** | Python 3.11, FastAPI, Roboflow Inference SDK, Pillow, NumPy |
| **Database** | PostgreSQL (Neon Serverless) |
| **Deployment** | Vercel (Frontend), Render (API + ML) |
| **UI Components** | Radix UI primitives, Lucide icons, Chart.js, Recharts |

---

## 🚀 Development Workflow

### **Local Development**:

```bash
# Install dependencies
npm install

# Run all services concurrently
npm run dev

# Or run individually:
npm run dev:frontend  # Vite dev server (port 5173)
npm run dev:api       # Express API (port 5001)
npm run dev:ml        # FastAPI ML service (port 8000)
```

### **Environment Variables**:

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:5001
VITE_ML_URL=http://localhost:8000
```

**API** (`/api/.env`):
```
DATABASE_URL=postgresql://...
NODE_ENV=development
ML_API_URL=http://localhost:8000
```

**ML** (`/ml/.env`):
```
ROOM_API_KEY=...
ROOM_WORKSPACE=...
ROOM_PROJECT=...
ROOM_VERSION=...
WALL_API_KEY=...
WALL_WORKSPACE=...
WALL_PROJECT=...
WALL_VERSION=...
DOORWINDOW_API_KEY=...
DOORWINDOW_WORKSPACE=...
DOORWINDOW_PROJECT=...
DOORWINDOW_VERSION=...
```

---

## 📐 Scale Conversion & Measurements

EstimAgent uses a sophisticated scale conversion system:

1. **User Input**: User specifies scale (e.g., "1/4\" = 1'")
2. **Pixel-to-Real Conversion**: 
   - Calculate pixels per foot based on scale
   - Apply to all measurements
3. **Area Calculation**: 
   - Use shoelace formula for polygon area
   - Convert from pixels² to sq ft
4. **Perimeter Calculation**:
   - Sum distances between polygon points
   - Convert from pixels to feet
5. **Display**: Show both pixel and real-world units

---

## 🔐 Security & CORS

**CORS Configuration**:
- Allowed origins: `https://estimagent.vercel.app`, `localhost:5173`, `localhost:5001`, `localhost:8000`
- Credentials enabled for same-origin requests
- Specific origin headers (not wildcard `*`) when using credentials

**File Upload**:
- Max file size: 50MB
- Supported formats: PNG, JPG, JPEG, PDF
- Files stored in `/uploads` directory (API) and cloud storage (production)

---

## 📦 Deployment Architecture

### **Production Setup**:

1. **Frontend (Vercel)**:
   - Automatic deployments from Git
   - Environment variables set in Vercel dashboard
   - CDN distribution for static assets

2. **API (Render)**:
   - Docker container deployment
   - PostgreSQL connection via Neon
   - File storage in persistent volumes

3. **ML Service (Render)**:
   - Python 3.11 runtime
   - Roboflow API integration
   - Cold start optimization (free tier has 30-60s delay)

### **Key Deployment Considerations**:

- **CORS**: Must use specific origins (not wildcard) with credentials
- **File URLs**: Must be absolute in production for cross-origin access
- **Environment Variables**: Set in deployment platform dashboards, not just `.env` files
- **Cold Starts**: Render free tier services sleep after inactivity

---

## 🎯 Use Cases

1. **Construction Estimators**: Upload floor plans, get instant material quantities
2. **Contractors**: Generate accurate cost estimates for bids
3. **Architects**: Validate design measurements and quantities
4. **Project Managers**: Track material usage and costs across projects

---

## 🔮 Future Enhancements

- Multi-page PDF support
- 3D visualization
- Integration with construction management tools
- Mobile app
- Collaborative features (team sharing, comments)
- Advanced AI models (electrical, plumbing, HVAC)
- Cost database expansion

---

## 📚 Additional Resources

- **Documentation**: See `/DEPLOYMENT.md`, `/CORS_FIX_DEPLOYMENT.md`, and other `.md` files in root
- **API Documentation**: Available at `/api/docs` (when running locally)
- **ML API Documentation**: Available at `/docs` on ML service (FastAPI auto-generated)

---

## 🤝 Getting Started for New Team Members

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see `.env.example`)
4. **Set up PostgreSQL database** (Neon or local)
5. **Run database migrations**: `npm run db:push`
6. **Start development servers**: `npm run dev`
7. **Access the app**: `http://localhost:5173`

---

## 📞 Support & Contact

For questions or issues, please refer to the project documentation or reach out to the development team.

---

**Last Updated**: October 2025
**Version**: 1.0.0
