# backend/app.py
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # agar bisa diakses dari frontend

DB_NAME = "database.db"

# Inisialisasi database
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            notes TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS monthly_budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            total_budget REAL NOT NULL,
            created_date TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS budget_reset (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            reset_date TEXT NOT NULL,
            baseline_expenses TEXT NOT NULL
        )
    ''')
    # Tambahkan tabel categories
    c.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            UNIQUE(type, category)
        )
    ''')
    
    # Insert default categories jika tabel kosong
    c.execute("SELECT COUNT(*) FROM categories")
    if c.fetchone()[0] == 0:
        default_categories = [
            ('Income', 'Salary'),
            ('Income', 'Gocar'),
            ('Income', 'Grabcar'),
            ('Income', 'Other Income'),
            ('Expense', 'Car'),
            ('Expense', 'Housing'),
            ('Expense', 'Transportation'),
            ('Expense', 'Electricity'),
            ('Expense', 'Groceries'),
            ('Expense', 'Food & Beverage'),
            ('Expense', 'Digital Top-up'),
            ('Expense', 'Charity'),
            ('Expense', 'Personal Care'),
            ('Expense', 'Entertainment'),
            ('Expense', 'Education'),
            ('Expense', 'Miscellaneous')
        ]
        c.executemany("INSERT INTO categories (type, category) VALUES (?, ?)", default_categories)
    
    conn.commit()
    conn.close()

# Route untuk file HTML utama
@app.route('/')
def index():
    return send_file('../index.html')

# Route untuk file CSS
@app.route('/assets/css/<path:filename>')
def css_files(filename):
    return send_file(f'../assets/css/{filename}')

# Route untuk file JS
@app.route('/assets/js/<path:filename>')
def js_files(filename):
    return send_file(f'../assets/js/{filename}')

# ===== CATEGORY ENDPOINTS =====
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT type, category FROM categories ORDER BY type, category")
    rows = c.fetchall()
    conn.close()
    
    result = {'Income': [], 'Expense': []}
    for row in rows:
        result[row[0]].append(row[1])
    
    return jsonify(result)

@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO categories (type, category) VALUES (?, ?)", 
                 (data['type'], data['category']))
        conn.commit()
        conn.close()
        return jsonify({"message": "Category added"}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Category already exists"}), 400

@app.route('/api/categories', methods=['DELETE'])
def delete_category():
    data = request.get_json()
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM categories WHERE type = ? AND category = ?", 
             (data['type'], data['category']))
    if c.rowcount == 0:
        conn.close()
        return jsonify({"error": "Category not found"}), 404
    conn.commit()
    conn.close()
    return jsonify({"message": "Category deleted"}), 200

# ===== TRANSACTION ENDPOINTS =====
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, date, type, category, amount, notes FROM transactions")
    rows = c.fetchall()
    conn.close()

    transactions = [
        {"id": r[0], "date": r[1], "type": r[2], "category": r[3], "amount": r[4], "notes": r[5]}
        for r in rows
    ]
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO transactions (date, type, category, amount, notes)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['date'], data['type'], data['category'], data['amount'], data.get('notes')))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction added"}), 201

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM transactions WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction deleted"}), 200

@app.route('/api/transactions', methods=['DELETE'])
def clear_transactions():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM transactions")
    conn.commit()
    conn.close()
    return jsonify({"message": "All transactions deleted"}), 200

# ===== BUDGET ENDPOINTS =====
@app.route('/api/budget', methods=['GET'])
def get_budget():
    from datetime import datetime
    current_month = datetime.now().strftime('%Y-%m')
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT total_budget FROM monthly_budget WHERE month = ?", (current_month,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return jsonify({"total_budget": row[0]})
    else:
        return jsonify({"total_budget": 1000000})  # default 1M

@app.route('/api/budget', methods=['POST'])
def set_budget():
    from datetime import datetime
    data = request.get_json()
    current_month = datetime.now().strftime('%Y-%m')
    current_date = datetime.now().isoformat()
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Replace existing budget for current month
    c.execute("DELETE FROM monthly_budget WHERE month = ?", (current_month,))
    c.execute('''
        INSERT INTO monthly_budget (month, total_budget, created_date)
        VALUES (?, ?, ?)
    ''', (current_month, data['total_budget'], current_date))
    conn.commit()
    conn.close()
    return jsonify({"message": "Budget set successfully"}), 201

@app.route('/api/budget/reset-monthly', methods=['POST'])
def reset_monthly_budget():
    # This endpoint is for future use if needed
    return jsonify({"message": "Monthly budget reset successfully"}), 200

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)