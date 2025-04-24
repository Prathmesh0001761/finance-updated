// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const transactionsBody = document.getElementById('transactions-body');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const balanceEl = document.getElementById('balance');
const exportBtn = document.getElementById('export-csv');
const categoryError = document.getElementById('category-error');

// Categories
const categories = {
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'],
    expense: ['Food', 'Transportation', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Education', 'Shopping', 'Other Expenses']
};

// Chart instances
let categoryChart, monthlyChart;

// Initialize the application
function init() {
    // Set default date to today (adjusted for timezone)
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    dateInput.value = localDate.toISOString().split('T')[0];

    // Load data and render UI
    loadTransactions();
    updateSummary();
    renderCharts();

    // Event listeners
    typeSelect.addEventListener('change', updateCategories);
    transactionForm.addEventListener('submit', addTransaction);
    exportBtn.addEventListener('click', exportToCSV);
}

// Update category dropdown based on selected type
function updateCategories() {
    const type = typeSelect.value;
    console.log(`Type changed to: ${type}`);
    
    // Reset category dropdown
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categorySelect.disabled = !type;
    
    // Show/hide error message with animation
    if (!type) {
        categoryError.classList.add('show');
        categoryError.textContent = 'Please select a type first';
        console.log('No type selected');
        return;
    } else {
        categoryError.classList.remove('show');
    }
    
    // Populate categories with animation
    if (type && categories[type]) {
        console.log(`Populated categories for ${type}:`, categories[type]);
        
        // Add slight delay for animation effect
        setTimeout(() => {
            categories[type].forEach((category, index) => {
                setTimeout(() => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    option.classList.add('fade-in');
                    categorySelect.appendChild(option);
                }, index * 50);
            });
        }, 100);
    } else {
        console.warn(`No categories for type: ${type}`);
        categoryError.classList.add('show');
        categoryError.textContent = 'No categories available for this type';
    }
}

// Add a new transaction with animation
function addTransaction(e) {
    e.preventDefault();
    
    // Validate form
    if (!typeSelect.value) {
        showValidationError(typeSelect, 'Please select a transaction type');
        return;
    }
    
    if (!categorySelect.value) {
        showValidationError(categorySelect, 'Please select a category');
        return;
    }
    
    if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
        showValidationError(amountInput, 'Please enter a valid amount');
        return;
    }
    
    if (!dateInput.value) {
        showValidationError(dateInput, 'Please select a date');
        return;
    }
    
    // Create transaction object
    const transaction = {
        id: Date.now(),
        type: typeSelect.value,
        category: categorySelect.value,
        amount: parseFloat(amountInput.value),
        date: dateInput.value,
        description: descriptionInput.value
    };
    
    // Save to localStorage
    const transactions = getTransactions();
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Animate the submission
    animateSuccess();
    
    // Reset form (but keep type selection)
    const currentType = typeSelect.value;
    transactionForm.reset();
    typeSelect.value = currentType;
    updateCategories();
    
    // Refresh UI with animations
    setTimeout(() => {
        loadTransactions();
        updateSummary();
        renderCharts();
    }, 500);
}

// Show validation error with animation
function showValidationError(element, message) {
    element.classList.add('ring-2', 'ring-red-500');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show mt-1 text-red-500 text-sm';
    errorDiv.textContent = message;
    
    // Insert after the element
    element.parentNode.insertBefore(errorDiv, element.nextSibling);
    
    // Shake animation
    element.classList.add('animate__animated', 'animate__headShake');
    setTimeout(() => {
        element.classList.remove('animate__animated', 'animate__headShake', 'ring-2', 'ring-red-500');
        errorDiv.remove();
    }, 2000);
}

// Animate success feedback
function animateSuccess() {
    const submitBtn = transactionForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Added!';
    submitBtn.classList.remove('bg-blue-500');
    submitBtn.classList.add('bg-green-500');
    
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Transaction';
        submitBtn.classList.remove('bg-green-500');
        submitBtn.classList.add('bg-blue-500');
    }, 1500);
}

// Get all transactions from localStorage
function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
}

