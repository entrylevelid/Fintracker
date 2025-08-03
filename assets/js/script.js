// ===== AUTO-DETECT IP CONFIGURATION =====
const SERVER_IP = window.location.hostname;
const BASE_URL = `http://${SERVER_IP}:5000/api`;

console.log('🌐 Auto-detected Server IP:', SERVER_IP);
console.log('🔗 Base URL:', BASE_URL);

// ===== GLOBAL VARIABLES =====
let transactions = [];
let currentBudget = 1000000;
let monthlyExpenses = {};
let categories = {
    Income: [],
    Expense: []
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM loaded - initializing app');
    
    // Hide modal initially
    const modal = document.getElementById('budgetModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    
    // Set default date
    document.getElementById('date').valueAsDate = new Date();
    
    // Load data
    loadCategories();
    loadTransactions();
    loadBudgetData();
});

// ===== API HELPER FUNCTION =====
function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    console.log('📡 API Call:', url);
    
    return fetch(url, options)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return res.json();
        })
        .catch(err => {
            console.error('❌ API Error:', err);
            throw err;
        });
}

// ===== DATA LOADING FUNCTIONS =====
function loadCategories() {
    apiCall('/categories')
        .then(data => {
            categories = data;
            updateCategories();
            updateCategoryDisplay();
        })
        .catch(err => {
            console.error('Failed to load categories:', err);
            showNotification('❌ Failed to load categories', 'error');
        });
}

function loadTransactions() {
    apiCall('/transactions')
        .then(data => {
            transactions = data;
            updateTable();
            updateSummary();
        })
        .catch(err => {
            console.error('Failed to load transactions:', err);
            showNotification('❌ Failed to load transactions', 'error');
        });
}

function loadBudgetData() {
    apiCall('/budget')
        .then(data => {
            currentBudget = data.total_budget;
            document.getElementById('totalBudget').textContent = formatIDR(currentBudget);
            loadMonthlyExpenses();
        })
        .catch(err => {
            console.error('Failed to load budget:', err);
            showNotification('❌ Failed to load budget', 'error');
        });
}

function loadMonthlyExpenses() {
    updateBudgetTracker();
}

// ===== CATEGORY MANAGEMENT FUNCTIONS =====
function updateCategoryDisplay() {
    const incomeList = document.getElementById('incomeCategories');
    const expenseList = document.getElementById('expenseCategories');
    
    // Update Income categories
    incomeList.innerHTML = '';
    if (categories.Income && categories.Income.length > 0) {
        categories.Income.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat;
            incomeList.appendChild(li);
        });
    } else {
        incomeList.innerHTML = '<li>No categories available</li>';
    }
    
    // Update Expense categories
    expenseList.innerHTML = '';
    if (categories.Expense && categories.Expense.length > 0) {
        categories.Expense.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat;
            expenseList.appendChild(li);
        });
    } else {
        expenseList.innerHTML = '<li>No categories available</li>';
    }
}

function addNewCategory() {
    const type = prompt('Select type (Income/Expense):');
    if (!type || (type !== 'Income' && type !== 'Expense')) {
        alert('Please enter either "Income" or "Expense"');
        return;
    }
    
    const categoryName = prompt(`Enter new ${type} category name:`);
    if (!categoryName || categoryName.trim() === '') {
        alert('Category name cannot be empty');
        return;
    }
    
    // Check if category already exists
    if (categories[type] && categories[type].includes(categoryName.trim())) {
        alert('Category already exists');
        return;
    }
    
    apiCall('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, category: categoryName.trim() })
    })
    .then(() => {
        loadCategories();
        showNotification('✅ Category added successfully!', 'success');
    })
    .catch(err => {
        console.error('Error adding category:', err);
        if (err.message.includes('400')) {
            showNotification('❌ Category already exists', 'error');
        } else {
            showNotification('❌ Failed to add category', 'error');
        }
    });
}

