/* ========== GREEN SENSE — script.js ========== */

/* Mobile menu */
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.style.display === 'block';
    mobileMenu.style.display = open ? 'none' : 'block';
    menuToggle.setAttribute('aria-expanded', (!open).toString());
    mobileMenu.setAttribute('aria-hidden', open ? 'true' : 'false');
  });
}

/* --- Transaction data model (in-memory) --- */
let transactions = [
  { date: todayOffset(0), type: 'sale', crop: 'Tomato', amount: 1200.00 },
  { date: todayOffset(-1), type: 'purchase', crop: 'Fertilizer', amount: 450.00 },
  { date: todayOffset(-2), type: 'sale', crop: 'Basil', amount: 600.00 },
];

function todayOffset(offsetDays){
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0,10);
}

/* DOM refs */
const txForm = document.getElementById('txForm');
const txTableBody = document.querySelector('#txTable tbody');
const totalProfitEl = document.getElementById('totalProfit');
const totalExpenseEl = document.getElementById('totalExpense');
const topCropEl = document.getElementById('topCrop');

let profitChart = null;
let trendChart = null;

/* Init */
renderTransactions();
initCharts();
updateAllMetrics();

txForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const type = document.getElementById('txType').value;
  const crop = document.getElementById('txCrop').value.trim() || 'Unknown';
  const amount = parseFloat(document.getElementById('txAmount').value) || 0;
  const date = document.getElementById('txDate').value || todayOffset(0);

  const tx = {date, type, crop, amount};
  transactions.unshift(tx);
  renderTransactions();
  updateAllMetrics();
  txForm.reset();
});

document.getElementById('clearAll')?.addEventListener('click', () => {
  if(!confirm('Clear all sample transactions?')) return;
  transactions = [];
  renderTransactions();
  updateAllMetrics();
});

function renderTransactions(){
  if(!txTableBody) return;
  txTableBody.innerHTML = '';
  if(transactions.length === 0){
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4" style="color:#777">No transactions yet.</td>';
    txTableBody.appendChild(tr);
    return;
  }
  for(const tx of transactions.slice(0,50)){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${tx.date}</td><td>${capitalize(tx.type)}</td><td>${escapeHtml(tx.crop)}</td><td>₱${tx.amount.toFixed(2)}</td>`;
    txTableBody.appendChild(tr);
  }
}

function updateAllMetrics(){
  let totalSales = 0, totalExpenses = 0;
  const profitByCrop = {};
  for(const tx of transactions){
    if(tx.type === 'sale') totalSales += tx.amount;
    else totalExpenses += tx.amount;
    const sign = tx.type === 'sale' ? 1 : -1;
    profitByCrop[tx.crop] = (profitByCrop[tx.crop] || 0) + sign*tx.amount;
  }
  const profit = totalSales - totalExpenses;
  if(totalProfitEl) totalProfitEl.textContent = `₱${profit.toFixed(2)}`;
  if(totalExpenseEl) totalExpenseEl.textContent = `₱${totalExpenses.toFixed(2)}`;
  const sortedCrops = Object.entries(profitByCrop).sort((a,b)=> b[1]-a[1]);
  if(topCropEl) topCropEl.textContent = sortedCrops.length ? `${sortedCrops[0][0]} (₱${sortedCrops[0][1].toFixed(2)})` : '—';
  updateProfitChart(profitByCrop);
  updateTrendChart();
}

/* Chart.js initialization */
function initCharts(){
  const profitCtx = document.getElementById('profitChart')?.getContext('2d');
  const trendCtx = document.getElementById('trendChart')?.getContext('2d');
  if(profitCtx){
    profitChart = new Chart(profitCtx, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Profit', data: [], backgroundColor: '#8BC34A' }] },
      options: { responsive:true, maintainAspectRatio:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } }
    });
  }
  if(trendCtx){
    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: { labels: [], datasets: [
        { label: 'Sales', data: [], borderColor:'#2E7D32', tension:0.3, fill:false },
        { label: 'Expenses', data: [], borderColor:'#D84315', tension:0.3, fill:false }
      ] },
      options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{position:'bottom'} }, scales:{ y:{ beginAtZero:true } } }
    });
  }
  updateAllMetrics();
}

function updateProfitChart(profitByCrop){
  if(!profitChart) return;
  const labels = Object.keys(profitByCrop);
  const data = labels.map(k => parseFloat(profitByCrop[k].toFixed(2)));
  profitChart.data.labels = labels;
  profitChart.data.datasets[0].data = data;
  profitChart.update();
}

function updateTrendChart(){
  if(!trendChart) return;
  const days = [];
  for(let i=6;i>=0;i--) days.push(todayOffset(-i));
  const salesData = days.map(d => sumByDate(d, 'sale'));
  const expData = days.map(d => sumByDate(d, 'purchase'));
  trendChart.data.labels = days;
  trendChart.data.datasets[0].data = salesData;
  trendChart.data.datasets[1].data = expData;
  trendChart.update();
}

function sumByDate(date, type){
  return transactions.filter(t=> t.date===date && t.type===type).reduce((s,x)=> s + x.amount, 0);
}
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1) }
function escapeHtml(text){ return text ? text.replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : ''; }

/* Close mobile menu on outside clicks */
document.addEventListener('click', (e) => {
  if(menuToggle && mobileMenu && !menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
    if(mobileMenu.style.display === 'block') {
      mobileMenu.style.display = 'none';
      menuToggle.setAttribute('aria-expanded','false');
      mobileMenu.setAttribute('aria-hidden','true');
    }
  }
});

/* Smooth scroll for in-page anchors */
const inPageLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

inPageLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if(!href || href.length <= 1) return;
    const targetId = href.slice(1);
    const targetEl = document.getElementById(targetId);
    if(!targetEl) return;

    event.preventDefault();
    const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
    targetEl.scrollIntoView({ behavior, block: 'start' });
    history.replaceState(null, '', `#${targetId}`);

    if(mobileMenu && mobileMenu.style.display === 'block'){
      mobileMenu.style.display = 'none';
      menuToggle?.setAttribute('aria-expanded','false');
      mobileMenu.setAttribute('aria-hidden','true');
    }
  });
});