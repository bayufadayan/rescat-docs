---
sidebar_position: 3
---

# Storage Service

**URL**: [storage.rescat.life](https://storage.rescat.life)  
**GitHub**: [bayufadayan/rescat-storage](https://github.com/bayufadayan/rescat-storage)

Storage Service adalah layanan penyimpanan file berbasis Express.js untuk mengelola gambar dan file lainnya dalam sistem ResCAT. Service ini menyediakan REST API untuk operasi upload, list, get, dan delete file dengan sistem bucket/folder terorganisir.

## 🎯 Overview

### Purpose
- File storage untuk gambar kucing
- Bucket-based organization
- Static file serving dengan caching
- RESTful API untuk manajemen file
- Metadata tracking untuk setiap file

### Technology Stack
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js v5
- **File Upload**: Multer v2
- **Security**: Helmet, CORS, Rate Limiting
- **Performance**: Compression, ETags

---

## 📁 Bucket System

### Bucket Organization

ResCAT menggunakan sistem bucket untuk mengorganisir file berdasarkan tahap processing:

```
public/
├── original-photo/          # Original uploaded images from users
├── remove-bg/              # Images with background removed
├── roi-face-cat/           # Cropped face Region of Interest
├── right_eye_crop/         # Cropped right eye
├── left_eye_crop/          # Cropped left eye (if exists)
├── left_ear_crop/          # Cropped left ear
├── right_ear_crop/         # Cropped right ear
├── mouth_crop/             # Cropped mouth area
├── preview-bounding-box/   # Images with bounding box overlay
└── result/                 # Final analysis results (Grad-CAM, etc)
```

### Allowed Buckets
```javascript
const ALLOWED_BUCKETS = [
  'preview-bounding-box',
  'roi-face-cat',
  'result',
  'original-photo',
  'right_eye_crop',
  'remove-bg'
];
```

> **Note**: Bucket names are validated on every operation. Only allowed buckets can be used.

---

## 📝 File Naming Convention

### Generated Filename Format
```
{timestamp}-{uuid}.{extension}
```

**Example**:
```
1765075391111-8993b505-1875-4d00-a03c-d41c2d456fd1.png
```

**Components**:
- **Timestamp**: Unix timestamp in milliseconds (13 digits)
- **UUID**: UUID v4 (36 characters with hyphens)
- **Extension**: Original file extension (lowercase)

### Why This Format?
✅ **Unique**: Combination of timestamp + UUID guarantees uniqueness  
✅ **Sortable**: Timestamp prefix allows chronological sorting  
✅ **Traceable**: Can identify when file was uploaded  
✅ **Safe**: Prevents filename conflicts

### Validation Regex
```regex
^[0-9]{13}-[0-9a-f-]{36}\.[a-z0-9]+$
```

---

## 🗄️ Data Model

### FileMetadata Interface

```typescript
interface FileMetadata {
  id: string;              // UUID v4, unique identifier
  bucket: string;          // Bucket name
  filename: string;        // Generated filename
  originalName: string;    // User's original filename
  mime: string;            // MIME type (e.g., "image/jpeg")
  size: number;            // File size in bytes
  createdAt: number;       // Upload timestamp (milliseconds)
  url?: string;            // Full public URL (computed)
}
```

### Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "bucket": "original-photo",
  "filename": "1765075391111-550e8400-e29b-41d4-a716-446655440000.jpg",
  "originalName": "my-cat.jpg",
  "mime": "image/jpeg",
  "size": 1234567,
  "createdAt": 1765075391163,
  "url": "https://storage.rescat.life/files/original-photo/1765075391111-550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

---

## 📡 API Endpoints Overview

### File Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/files` | Upload a new file |
| `GET` | `/api/files` | List all files (with pagination) |
| `GET` | `/api/files/:id` | Get file metadata by ID |
| `GET` | `/api/files/by-name/:filename` | Get file metadata by filename |
| `GET` | `/api/files/bucket/:bucket` | Get files from specific bucket |
| `DELETE` | `/api/files/by-name/:filename` | Delete single file |
| `DELETE` | `/api/files/selected` | Batch delete multiple files |
| `DELETE` | `/api/files/bucket/:bucket` | Delete all files in bucket |
| `DELETE` | `/api/files?confirm=yes` | Delete ALL files (dangerous!) |

### Static File Access
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/files/:bucket/:filename` | Access static file content |

---

## 🚀 Quick Start Examples

### Upload File
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('bucket', 'original-photo');

const response = await fetch('https://storage.rescat.life/api/files', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Uploaded:', data.data.url);
```

### List Files
```javascript
const response = await fetch(
  'https://storage.rescat.life/api/files?bucket=original-photo&limit=10'
);
const data = await response.json();

data.data.forEach(file => {
  console.log(file.filename, file.size);
});
```

### Delete File
```javascript
const response = await fetch(
  'https://storage.rescat.life/api/files/by-name/1765075391111-xxx.png',
  { method: 'DELETE' }
);
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Server
PORT=8080
BASE_URL=https://storage.rescat.life

# Storage
UPLOAD_DIR_PUBLIC=public
MAX_FILE_MB=8

# Allowed Values
ALLOWED_BUCKETS=preview-bounding-box,roi-face-cat,result,original-photo,right_eye_crop,remove-bg
ALLOWED_EXT=jpg,jpeg,png,webp,pdf

# CORS
ALLOWED_ORIGINS=https://app.rescat.life,https://ml.rescat.life
```

### Limits & Restrictions

#### File Size
```javascript
MAX_FILE_MB = 8 // Default: 8MB
```

#### Allowed Extensions
```javascript
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
```

#### Rate Limiting
```javascript
// Upload endpoint only
{
  windowMs: 60000,      // 1 minute
  maxRequests: 30       // 30 uploads per minute
}
```

---

## 🗂️ Database Structure

Storage Service uses a simple JSON file as database:

### File: `data/index.json`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "bucket": "original-photo",
    "filename": "1765075391111-550e8400-e29b-41d4-a716-446655440000.jpg",
    "originalName": "cat-photo.jpg",
    "mime": "image/jpeg",
    "size": 1234567,
    "createdAt": 1765075391163
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "bucket": "roi-face-cat",
    "filename": "1765075400000-660e8400-e29b-41d4-a716-446655440001.png",
    "originalName": "face-crop.png",
    "mime": "image/png",
    "size": 523456,
    "createdAt": 1765075400000
  }
]
```

### In-Memory Indexing

For performance, the service maintains in-memory indexes:

```javascript
class FileIndex {
  constructor() {
    this.byId = new Map();        // O(1) lookup by ID
    this.byFilename = new Map();  // O(1) lookup by filename
    this.byBucket = new Map();    // O(1) lookup by bucket
  }
  