function deleteCategory() {
    const type = prompt('Select type (Income/Expense):');
    if (!type || (type !== 'Income' && type !== 'Expense')) {
        alert('Please enter either "Income" or "Expense"');
        return;
    }
    
    if (!categories[type] || categories[type].length === 0) {
        alert(`No ${type} categories available`);
        return;
    }
    
    const categoryList = categories[type].join('\n');
    const categoryName = prompt(`Available ${type} categories:\n${categoryList}\n\nEnter category name to delete:`);
    
    if (!categoryName || categoryName.trim() === '') {
        return;
    }
    
    if (!categories[type].includes(categoryName.trim())) {
        alert('Category not found');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete category "${categoryName}"?\n\nNote: Existing transactions with this category will remain unchanged.`)) {
        return;
    }
    
    apiCall('/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, category: categoryName.trim() })
    })
    .then(() => {
        loadCategories();
        showNotification('✅ Category deleted successfully!', 'success');
    })
    .catch(err => {
        console.error('Error deleting category:', err);
        if (err.message.includes('404')) {
            showNotification('❌ Category not found', 'error');
        } else {
            showNotification('❌ Failed to delete category', 'error');
        }
    });
}

// ===== FORM FUNCTIONS =====
function updateCategories() {
    const type = document.getElementById('type').value;
    const categorySelect = document.getElementById('category');

    categorySelect.innerHTML = '<option value="">Choose Category</option>';

    if (type && categories[type]) {
        categories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
}

function addTransaction() {
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const notes = document.getElementById('notes').value;

    if (!date || !type || !category || !amount) {
        alert('Please fill in all required fields!');
        return;
    }

    const transaction = { date, type, category, amount, notes };

    apiCall('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
    })
    .then(() => {
        loadTransactions();
        clearForm();
        showNotification('✅ Transaction added successfully!', 'success');
    })
    .catch(err => {
        console.error('Error adding transaction:', err);
        showNotification('❌ Failed to add transaction', 'error');
    });
}

function clearForm() {
    document.getElementById('type').value = '';
    document.getElementById('category').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('notes').value = '';
    updateCategories();
}

// ===== TABLE FUNCTIONS =====
function updateTable() {
    const tbody = document.getElementById('dataTable');
    tbody.innerHTML = '';

    const sorted = [...transactions].sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare === 0) {
            return b.id - a.id;
        }
        return dateCompare;
    });

    sorted.slice(0, 5).forEach(t => {
        const row = document.createElement('tr');
        row.className = t.type === 'Income' ? 'income-row' : 'expense-row';

        const formattedAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(t.amount);

        row.innerHTML = `
            <td>${new Date(t.date).toLocaleDateString('id-ID')}</td>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td class="${t.type === 'Income' ? 'amount-positive' : 'amount-negative'}">${formattedAmount}</td>
            <td>${t.notes || '-'}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="deleteTransaction(${t.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    apiCall(`/transactions/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        loadTransactions();
        showNotification('✅ Transaction deleted successfully!', 'success');
    })
    .catch(err => {
        console.error('Error deleting transaction:', err);
        showNotification('❌ Failed to delete transaction', 'error');
    });
}

function clearAllData() {
    if (!confirm('Are you sure you want to delete all data? This action cannot be undone!')) return;

    apiCall('/transactions', {
        method: 'DELETE'
    })
    .then(() => {
        loadTransactions();
        showNotification('✅ All data cleared successfully!', 'success');
    })
    .catch(err => {
        console.error('Error clearing data:', err);
        showNotification('❌ Failed to clear data', 'error');
    });
}

// ===== SUMMARY FUNCTIONS =====
function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = formatIDR(totalIncome);
    document.getElementById('totalExpense').textContent = formatIDR(totalExpense);
    document.getElementById('netAmount').textContent = formatIDR(netAmount);

    updateBudgetTracker();
}

