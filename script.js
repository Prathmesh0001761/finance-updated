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

    updateCategories();

    typeSelect.addEventListener('change', updateCategories);
    transactionForm.addEventListener('submit', addTransaction);
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

    transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.className = `${transaction.type}-row`;
        row.style.animationDelay = `${index * 50}ms`; // Apply staggered fade-in
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
    // Chart rendering code remains the same...
}

init();
