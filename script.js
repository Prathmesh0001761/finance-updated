const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const transactionForm = document.getElementById('transaction-form');
const transactionsBody = document.getElementById('transactions-body');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const balanceEl = document.getElementById('balance');
const exportBtn = document.getElementById('export-csv');

const categories = {
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'],
    expense: ['Food', 'Transportation', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Education', 'Shopping', 'Other Expenses']
};

let categoryChart, monthlyChart;

function init() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    document.getElementById('date').value = localDate.toISOString().split('T')[0];

    loadTransactions();
    updateSummary();
    renderCharts();

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
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value
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
        transactionsBody.innerHTML = '<tr><td colspan="5" class="text-center">No transactions yet</td></tr>';
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
    const expenseCategories = {};
    categories.expense.forEach(cat => expenseCategories[cat] = 0);

    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseCategories[t.category] += t.amount;
    });

    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A', '#607D8B']
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

    const monthlyData = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let i = 0; i < 12; i++) monthlyData[i] = { income: 0, expense: 0 };
    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === currentYear) {
            const month = d.getMonth();
            monthlyData[month][t.type] += t.amount;
        }
    });

    const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 12 }, (_, i) => new Date(currentYear, i).toLocaleString('default', { month: 'short' })),
            datasets: [
                {
                    label: 'Income',
                    data: Object.values(monthlyData).map(data => data.income),
                    backgroundColor: '#48bb78',
                },
                {
                    label: 'Expense',
                    data: Object.values(monthlyData).map(data => data.expense),
                    backgroundColor: '#f56565',
                },
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart',
            }
        }
    });
}

function exportToCSV() {
    const transactions = getTransactions();
    const csvData = [
        ['ID', 'Type', 'Category', 'Amount', 'Date', 'Description'],
        ...transactions.map(t => [
            t.id, t.type, t.category, t.amount.toFixed(2), t.date, t.description || ''
        ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    link.click();
}

init();

