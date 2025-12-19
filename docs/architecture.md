# Arsitektur Sistem ResCAT

ResCAT dibangun dengan arsitektur **microservices** yang memisahkan concern menjadi beberapa layanan independen yang saling berkomunikasi melalui API.

## 🏗️ Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                         End Users                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   rescat.life (Landing)                      │
│                   Informasi & Marketing                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               app.rescat.life (Main App)                     │
│           Laravel 11 + Inertia.js + React/Vue                │
│  - User Management         - Cat Profile Management          │
│  - Scan History           - Pet Care Finder                  │
│  - Authentication         - Article Management               │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌─────────────────────────────┐
│  storage.rescat.life │      │     ml.rescat.life          │
│   Storage Service    │◄─────┤      ML Service             │
│   Express.js         │      │      Flask                  │
│  - File Upload       │      │  - Image Validation         │
│  - Bucket Mgmt       │      │  - Face Detection           │
│  - Static Serving    │      │  - Landmark Detection       │
│                      │      │  - Classification           │
└──────────────────────┘      │  - Grad-CAM                 │
                              └─────────────────────────────┘
```

## 🌐 Layanan & Domain

### 1. Landing Page (rescat.life)
**Purpose**: Marketing dan informasi umum

**Tech Stack**:
- Static site atau CMS
- SEO optimized
- Responsive design

**Fitur**:
- Hero section dengan value proposition
- Feature highlights
- Pricing (jika ada)
- Contact form
- Blog/News

---

### 2. Main Application (app.rescat.life)
**Purpose**: Aplikasi utama untuk end users

**Tech Stack**:
- **Backend**: Laravel 11 (PHP)
- **Frontend**: Inertia.js + React/Vue
- **Database**: MySQL/PostgreSQL
- **Auth**: Laravel Fortify + Google OAuth
- **Admin**: Filament

**Fitur Utama**:

#### Authentication & Authorization
```php
// Multi-provider auth
- Email/Password
- Google OAuth
- Role-based permissions (admin, user)
```

#### Cat Profile Management
```php
- Register cat (name, breed, gender, DOB, avatar)
- Multiple cats per user
- Health history tracking
```

#### Scan & Detection
```php
Flow:
1. User uploads cat photo
2. App → Storage Service (upload)
3. App → ML Service (analysis)
4. Save results to database
5. Display results with visualization
```

#### Pet Care Finder
```php
- Database klinik/pet care terdekat
- GPS coordinates
- Contact information
- Working hours
```

#### Article Management
```php
- Educational content
- Health tips
- Soft delete support
- Category & tags
```

**Database Schema** (Simplified):
```sql
users
├── id
├── name
├── email
├── google_id (nullable)
└── timestamps

cats
├── id
├── user_id (FK)
├── name
├── breed
├── gender
├── birth_date
├── avatar
└── timestamps

scans
├── id
├── cat_id (FK)
├── status (pending, completed, failed)
├── result_json
├── confidence_score
└── timestamps

pet_cares
├── id
├── name
├── address
├── phone
├── latitude
├── longitude
└── timestamps
```

---

### 3. ML Service (ml.rescat.life)
**Purpose**: Machine Learning inference service

**Tech Stack**:
- **Framework**: Flask (Python)
- **ML**: TensorFlow, Keras, ONNX Runtime
- **Image**: PIL, NumPy, OpenCV
- **BG Removal**: rembg

**Models**:

#### 1. MobileNetV3 - Cat Validation
```python
Purpose: Verify uploaded image is a cat
Input: RGB image (224x224)
Output: {is_cat: bool, confidence: float, breed: string}
```

#### 2. YOLO - Face Detection
```python
Purpose: Detect cat face in image
Input: RGB image (any size)
Output: Bounding boxes [{x, y, w, h, confidence}]
```

#### 3. ONNX Landmark Model
```python
Purpose: Detect facial landmarks
Input: Cropped face (96x96)
Output: {
  left_eye: [x, y],
  right_eye: [x, y],
  left_ear: [x, y],
  right_ear: [x, y],
  mouth: [x, y]
}
```

#### 4. EfficientNetB1 - Area Classification
```python
Purpose: Classify each facial area
Models:
- left_eye_classifier
- right_eye_classifier
- left_ear_classifier
- right_ear_classifier
- mouth_classifier

