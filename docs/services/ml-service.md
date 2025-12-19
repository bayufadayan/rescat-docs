---
sidebar_position: 2
---

# ML Service (Machine Learning)

**URL**: [ml.rescat.life](https://ml.rescat.life)

ML Service adalah aplikasi Flask yang menggunakan machine learning untuk mendeteksi dan mengklasifikasi ciri-ciri wajah kucing. Service ini adalah core engine dari ResCAT yang melakukan analisis gambar menggunakan multiple AI models.

## 🎯 Overview

### Purpose
- Validasi gambar kucing menggunakan MobileNetV3
- Deteksi wajah kucing dengan YOLO
- Landmark detection untuk identifikasi area spesifik
- Klasifikasi kondisi setiap area (mata, telinga, mulut)
- Grad-CAM visualization untuk interpretabilitas

### Technology Stack
- **Framework**: Flask (Python 3.9+)
- **ML Models**: TensorFlow, Keras, ONNX Runtime
- **Image Processing**: PIL (Pillow), NumPy, OpenCV
- **Background Removal**: rembg
- **Deployment**: Gunicorn, Docker

---

## 🤖 Machine Learning Models

### 1. MobileNetV3 - Cat Validator

**Purpose**: Memverifikasi apakah gambar yang diupload adalah kucing

**Architecture**:
```python
Model: MobileNetV3Small
Input Shape: (224, 224, 3)
Output: Breed classification
Classes: ['Persian', 'Siamese', 'Tabby', 'Maine Coon', ...]
```

**Usage**:
```python
from models.cat_validator import CatValidator

validator = CatValidator()
result = validator.predict(image)

# Output:
{
    "is_cat": True,
    "breed": "Persian",
    "confidence": 0.94
}
```

**Confidence Threshold**: 0.7 (adjustable)

---

### 2. YOLO - Face Detector

**Purpose**: Mendeteksi dan melokalisir wajah kucing dalam gambar

**Model**: YOLOv5 fine-tuned on cat faces

**Input**: RGB image (any size)

**Output**:
```python
{
    "detections": [
        {
            "bbox": [x, y, width, height],
            "confidence": 0.95,
            "class": "cat_face"
        }
    ]
}
```

**ROI Selection Strategy**:
```python
def select_best_roi(detections):
    # Priority:
    # 1. Highest confidence score
    # 2. Largest bounding box (if multiple high confidence)
    # 3. Most centered in image
    
    return sorted(detections, 
                  key=lambda x: (x['confidence'], x['area']),
                  reverse=True)[0]
```

---

### 3. ONNX Landmark Model

**Purpose**: Mendeteksi landmark points di wajah kucing

**Input**: Cropped face image (96x96)

**Output**:
```python
{
    "landmarks": {
        "left_eye": {"x": 32, "y": 28},
        "right_eye": {"x": 64, "y": 28},
        "left_ear": {"x": 20, "y": 10},
        "right_ear": {"x": 76, "y": 10},
        "mouth": {"x": 48, "y": 70},
        "nose": {"x": 48, "y": 50}
    },
    "confidence": 0.89
}
```

**Landmark Definitions**:
- **Eyes**: Center of eye pupil
- **Ears**: Base of ear
- **Mouth**: Center of mouth opening
- **Nose**: Tip of nose

---

### 4. EfficientNetB1 - Area Classifiers

**Purpose**: Mengklasifikasi kondisi setiap area wajah

**Models** (5 specialized classifiers):
- `left_eye_classifier.h5`
- `right_eye_classifier.h5`
- `left_ear_classifier.h5`
- `right_ear_classifier.h5`
- `mouth_classifier.h5`

**Input**: Cropped area (224x224)

**Output**:
```python
{
    "class": "normal",  # or "abnormal"
    "confidence": 0.92,
    "probabilities": {
        "normal": 0.92,
        "abnormal": 0.08
    }
}
```

**Classification Criteria**:
- **Normal**: Healthy appearance, no visible issues
- **Abnormal**: Signs of infection, inflammation, or injury

---

## 🔄 Processing Pipeline

### Full Prediction Flow

```python
def predict_full_pipeline(image_url):
    """
    Complete analysis pipeline
    """
    # 1. Download image
    image = download_image(image_url)
    
    # 2. Validate cat
    is_cat = validate_cat(image)
    if not is_cat:
        return {"error": "Not a cat"}
    
    # 3. Remove background (optional, improves accuracy)
    image_nobg = remove_background(image)
    save_to_storage(image_nobg, bucket="remove-bg")
    
    # 4. Detect face
    face_detection = detect_face(image_nobg)
    face_crop = crop_by_bbox(image_nobg, face_detection['bbox'])
    face_url = save_to_storage(face_crop, bucket="roi-face-cat")
    
    # 5. Get landmarks
    landmarks = detect_landmarks(face_crop)
    
    # 6. Crop each area based on landmarks
    areas = crop_areas_from_landmarks(face_crop, landmarks)
    # areas = {
    #     "left_eye": <image>,
    #     "right_eye": <image>,
    #     ...
    # }
    
    # 7. Classify each area
    classifications = {}
    for area_name, area_image in areas.items():
        # Save crop
        crop_url = save_to_storage(area_image, 
                                   bucket=f"{area_name}_crop")
        
        # Classify
        result = classify_area(area_image, area_name)
        
        # Generate Grad-CAM
        gradcam = generate_gradcam(area_image, area_name)
        gradcam_url = save_to_storage(gradcam, bucket="result")
        
        classifications[area_name] = {
            "class": result['class'],
            "confidence": result['confidence'],
            "crop_url": crop_url,
            "gradcam_url": gradcam_url
        }
    
    # 8. Create preview with bounding box
    preview = draw_bbox_and_landmarks(image_nobg, 
                                      face_detection['bbox'],
                                      landmarks)
    preview_url = save_to_storage(preview, 
                                  bucket="preview-bounding-box")
    
    # 9. Return complete result
    return {
        "original_url": image_url,
        "nobg_url": nobg_url,
        "face_detection": {
            "bbox": face_detection['bbox'],
            "confidence": face_detection['confidence'],
            "url": face_url
        },
        "landmarks": landmarks,
        "classifications": classifications,
        "preview_url": preview_url,
        "overall_health_score": calculate_health_score(classifications)
    }
```

---

## 📡 API Endpoints

### 1. Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_loaded": true
}
```

---

### 2. Validate Cat

```http
POST /api/validate
Content-Type: application/json
```

**Request**:
```json
{
  "image_url": "https://storage.rescat.life/files/original-photo/..."
}
```

**Response (Success)**:
```json
{
  "is_cat": true,
  "breed": "Persian",
  "confidence": 0.94,
  "message": "Image validated as cat"
}
```

**Response (Not Cat)**:
```json
{
  "is_cat": false,
  "confidence": 0.35,
  "message": "Image does not appear to be a cat"
}
```

---

### 3. Detect Face

```http
POST /api/detect-face
Content-Type: application/json
```

**Request**:
```json
{
  "image_url": "https://storage.rescat.life/files/original-photo/...",
  "return_crop": true
}
```

**Response**:
```json
{
  "success": true,
  "detection": {
    "bbox": [120, 80, 300, 300],
    "confidence": 0.96
  },
  "crop_url": "https://storage.rescat.life/files/roi-face-cat/...",
  "processing_time": 1.2
}
```

---

### 4. Full Prediction

```http
POST /api/predict
Content-Type: application/json
```

**Request**:
```json
{
  "image_url": "https://storage.rescat.life/files/original-photo/...",
  "remove_bg": true,
  "generate_gradcam": true
}
```

**Response**:
```json
{
  "success": true,
  "original_url": "...",
  "face_detection": {
    "bbox": [120, 80, 300, 300],
    "confidence": 0.96,
    "url": "https://storage.rescat.life/files/roi-face-cat/..."
  },
  "landmarks": {
    "left_eye": [45, 35],
    "right_eye": [85, 35],
    "left_ear": [30, 15],
    "right_ear": [100, 15],
    "mouth": [65, 90]
  },
  "classifications": {
    "left_eye": {
      "class": "normal",
      "confidence": 0.92,
      "crop_url": "...",
      "gradcam_url": "..."
    },
    "right_eye": {
      "class": "abnormal",
      "confidence": 0.78,
      "crop_url": "...",
      "gradcam_url": "..."
    },
    "left_ear": {
      "class": "normal",
      "confidence": 0.88,
      "crop_url": "...",
      "gradcam_url": "..."
    },
    "right_ear": {
      "class": "normal",
      "confidence": 0.85,
      "crop_url": "...",
      "gradcam_url": "..."
    },
    "mouth": {
      "class": "normal",
      "confidence": 0.91,
      "crop_url": "...",
      "gradcam_url": "..."
    }
  },
  "preview_url": "https://storage.rescat.life/files/preview-bounding-box/...",
  "health_score": 87.5,
  "processing_time": 5.3
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "NOT_A_CAT",
  "message": "Image validation failed: not a cat",
  "confidence": 0.35
}
```

---

## 🎨 Grad-CAM Visualization

### Purpose
Grad-CAM (Gradient-weighted Class Activation Mapping) menunjukkan area mana yang paling "diperhatikan" oleh model saat membuat prediksi.

### Implementation
```python
import tensorflow as tf
import numpy as np
import cv2

