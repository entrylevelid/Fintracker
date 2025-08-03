# 💰 FinTracker

**FinTracker** adalah aplikasi web untuk mencatat pemasukan, pengeluaran, dan memantau anggaran bulanan secara visual. Cocok untuk pengguna yang ingin mengelola keuangan pribadi secara lokal dan ringan tanpa ketergantungan pada aplikasi pihak ketiga.

---

## 🧩 Fitur

- Tambah & hapus transaksi (Income/Expense)
- Kelola kategori transaksi dinamis
- Tetapkan dan lacak anggaran bulanan
- Visualisasi progres anggaran
- Ringkasan total pemasukan, pengeluaran, dan saldo
- Ekspor data transaksi ke format CSV
- UI responsif dengan tampilan gelap

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python Flask
- **Database:** SQLite
- **REST API:** untuk transaksi, kategori, dan budget
- **CORS:** untuk komunikasi frontend-backend

---

## 🚀 Cara Menjalankan

### 1. Clone repositori

```bash
git clone https://github.com/username/fintracker.git
cd fintracker
```

### 2. Install dependensi Python

```bash
pip install -r requirements.txt
```

### 3. Jalankan backend Flask

```bash
cd backend
python app.py
```

### 4. Akses aplikasi

Buka browser dan kunjungi:

```
http://localhost:5000
```

---

## 📁 Struktur Direktori

```
FINTRACKER/
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── script.js
├── index.html
├── backend/
│   ├── app.py
│   └── database.db
└── requirements.txt
```
---

## 📝 Project Submission Summary

### ● Project Title
FinTracker - Personal Finance & Budgeting Web App

### ● Description
FinTracker adalah aplikasi web sederhana untuk pencatatan pemasukan dan pengeluaran pribadi, serta pelacakan anggaran bulanan secara visual. Aplikasi ini memungkinkan pengguna mengelola transaksi keuangan dan kategori secara fleksibel dan ringan, langsung dari browser tanpa instalasi tambahan.

### ● Technologies Used
- Python (Flask)
- HTML5
- CSS3 (Dark Theme Styling)
- JavaScript (Vanilla)
- SQLite (Local Embedded Database)
- RESTful API
- CORS (Cross-Origin Resource Sharing)

### ● Features
- Form pencatatan transaksi (Income dan Expense)
- Sistem kategori dinamis (tambah/hapus)
- Dashboard ringkasan keuangan
- Pelacakan anggaran bulanan berbasis progress bar
- Ekspor data transaksi ke file CSV
- UI adaptif dan interaktif

### ● Setup Instructions
1. Clone repository:  
   `git clone https://github.com/username/fintracker.git`
2. Masuk ke direktori proyek:  
   `cd fintracker`
3. Install dependensi Python:  
   `pip install -r requirements.txt`
4. Jalankan backend Flask:  
   `cd backend && python app.py`
5. Akses aplikasi di browser:  
   `http://localhost:5000`

### ● AI Support Explanation
Selama pengembangan, AI digunakan untuk:
- Merancang struktur proyek dan API endpoint
- Menulis ulang deskripsi teknis dan dokumentasi (README)
- Membantu debugging dan validasi fungsi pada JavaScript dan Flask
- Menyempurnakan UI/UX melalui gaya CSS modern dan progresif

AI tidak digunakan untuk mengambil keputusan keuangan atau menyimpan data pengguna di cloud. Semua data disimpan secara lokal.