Input: Cropped area (224x224)
Output: {class: "normal"|"abnormal", confidence: float}
```

**API Endpoints**:
```python
POST /api/validate
- Validate if image is a cat

POST /api/detect-face
- Detect cat face and return ROI

POST /api/predict
- Full pipeline: validate → detect → landmark → classify
- Returns complete analysis with Grad-CAM

GET /health
- Service health check
```

**Processing Pipeline**:
```python
def predict_pipeline(image):
    # 1. Validate
    is_cat = validate_cat(image)
    if not is_cat:
        return {"error": "Not a cat"}
    
    # 2. Remove background (optional)
    image_nobg = remove_background(image)
    
    # 3. Detect face
    face_bbox = detect_face(image_nobg)
    face_crop = crop_image(image_nobg, face_bbox)
    
    # 4. Get landmarks
    landmarks = detect_landmarks(face_crop)
    
    # 5. Crop each area
    areas = {
        "left_eye": crop_area(face_crop, landmarks["left_eye"]),
        "right_eye": crop_area(face_crop, landmarks["right_eye"]),
        # ... etc
    }
    
    # 6. Classify each area
    results = {}
    for area_name, area_img in areas.items():
        prediction = classify_area(area_img, area_name)
        gradcam = generate_gradcam(area_img, area_name)
        results[area_name] = {
            "class": prediction["class"],
            "confidence": prediction["confidence"],
            "gradcam_url": save_gradcam(gradcam)
        }
    
    return results
```

**Caching Strategy**:
```python
# Hash-based caching for expensive operations
- Background removal results cached by image hash
- Model predictions cached (with TTL)
```

---

### 4. Storage Service (storage.rescat.life)
**Purpose**: File storage and management

**Tech Stack**:
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Upload**: Multer v2
- **Security**: Helmet, CORS, Rate Limiting

**Bucket Organization**:
```
public/
├── original-photo/          # Original uploaded images
├── roi-face-cat/           # Cropped face ROI
├── right_eye_crop/         # Cropped right eye
├── left_eye_crop/          # Cropped left eye (if exists)
├── preview-bounding-box/   # Images with bounding box overlay
├── remove-bg/              # Background removed images
└── result/                 # Final analysis results
```

**File Naming Convention**:
```javascript
// Format: {timestamp}-{uuid}.{ext}
// Example: 1765075391111-8993b505-1875-4d00-a03c-d41c2d456fd1.png

function generateFilename(originalName) {
  const timestamp = Date.now();
  const uuid = generateUUID();
  const ext = getExtension(originalName);
  return `${timestamp}-${uuid}.${ext}`;
}
```

**Configuration**:
```javascript
const config = {
  ALLOWED_BUCKETS: [
    'preview-bounding-box',
    'roi-face-cat',
    'result',
    'original-photo',
    'right_eye_crop',
    'remove-bg'
  ],
  ALLOWED_EXT: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  MAX_FILE_MB: 8,
  RATE_LIMIT: {
    windowMs: 60000,
    maxRequests: 30
  }
}
```

**Data Model**:
```typescript
interface FileMetadata {
  id: string;              // UUID
  bucket: string;          
  filename: string;        // Generated name
  originalName: string;    // User's filename
  mime: string;           
  size: number;            // bytes
  createdAt: number;       // timestamp
  url?: string;            // Full URL
}
```

---

## 🔄 Data Flow

### Complete Scan Flow

```
1. User uploads photo on app.rescat.life
   ↓
2. Frontend → POST /api/files (storage.rescat.life)
   Request: multipart/form-data with image
   Response: { id, url, filename, bucket: "original-photo" }
   ↓
3. Frontend → POST /api/predict (ml.rescat.life)
   Request: { image_url: "storage_url" }
   ↓
4. ML Service:
   a. Download image from storage
   b. Validate is cat
   c. Remove background
   d. Detect face → Upload to storage (bucket: roi-face-cat)
   e. Detect landmarks
   f. Crop areas → Upload to storage (bucket: right_eye_crop, etc)
   g. Classify each area
   h. Generate Grad-CAM → Upload to storage
   i. Create preview with bbox → Upload to storage
   ↓