  add(file) {
    this.byId.set(file.id, file);
    this.byFilename.set(file.filename, file);
    
    if (!this.byBucket.has(file.bucket)) {
      this.byBucket.set(file.bucket, []);
    }
    this.byBucket.get(file.bucket).push(file);
  }
}
```

---

## 🔐 Security Features

### CORS Protection
```javascript
// Only allow specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

### Helmet Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Sets headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
```

### File Validation
```javascript
function validateFile(file) {
  // Check extension
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error('EXT_NOT_ALLOWED');
  }
  
  // Check size
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error('FILE_TOO_LARGE');
  }
  
  // Check MIME type
  if (!file.mimetype.startsWith('image/')) {
    throw new Error('INVALID_MIME_TYPE');
  }
}
```

---

## 📊 Performance Optimization

### Static File Caching
```javascript
app.use('/files', express.static('public', {
  maxAge: '1y',           // Cache for 1 year
  immutable: true,        // File never changes
  etag: true,            // ETag support
  lastModified: true     // Last-Modified support
}));
```

### Response Headers
```
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123def456"
Content-Length: 1234567
Content-Type: image/jpeg
```

### Response Compression
```javascript
app.use(compression({
  filter: (req, res) => {
    // Compress JSON responses
    if (req.headers['accept'].includes('application/json')) {
      return true;
    }
    return compression.filter(req, res);
  }
}));
```

---

## 🔄 Integration Examples

### From Main App (Laravel)
```php
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\MultipartStream;

class StorageService
{
    protected $client;
    protected $baseUrl = 'https://storage.rescat.life';
    
    public function upload($file, $bucket = 'original-photo')
    {
        $multipart = [
            [
                'name' => 'file',
                'contents' => fopen($file->path(), 'r'),
                'filename' => $file->getClientOriginalName()
            ],
            [
                'name' => 'bucket',
                'contents' => $bucket
            ]
        ];
        
        $response = $this->client->post('/api/files', [
            'multipart' => $multipart
        ]);
        
        return json_decode($response->getBody(), true);
    }
    
    public function delete($filename)
    {
        return $this->client->delete("/api/files/by-name/{$filename}");
    }
    
