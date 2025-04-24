document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionsBody = document.getElementById('transactions-body');
    const totalIncomeDisplay = document.getElementById('total-income');
    const totalExpenseDisplay = document.getElementById('total-expense');
    const balanceDisplay = document.getElementById('balance');
    const categorySelect = document.getElementById('category');
    const exportCsvButton = document.getElementById('export-csv');
    const categoryChartCanvas = document.getElementById('category-chart');
    const monthlyChartCanvas = document.getElementById('monthly-chart');
    const categoryChartCtx = categoryChartCanvas.getContext('2d');
    const monthlyChartCtx = monthlyChartCanvas.getContext('2d');

    let transactions = loadTransactions();
    let expenseChart;
    let monthlyChart;

    function loadTransactions() {
        const storedTransactions = localStorage.getItem('transactions');
        return storedTransactions ? JSON.parse(storedTransactions) : [];
    }

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateSummary();
        renderTransactions();
        updateCategoryChart();
        updateMonthlyChart();
    }

    function updateCategoryOptions() {
        const incomeCategories = [...new Set(transactions.filter(t => t.type === 'income').map(t => t.category))];
        const expenseCategories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];

        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select Category</option>';

        // Add income categories
        incomeCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `Income - ${category}`;
            categorySelect.appendChild(option);
        });

        // Add expense categories
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `Expense - ${category}`;
            categorySelect.appendChild(option);
        });
    }

    function addTransaction(event) {
        event.preventDefault();

        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        if (type && category && !isNaN(amount) && date) {
            transactions.push({ id: Date.now(), type, category, amount, date, description });
            saveTransactions();
            transactionForm.reset();
            updateCategoryOptions();
        } else {
            alert('Please fill in all required fields.');
        }
    }

    function deleteTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        updateCategoryOptions();
    }

    function updateSummary() {
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else if (transaction.type === 'expense') {
                totalExpense += transaction.amount;
            }
        });

        const balance = totalIncome - totalExpense;

        totalIncomeDisplay.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpenseDisplay.textContent = `$${totalExpense.toFixed(2)}`;
        balanceDisplay.textContent = `$${balance.toFixed(2)}`;
    }

    function renderTransactions() {
        transactionsBody.innerHTML = ''; // Clear the table body

        if (transactions.length === 0) {
            const row = transactionsBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.style.textAlign = 'center';
            cell.textContent = 'No transactions yet';
            return;
        }

        transactions.forEach(transaction => {
            const row = transactionsBody.insertRow();

            const dateCell = row.insertCell();
            dateCell.textContent = transaction.date;

            const descriptionCell = row.insertCell();
            descriptionCell.textContent = transaction.description;

            const categoryCell = row.insertCell();
            categoryCell.textContent = transaction.category;

            const amountCell = row.insertCell();
            amountCell.textContent = `$${transaction.amount.toFixed(2)}`;
            amountCell.classList.add(transaction.type === 'income' ? 'income' : 'expense');

            const actionsCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));
            actionsCell.appendChild(deleteButton);
        });
    }

    function updateCategoryChart() {
        const expenseByCategory = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            });

        const labels = Object.keys(expenseByCategory);
        const data = Object.values(expenseByCategory);
        const backgroundColors = labels.map((_, index) => `hsl(${index * 50}, 70%, 60%)`);

        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(categoryChartCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category'
                    }
                }
            }
        });
    }

    function updateMonthlyChart() {
        const monthlyData = {};

        transactions.forEach(t => {
            const monthYear = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                monthlyData[monthYear].income += t.amount;
            } else if (t.type === 'expense') {
                monthlyData[monthYear].expense += t.amount;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
        const labels = sortedMonths;
        const incomeData = sortedMonths.map(month => monthlyData[month].income);
        const expenseData = sortedMonths.map(month => monthlyData[month].expense);

        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(monthlyChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expense',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Income vs Expense'
                    }
                }
            }
        });
    }

    function exportCSV() {
        if (transactions.length === 0) {
            alert('No transactions to export.');
            return;
        }

        const header = 'Date,Description,Category,Amount,Type\n';
        const rows = transactions.map(transaction => {
            return `${transaction.date},"${transaction.description.replace(/"/g, '""')}",${transaction.category},${transaction.amount},${transaction.type}`;
        }).join('\n');

        const csvData = header + rows;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    transactionForm.addEventListener('submit', addTransaction);
    exportCsvButton.addEventListener('click', exportCSV);

    updateCategoryOptions();
    updateSummary();
    renderTransactions();
    updateCategoryChart();
    updateMonthlyChart();
});
