const form = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const tbody = document.getElementById('transactions-body');
const totalIncomeSpan = document.getElementById('total-income');
const totalExpenseSpan = document.getElementById('total-expense');
const balanceSpan = document.getElementById('balance');
const exportBtn = document.getElementById('export-csv');

let transactions = [];

const categories = {
  income: ['Salary', 'Freelance', 'Investments', 'Others'],
  expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Others']
};

const updateCategoryOptions = () => {
  const selectedType = typeSelect.value;
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  if (selectedType && categories[selectedType]) {
    categories[selectedType].forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }
};

typeSelect.addEventListener('change', updateCategoryOptions);

form.addEventListener('submit', e => {
  e.preventDefault();
  const transaction = {
    id: Date.now(),
    type: typeSelect.value,
    category: categorySelect.value,
    amount: parseFloat(amountInput.value),
    date: dateInput.value,
    description: descriptionInput.value
  };
  transactions.push(transaction);
  renderTable();
  updateSummary();
  updateCharts();
  form.reset();
  categorySelect.innerHTML = '<option value="">Select Category</option>';
});

const renderTable = () => {
  tbody.innerHTML = '';
  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No transactions yet</td></tr>';
    return;
  }
  transactions.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.description}</td>
      <td>${tx.category}</td>
      <td style="color: ${tx.type === 'income' ? 'green' : 'red'};">${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}</td>
      <td><button onclick="deleteTransaction(${tx.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
};

const deleteTransaction = id => {
  transactions = transactions.filter(tx => tx.id !== id);
  renderTable();
  updateSummary();
  updateCharts();
};

const updateSummary = () => {
  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  totalIncomeSpan.textContent = `$${income.toFixed(2)}`;
  totalExpenseSpan.textContent = `$${expense.toFixed(2)}`;
  balanceSpan.textContent = `$${(income - expense).toFixed(2)}`;
};

exportBtn.addEventListener('click', () => {
  let csv = 'Date,Description,Category,Amount,Type\n';
  transactions.forEach(tx => {
    csv += `${tx.date},"${tx.description}",${tx.category},${tx.amount},${tx.type}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'transactions.csv');
  a.click();
});

// Chart rendering
let categoryChart, monthlyChart;

function updateCharts() {
  const expenseByCategory = {};
  const monthlyData = {};

  transactions.forEach(tx => {
    const month = tx.date.slice(0, 7); // yyyy-mm
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    monthlyData[month][tx.type] += tx.amount;

    if (tx.type === 'expense') {
      if (!expenseByCategory[tx.category]) expenseByCategory[tx.category] = 0;
      expenseByCategory[tx.category] += tx.amount;
    }
  });

  // Update category chart
  const ctx1 = document.getElementById('category-chart').getContext('2d');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: Object.keys(expenseByCategory),
      datasets: [{
        label: 'Expenses by Category',
        data: Object.values(expenseByCategory),
        backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#2ecc71', '#9b59b6', '#34495e', '#95a5a6']
      }]
    }
  });

  // Update monthly income vs expense chart
  const months = Object.keys(monthlyData).sort();
  const incomes = months.map(m => monthlyData[m].income);
  const expenses = months.map(m => monthlyData[m].expense);

  const ctx2 = document.getElementById('monthly-chart').getContext('2d');
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          backgroundColor: '#2ecc71'
        },
        {
          label: 'Expense',
          data: expenses,
          backgroundColor: '#e74c3c'
        }
      ]
    }
  });
}