    public function listFiles($bucket = null, $limit = 50, $cursor = null)
    {
        $query = http_build_query([
            'bucket' => $bucket,
            'limit' => $limit,
            'cursor' => $cursor
        ]);
        
        $response = $this->client->get("/api/files?{$query}");
        return json_decode($response->getBody(), true);
    }
}
```

### From ML Service (Python/Flask)
```python
import requests

class StorageClient:
    def __init__(self):
        self.base_url = 'https://storage.rescat.life'
    
    def upload(self, image_path, bucket='roi-face-cat'):
        """Upload file to storage"""
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'bucket': bucket}
            
            response = requests.post(
                f'{self.base_url}/api/files',
                files=files,
                data=data,
                timeout=30
            )
            
            return response.json()
    
    def delete(self, filename):
        """Delete file by filename"""
        response = requests.delete(
            f'{self.base_url}/api/files/by-name/{filename}',
            timeout=10
        )
        return response.json()
    
    def get_file_url(self, bucket, filename):
        """Construct full URL"""
        return f'{self.base_url}/files/{bucket}/{filename}'
```

---

## 🐛 Error Handling

### Error Response Format
```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "hint": "Optional hint message"
}
```

### Common Errors

| Error Code | HTTP Status | Description | Solution |
|------------|-------------|-------------|----------|
| `EXT_NOT_ALLOWED` | 400 | Invalid file extension | Use jpg, jpeg, png, webp, or pdf |
| `BUCKET_NOT_ALLOWED` | 400 | Invalid bucket name | Check ALLOWED_BUCKETS config |
| `NO_FILE` | 400 | No file in request | Ensure 'file' field in form-data |
| `BAD_NAME` | 400 | Invalid filename format | Use generated filenames only |
| `FILE_TOO_LARGE` | 413 | File exceeds limit | Reduce file size < 8MB |
| `NOT_FOUND` | 404 | File doesn't exist | Check filename/ID |
| `CONFIRM_REQUIRED` | 400 | Missing confirmation | Add ?confirm=yes parameter |

---

## 📈 Monitoring & Logging

### Morgan Logging
```javascript
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
```

**Example Logs**:
```
POST /api/files 200 456 - 45.123 ms
GET /api/files?bucket=original-photo 200 1234 - 12.456 ms
DELETE /api/files/bucket/roi-face-cat 200 567 - 234.567 ms
GET /files/original-photo/1765075391111-xxx.jpg 200 653132 - 5.234 ms
```

### Rate Limit Headers
```
RateLimit-Limit: 30
RateLimit-Remaining: 25
RateLimit-Reset: 1765075450000
```

---

## 🚀 Deployment

### Production Setup

**1. Install Dependencies**
```bash
npm install --production
```

**2. Configure Environment**
```bash
cp .env.example .env
# Edit .env with production values
```

**3. Start Service**
```bash
npm start
# or with PM2
pm2 start npm --name "rescat-storage" -- start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Create necessary directories
RUN mkdir -p public data

EXPOSE 8080

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  storage:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - BASE_URL=https://storage.rescat.life
      - MAX_FILE_MB=8
    volumes:
      - ./public:/app/public
      - ./data:/app/data
    restart: unless-stopped
```

---

## 📊 Storage Considerations

### Disk Space Management

**Monitor Disk Usage**:
```bash
# Check directory size
du -sh public/*

# Count files per bucket
ls public/original-photo | wc -l
```

**Cleanup Old Files** (if needed):
```javascript
// Example: Delete files older than 30 days
const RETENTION_DAYS = 30;
const cutoffTime = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);

const oldFiles = allFiles.filter(f => f.createdAt < cutoffTime);
oldFiles.forEach(f => deleteFile(f.filename));
```

### Scalability Recommendations

For production at scale:
- ✅ Use object storage (AWS S3, MinIO, DigitalOcean Spaces)
- ✅ Implement CDN for static files
- ✅ Use PostgreSQL/MongoDB instead of JSON file
- ✅ Add Redis for caching
- ✅ Implement file chunking for large uploads
- ✅ Add webhooks for file events

---

## 🧪 Testing

### cURL Examples
```bash
# Upload file
curl -X POST https://storage.rescat.life/api/files \
  -F "file=@cat.jpg" \
  -F "bucket=original-photo"

# List files
curl "https://storage.rescat.life/api/files?bucket=original-photo&limit=10"

# Delete file
curl -X DELETE "https://storage.rescat.life/api/files/by-name/1765075391111-xxx.png"

# Access static file
curl "https://storage.rescat.life/files/original-photo/1765075391111-xxx.jpg" -o downloaded.jpg
```

---

Untuk detail API lengkap, lihat [Storage Service API Reference](/docs/api/storage-service).