def generate_gradcam(image, model, layer_name):
    """
    Generate Grad-CAM heatmap
    """
    # Get model output and last conv layer
    grad_model = tf.keras.models.Model(
        [model.inputs],
        [model.get_layer(layer_name).output, model.output]
    )
    
    # Compute gradient
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(image)
        loss = predictions[:, tf.argmax(predictions[0])]
    
    # Get gradients
    grads = tape.gradient(loss, conv_outputs)
    
    # Pool gradients
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    
    # Weight feature maps
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    
    # Normalize
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    heatmap = heatmap.numpy()
    
    # Resize to original image size
    heatmap = cv2.resize(heatmap, (image.shape[2], image.shape[1]))
    
    # Apply colormap
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    
    # Overlay on original image
    superimposed = cv2.addWeighted(image, 0.6, heatmap, 0.4, 0)
    
    return superimposed
```

### Usage
```python
gradcam = generate_gradcam(
    image=eye_crop,
    model=left_eye_classifier,
    layer_name='top_conv'
)

# Save to storage
gradcam_url = save_to_storage(gradcam, bucket="result")
```

---

## 🗄️ Caching Strategy

### Background Removal Caching
```python
import hashlib
from functools import lru_cache

def get_image_hash(image):
    """Generate hash for image"""
    return hashlib.md5(image.tobytes()).hexdigest()