// Load transactions into the table with animations
function loadTransactions() {
    const transactions = getTransactions();
    transactionsBody.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionsBody.innerHTML = `
            <tr class="table-row">
                <td colspan="5" class="px-4 py-4 text-center text-gray-500">
                    No transactions yet
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add each transaction to the table with staggered animations
    transactions.forEach((transaction, index) => {
        setTimeout(() => {
            const row = document.createElement('tr');
            row.className = `${transaction.type}-row table-row table-row-hover slide-up`;
            row.style.animationDelay = `${index * 0.05}s`;
            row.innerHTML = `
                <td class="px-4 py-4 whitespace-nowrap">${formatDate(transaction.date)}</td>
                <td class="px-4 py-4">${transaction.description || '-'}</td>
                <td class="px-4 py-4">${transaction.category}</td>
                <td class="px-4 py-4 font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}">
                    ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <button onclick="deleteTransaction(${transaction.id})" class="delete-btn">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </td>
            `;
            transactionsBody.appendChild(row);
        }, index * 50);
    });
}

// Delete a transaction with confirmation and animation
function deleteTransaction(id) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-sm w-full animate__animated animate__zoomIn">
            <h3 class="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p class="mb-6">Are you sure you want to delete this transaction?</p>
            <div class="flex justify-end space-x-3">
                <button id="cancel-delete" class="btn-secondary px-4 py-2">Cancel</button>
                <button id="confirm-delete" class="btn-primary bg-red-500 hover:bg-red-600 px-4 py-2">Delete</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancel-delete').addEventListener('click', () => {
        modal.classList.add('animate__animated', 'animate__zoomOut');
        setTimeout(() => modal.remove(), 300);
    });
    
    document.getElementById('confirm-delete').addEventListener('click', () => {
        const transactions = getTransactions().filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Animate deletion
        modal.querySelector('div').classList.add('animate__animated', 'animate__zoomOut');
        setTimeout(() => {
            modal.remove();
            // Refresh with animations
            init();
        }, 300);
    });
}

// Update the summary cards with animations
function updateSummary() {
    const transactions = getTransactions();
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const balance = totalIncome - totalExpense;
    
    // Animate value changes
    animateValue(totalIncomeEl, parseFloat(totalIncomeEl.textContent.replace('$', '') || 0, totalIncome, 500);
    animateValue(totalExpenseEl, parseFloat(totalExpenseEl.textContent.replace('$', '') || 0, totalExpense, 500);
    animateValue(balanceEl, parseFloat(balanceEl.textContent.replace('$', '') || 0), balance, 500);
    
    // Pulse animation if balance is negative
    if (balance < 0) {
        balanceEl.classList.add('pulse');
    } else {
        balanceEl.classList.remove('pulse');
    }
}

// Animate numeric value changes
function animateValue(element, start, end, duration) {
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = setInterval(() => {
        current += increment;
        element.textContent = `$${current.toFixed(2)}`;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

// Format date as "MMM DD, YYYY"
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Render charts with animations
function renderCharts() {
    const transactions = getTransactions();
    
    // Expense by Category Chart
    const expenseCategoriesData = {};
    categories.expense.forEach(cat => expenseCategoriesData[cat] = 0);
    
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expenseCategoriesData[t.category] += t.amount;
        });
    
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseCategoriesData),
            datasets: [{
                data: Object.values(expenseCategoriesData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1500
            }
        }
    });
    
    // Monthly Summary Chart
    const monthlyData = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Initialize monthly data structure
    for (let i = 0; i < 12; i++) {
        monthlyData[i] = { income: 0, expense: 0 };
    }
    
    // Populate with transaction data
    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === currentYear) {
            monthlyData[d.getMonth()][t.type] += t.amount;
        }
    });
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: months.map((_, i) => monthlyData[i].income),
                    backgroundColor: '#48bb78',
                    borderRadius: 4
                },
                {
                    label: 'Expense',
                    data: months.map((_, i) => monthlyData[i].expense),
                    backgroundColor: '#f56565',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Export transactions to CSV
function exportToCSV() {
    const transactions = getTransactions();
    let csv = 'Date,Description,Category,Type,Amount\n';
    
    transactions.forEach(t => {
        csv += `${t.date},"${t.description || ''}",${t.category},${t.type},${t.amount}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    
    // Animate the export button
    exportBtn.classList.add('animate__animated', 'animate__tada');
    setTimeout(() => {
        exportBtn.classList.remove('animate__animated', 'animate__tada');
    }, 1000);
    
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);