5. ML Service Response:
   {
     "original_url": "...",
     "face_detection": {
       "bbox": [x, y, w, h],
       "confidence": 0.95,
       "image_url": "storage_url/roi-face-cat/..."
     },
     "landmarks": {...},
     "classifications": {
       "left_eye": {
         "class": "normal",
         "confidence": 0.92,
         "crop_url": "storage_url/left_eye_crop/...",
         "gradcam_url": "storage_url/result/..."
       },
       // ... other areas
     },
     "preview_url": "storage_url/preview-bounding-box/..."
   }
   ↓
6. Frontend saves to database (Main App)
   ↓
7. Display results to user with visualization
```

---

## 🔐 Security

### Main App
- CSRF protection (Laravel)
- XSS prevention
- SQL injection protection (Eloquent ORM)
- Rate limiting
- Secure session management

### ML Service
- Input validation
- File type verification
- Size limits
- Error handling
- No user data storage

### Storage Service
- CORS whitelist
- Rate limiting (30 req/min for uploads)
- File extension whitelist
- File size limits
- Helmet security headers
- Static file caching

---

## 📊 Performance Considerations

### ML Service
```python
Optimizations:
- ONNX Runtime for faster inference
- Image caching with hash-based keys
- Background removal caching
- Batch processing support (future)
- GPU acceleration support (optional)
```

### Storage Service
```javascript
Optimizations:
- Static file caching (Cache-Control: immutable)
- Response compression (gzip/brotli)
- In-memory index for fast lookups
- ETags for conditional requests
```

### Main App
```php
Optimizations:
- Eloquent eager loading
- Query caching
- Redis for session/cache
- Image lazy loading
- API response caching
```

---

## 🚀 Deployment Architecture

```
                    ┌──────────────┐
                    │   Cloudflare │
                    │      DNS     │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Landing    │  │   Main App   │  │  Docs Site   │
│ rescat.life  │  │app.rescat.life│  │docs.rescat.life│
│   (Static)   │  │   (Laravel)  │  │ (Docusaurus) │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
            ┌────────────┼────────────┐
            ▼                         ▼
    ┌──────────────┐          ┌──────────────┐
    │  ML Service  │          │   Storage    │
    │ml.rescat.life│          │storage.rescat│
    │   (Flask)    │◄────────►│  (Express)   │
    └──────────────┘          └──────────────┘
            │                         │
            ▼                         ▼
    ┌──────────────┐          ┌──────────────┐
    │  GPU Server  │          │ File Storage │
    │   (Model)    │          │   /public    │
    └──────────────┘          └──────────────┘
```

---

## 📝 Environment Variables

### Main App (.env)
```bash
APP_URL=https://app.rescat.life
ML_SERVICE_URL=https://ml.rescat.life
STORAGE_SERVICE_URL=https://storage.rescat.life

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=rescat
DB_USERNAME=root
DB_PASSWORD=

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

### ML Service (.env)
```bash
FLASK_ENV=production
PORT=5000
STORAGE_SERVICE_URL=https://storage.rescat.life
MODEL_PATH=/models
CACHE_DIR=/cache
USE_GPU=false
```

### Storage Service (.env)
```bash
PORT=8080
BASE_URL=https://storage.rescat.life
UPLOAD_DIR_PUBLIC=public
MAX_FILE_MB=8
ALLOWED_ORIGINS=https://app.rescat.life,https://ml.rescat.life
```

---

## 🔧 Development Setup

### Prerequisites
```bash
- Node.js 18+ (Storage Service)
- Python 3.9+ (ML Service)
- PHP 8.2+ (Main App)
- Composer (PHP)
- MySQL/PostgreSQL
```

### Local Development URLs
```
Landing:  http://localhost:3000
Main App: http://localhost:8000
ML:       http://localhost:5000
Storage:  http://localhost:8080
Docs:     http://localhost:3001
```

---

Lanjut ke dokumentasi detail masing-masing service:
- [Main App Service →](/docs/services/main-app)
- [ML Service →](/docs/services/ml-service)
- [Storage Service →](/docs/services/storage-service)