@lru_cache(maxsize=100)
def remove_background_cached(image_hash, image_path):
    """
    Cache expensive background removal
    """
    cache_key = f"nobg:{image_hash}"
    
    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Process
    result = rembg.remove(Image.open(image_path))
    
    # Cache result
    cache.set(cache_key, result, timeout=3600)
    
    return result
```

### Model Prediction Caching
```python
from cachetools import TTLCache

prediction_cache = TTLCache(maxsize=1000, ttl=300)

def predict_with_cache(image, model_name):
    """Cache predictions for 5 minutes"""
    cache_key = f"{model_name}:{get_image_hash(image)}"
    
    if cache_key in prediction_cache:
        return prediction_cache[cache_key]
    
    result = model.predict(image)
    prediction_cache[cache_key] = result
    
    return result
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Flask
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000

# External Services
STORAGE_SERVICE_URL=https://storage.rescat.life
STORAGE_API_KEY=your-api-key

# Model Paths
MODEL_DIR=/app/models
CACHE_DIR=/app/cache

# Performance
USE_GPU=true
GPU_MEMORY_FRACTION=0.8
BATCH_SIZE=16
NUM_WORKERS=4

# Thresholds
CAT_CONFIDENCE_THRESHOLD=0.7
FACE_CONFIDENCE_THRESHOLD=0.5
CLASSIFICATION_THRESHOLD=0.6

