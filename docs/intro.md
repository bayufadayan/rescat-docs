---
sidebar_position: 1
---

# Selamat Datang di ResCAT Documentation

**ResCAT** (Rescue Cat) adalah platform komprehensif untuk deteksi kesehatan kucing menggunakan teknologi **Artificial Intelligence** dan **Computer Vision**. Sistem ini dirancang untuk membantu pemilik kucing melakukan screening awal kondisi kesehatan kucing mereka melalui analisis gambar.

## 🎯 Apa itu ResCAT?

ResCAT adalah ekosistem aplikasi yang terdiri dari beberapa layanan terintegrasi:

- **Main Application** - Aplikasi web untuk user interaction
- **ML Service** - Machine learning service untuk deteksi dan klasifikasi
- **Storage Service** - File storage untuk manajemen gambar

## ✨ Fitur Utama

### 🔍 Deteksi Multi-Area
Analisis komprehensif pada berbagai area wajah kucing:
- Mata kiri dan kanan
- Telinga kiri dan kanan
- Area mulut

### 🤖 AI-Powered Analysis
- Model MobileNetV3 untuk validasi gambar kucing
- YOLO untuk deteksi wajah
- EfficientNetB1 untuk klasifikasi kondisi
- Grad-CAM visualization untuk interpretabilitas

### ☁️ Cloud Storage
- Upload dan manajemen file terorganisir
- Bucket system untuk kategorisasi gambar
- API RESTful untuk integrasi mudah

## 🚀 Quick Start

### Untuk Developer

1. **Baca Dokumentasi Arsitektur**
   
   Lihat [Arsitektur Sistem](/docs/architecture) untuk memahami bagaimana sistem bekerja

2. **Setup Local Development**
   - Clone repository yang diperlukan
   - Install dependencies
   - Configure environment variables

3. **Integrate dengan API**
   - ML Service: `https://ml.rescat.life`
   - Storage Service: `https://storage.rescat.life`

### Untuk End User

1. Kunjungi [app.rescat.life](https://app.rescat.life)
2. Register atau login
3. Upload foto kucing Anda
4. Dapatkan hasil analisis instant

## 📚 Dokumentasi

### Untuk Developer
- [Arsitektur Sistem](/docs/architecture)
- [ML Service Documentation](/docs/services/ml-service)
- [Storage Service Documentation](/docs/services/storage-service)
- [Main App Documentation](/docs/services/main-app)

### API Reference
- [ML Service API](/docs/api/ml-service)
- [Storage Service API](/docs/api/storage-service)

## 🏗️ Teknologi Stack

### Main Application
- **Backend**: Laravel 11 + Inertia.js
- **Frontend**: React/Vue.js
- **Database**: MySQL/PostgreSQL
- **Auth**: Laravel Fortify + OAuth

### ML Service
- **Framework**: Flask (Python)
- **ML Models**: TensorFlow, Keras, ONNX
- **Image Processing**: PIL, NumPy, rembg

### Storage Service
- **Runtime**: Node.js
- **Framework**: Express.js
- **Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## 🌟 Use Cases

### 1. Pet Owner
Screening kesehatan kucing secara mandiri sebelum ke dokter hewan.

### 2. Veterinary Telemedicine
Alat bantu diagnosis jarak jauh untuk klinik hewan.

### 3. Pet Care Apps
Integrasi fitur health check pada aplikasi perawatan hewan.

### 4. Research
Platform untuk studi tentang penyakit kucing berbasis computer vision.

## 🔗 Links

- **Landing Page**: [rescat.life](https://rescat.life)
- **Main App**: [app.rescat.life](https://app.rescat.life)
- **ML Service**: [ml.rescat.life](https://ml.rescat.life)
- **Storage Service**: [storage.rescat.life](https://storage.rescat.life)
- **Documentation**: [docs.rescat.life](https://docs.rescat.life)

## 💡 Cara Kerja

ResCAT menggunakan pipeline multi-stage untuk analisis gambar kucing:

1. **Upload** → User mengunggah foto kucing
2. **Validation** → Sistem memverifikasi apakah gambar adalah kucing
3. **Detection** → Mendeteksi wajah kucing dalam gambar
4. **Landmark** → Mengidentifikasi posisi mata, telinga, mulut
5. **Classification** → Mengklasifikasi setiap area (normal/abnormal)
6. **Visualization** → Menampilkan hasil dengan Grad-CAM heatmap

## 📞 Support

Untuk pertanyaan atau bantuan, silakan hubungi:
- Email: support@rescat.life
- GitHub: [ResCAT Storage](https://github.com/bayufadayan/rescat-storage)

## 📄 License

ResCAT adalah proyek skripsi/thesis. Untuk informasi lisensi lebih lanjut, silakan hubungi tim pengembang.

---

**Mari mulai!** 🚀 Lanjutkan ke [Arsitektur Sistem](/docs/architecture) untuk memahami bagaimana ResCAT bekerja.