function formatIDR(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

// ===== EXPORT FUNCTION =====
function exportToCSV() {
    if (transactions.length === 0) {
        alert('No data to export!');
        return;
    }

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const csvData = transactions.map(t => [
        t.date, t.type, t.category, t.amount, t.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
        .map(row => row.map(field => {
            if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        }).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `Personal_Cashflow_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== BUDGET TRACKER FUNCTIONS =====
function updateBudgetTracker() {
    const totalSpent = transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPercentage = (totalSpent / currentBudget) * 100;
    const totalProgressElement = document.getElementById('totalProgress');
    const totalProgressTextElement = document.getElementById('totalProgressText');
    
    updateTotalProgressBar(totalProgressElement, totalProgressTextElement, totalPercentage, totalSpent);
}

function updateTotalProgressBar(progressElement, textElement, percentage, totalSpent) {
    progressElement.className = 'progress-fill';
    
    const displayWidth = Math.min(percentage, 100);
    progressElement.style.width = `${displayWidth}%`;
    
    if (percentage > 100) {
        progressElement.classList.add('danger', 'over-budget');
        progressElement.style.width = '100%';
        
        const overBudgetAmount = totalSpent - currentBudget;
        textElement.innerHTML = `
            <span class="over-budget-text">
                🚨 ${Math.round(percentage)}% - OVER BUDGET! 
                <br><small>Exceeded by ${formatIDR(overBudgetAmount)}</small>
            </span>
        `;
    } else if (percentage > 80) {
        progressElement.classList.add('warning');
        textElement.textContent = 
            `${Math.round(percentage)}% - ${formatIDR(totalSpent)}/${formatIDR(currentBudget/1000000)}M`;
    } else {
        textElement.textContent = 
            `${Math.round(percentage)}% - ${formatIDR(totalSpent)}/${formatIDR(currentBudget/1000000)}M`;
    }
}

// ===== MODAL FUNCTIONS =====
function openBudgetModal() {
    console.log('🔧 Opening budget modal');
    
    const modal = document.getElementById('budgetModal');
    const budgetInput = document.getElementById('budgetInput');
    
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    
    budgetInput.value = currentBudget;
    
    modal.classList.remove('show');
    modal.style.display = 'none';
    
    modal.style.display = 'flex';
    modal.offsetHeight;
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        if (budgetInput) {
            budgetInput.focus();
            budgetInput.select();
        }
    }, 350);
    
    const handleEsc = (event) => {
        if (event.key === 'Escape') {
            closeBudgetModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    
    const handleEnter = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveBudget();
        }
    };
    
    document.addEventListener('keydown', handleEsc);
    budgetInput.addEventListener('keydown', handleEnter);
    
    modal._handleEsc = handleEsc;
    budgetInput._handleEnter = handleEnter;
    
    document.body.style.overflow = 'hidden';
}

function closeBudgetModal() {
    console.log('🔧 Closing budget modal');
    
    const modal = document.getElementById('budgetModal');
    const budgetInput = document.getElementById('budgetInput');
    
    if (!modal) return;
    
    if (modal._handleEsc) {
        document.removeEventListener('keydown', modal._handleEsc);
        delete modal._handleEsc;
    }
    
    if (budgetInput && budgetInput._handleEnter) {
        budgetInput.removeEventListener('keydown', budgetInput._handleEnter);
        delete budgetInput._handleEnter;
    }
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    document.body.style.overflow = 'auto';
}

function saveBudget() {
    const budgetInput = document.getElementById('budgetInput');
    const budgetValue = parseFloat(budgetInput.value);
    
    if (!budgetInput.value || budgetValue <= 0) {
        alert('❌ Please enter a valid budget amount!');
        budgetInput.focus();
        return;
    }
    
    if (budgetValue < 100000) {
        if (!confirm('⚠️ Budget amount seems quite low. Are you sure you want to continue?')) {
            budgetInput.focus();
            return;
        }
    }
    
    const saveButton = document.querySelector('.modal-buttons .btn-success');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '⏳ Saving...';
    saveButton.disabled = true;
    
    apiCall('/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_budget: budgetValue })
    })
    .then(() => {
        currentBudget = budgetValue;
        document.getElementById('totalBudget').textContent = formatIDR(currentBudget);
        updateBudgetTracker();
        closeBudgetModal();
        showNotification('✅ Budget saved successfully!', 'success');
    })
    .catch(err => {
        console.error('Error saving budget:', err);
        showNotification('❌ Failed to save budget. Please try again.', 'error');
    })
    .finally(() => {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    });
}

function resetMonthlyBudget() {
    if (!confirm('Are you sure you want to reset the monthly budget tracker? This will reset the progress bars to zero without deleting any transactions.')) {
        return;
    }

    apiCall('/budget/reset-monthly', {
        method: 'POST'
    })
    .then(() => {
        loadMonthlyExpenses();
        showNotification('✅ Monthly budget tracker reset successfully!', 'success');
    })
    .catch(err => {
        console.error('Error resetting monthly budget:', err);
        showNotification('❌ Failed to reset monthly budget. Please try again.', 'error');
    });
}

// ===== NOTIFICATION FUNCTION =====
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        font-weight: 600;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== EVENT HANDLERS =====
window.onclick = function(event) {
    const modal = document.getElementById('budgetModal');
    if (event.target === modal) {
        closeBudgetModal();
    }
}

// ===== NOTIFICATION ANIMATIONS =====
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// ===== READY INDICATOR =====
console.log('✅ Script loaded successfully with auto-detect IP:', SERVER_IP);