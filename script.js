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
const categoryChartCanvas = document.getElementById('category-chart');
const monthlyChartCanvas = document.getElementById('monthly-chart');

const categories = {
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'],
    expense: ['Food', 'Transportation', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Education', 'Shopping', 'Other Expenses']
};

let categoryChart, monthlyChart;

function init() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    dateInput.value = localDate.toISOString().split('T')[0];

    loadTransactions();
    updateSummary();
    renderCharts();

    // Call updateCategories on initialization to populate the category dropdown
    updateCategories();

    typeSelect.addEventListener('change', updateCategories);
    transactionForm.addEventListener('submit', addTransaction);
    exportBtn.addEventListener('click', exportToCSV);
}

function updateCategories() {
    const type = typeSelect.value;
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    if (type) {
        categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

function addTransaction(e) {
    e.preventDefault();

    const transaction = {
        id: Date.now(),
        type: typeSelect.value,
        category: categorySelect.value,
        amount: parseFloat(amountInput.value),
        date: dateInput.value,
        description: descriptionInput.value
    };

    const transactions = getTransactions();
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    transactionForm.reset();
    init();
}

function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
}

function loadTransactions() {
    const transactions = getTransactions();
    transactionsBody.innerHTML = '';

    if (transactions.length === 0) {
        transactionsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions yet</td></tr>';
        return;
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = `${transaction.type}-row`;
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description || '-'}</td>
            <td>${transaction.category}</td>
            <td>${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="action-btn btn-danger" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        transactionsBody.appendChild(row);
    });
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const transactions = getTransactions().filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        init();
    }
}

function updateSummary() {
    const transactions = getTransactions();
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
    totalExpenseEl.textContent = `$${totalExpense.toFixed(2)}`;
    balanceEl.textContent = `$${balance.toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function renderCharts() {
    const transactions = getTransactions();
    const expenseCategoriesData = {};
    categories.expense.forEach(cat => expenseCategoriesData[cat] = 0);

    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseCategoriesData[t.category] += t.amount;
    });

    const categoryCtx = categoryChartCanvas ? categoryChartCanvas.getContext('2d') : null;
    if (categoryCtx) {
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
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    const monthlyData = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let i = 0; i < 12; i++) monthlyData[i] = { income: 0, expense: 0 };
    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === currentYear) {
            monthlyData[d.getMonth()][t.type] += t.amount;
        }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCtx = monthlyChartCanvas ? monthlyChartCanvas.getContext('2d') : null;
    if (monthlyCtx) {
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: months.map((_, i) => monthlyData[i].income),
                        backgroundColor: '#4cc9f0'
                    },
                    {
                        label: 'Expense',
                        data: months.map((_, i) => monthlyData[i].expense),
                        backgroundColor: '#f72585'
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
                }
            }
        });
    }
}

function exportToCSV() {
    const transactions = getTransactions();
    let csv = 'Date,Description,Category,Type,Amount\n';
    transactions.forEach(t => {
        csv += `${t.date},"${t.description}",${t.category},${t.type},${t.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
}

init();