# Features
ENABLE_BACKGROUND_REMOVAL=true
ENABLE_GRADCAM=true
CACHE_PREDICTIONS=true
```

### Model Configuration
```python
# config/models.py

MODELS = {
    'cat_validator': {
        'path': 'models/mobilenetv3_cat_validator.h5',
        'input_size': (224, 224),
        'preprocessing': 'mobilenet_v3'
    },
    'face_detector': {
        'path': 'models/yolov5_cat_face.pt',
        'confidence': 0.5,
        'iou_threshold': 0.45
    },
    'landmark_detector': {
        'path': 'models/landmark_detector.onnx',
        'input_size': (96, 96)
    },
    'area_classifiers': {
        'left_eye': 'models/left_eye_efficientnetb1.h5',
        'right_eye': 'models/right_eye_efficientnetb1.h5',
        'left_ear': 'models/left_ear_efficientnetb1.h5',
        'right_ear': 'models/right_ear_efficientnetb1.h5',
        'mouth': 'models/mouth_efficientnetb1.h5'
    }
}
```

---

## 🚀 Deployment

### Docker Setup
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
WORKDIR /app
COPY . .

# Download models (or mount as volume)
RUN python scripts/download_models.py

# Expose port
EXPOSE 5000

# Run with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
```

### requirements.txt
```
flask==2.3.0
tensorflow==2.13.0
onnxruntime==1.15.0
pillow==10.0.0
numpy==1.24.0
opencv-python==4.8.0
rembg==2.0.50
gunicorn==21.2.0
requests==2.31.0
python-dotenv==1.0.0
cachetools==5.3.0
```

---

## 📊 Performance Metrics

### Inference Time (Average)
- Cat Validation: ~100ms
- Face Detection: ~200ms
- Landmark Detection: ~150ms
- Area Classification (per area): ~180ms
- Grad-CAM Generation (per area): ~250ms
- Background Removal: ~1.5s

**Total Pipeline**: ~4-6 seconds per image

### Model Accuracy
- Cat Validator: 96.5%
- Face Detector: 94.2% mAP
- Landmark Detector: 92.8% accuracy
- Area Classifiers: 89-93% accuracy (varies by area)

---

## 🐛 Error Handling

### Error Codes
```python
ERROR_CODES = {
    'NOT_A_CAT': 'Image validation failed',
    'NO_FACE_DETECTED': 'Could not detect cat face',
    'LANDMARK_DETECTION_FAILED': 'Failed to detect landmarks',
    'CLASSIFICATION_ERROR': 'Classification failed',
    'STORAGE_ERROR': 'Failed to upload to storage',
    'INVALID_IMAGE_URL': 'Invalid or inaccessible image URL',
    'MODEL_LOAD_ERROR': 'Failed to load ML model'
}
```

### Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ml_service.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usage
logger.info(f"Processing image: {image_url}")
logger.error(f"Prediction failed: {str(e)}", exc_info=True)
```

---

## 📈 Monitoring

### Health Metrics
```python
from prometheus_client import Counter, Histogram

prediction_counter = Counter('predictions_total', 'Total predictions')
prediction_duration = Histogram('prediction_duration_seconds', 
                               'Prediction duration')

@prediction_duration.time()
def predict(image):
    prediction_counter.inc()
    # ... prediction logic
```

---

Untuk detail API lengkap, lihat [ML Service API Reference](/docs/api/ml-service).
