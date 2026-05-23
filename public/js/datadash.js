
function parseSQLiteDate(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    if (dateStr.includes('T') || dateStr.includes('Z')) {
        return new Date(dateStr);
    }
    let formatted = dateStr;
    if (formatted.length === 19) { // YYYY-MM-DD HH:MM:SS
        formatted = formatted.replace(' ', 'T') + 'Z';
    } else if (formatted.length === 10) { // YYYY-MM-DD
        formatted = formatted + 'T00:00:00Z';
    }
    return new Date(formatted);
}
window.parseSQLiteDate = parseSQLiteDate;

async function renderDashboard(timeFilter = 'Daily') {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    const storedUser = localStorage.getItem('currentUser');
    let currentUser = null;
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch(e) {}
    }

    if (currentUser && currentUser.level === 'staff') {
        visitors = visitors.filter(v => v.recieved_by === currentUser.username);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());


    if (timeFilter === 'Daily') {
        visitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= today);
    } else if (timeFilter === 'Weekly') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        visitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= lastWeek);
    } else if (timeFilter === 'Monthly') {
        visitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
        });
    } else if (timeFilter === 'Annually') {
        visitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getFullYear() === now.getFullYear();
        });
    }

    const activeCount = visitors.filter(v => v.status === 'Active').length;
    const checkoutCount = visitors.filter(v => v.status === 'Checked Out').length;
    let totalRevenue = 0;
    visitors.forEach(v => {
        const amount = v.total ? (parseFloat(v.total.replace(/[^0-9.-]/g, '')) || 0) : 0;
        totalRevenue += amount;
    });

    let recentTransactionsRows = visitors.slice().reverse().slice(0, 5).map(v => `
        <tr class="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0" onclick="showView('payments')">
            <td class="py-4 px-4 font-semibold text-gray-800">${v.name}</td>
            <td class="py-4 px-4"><span class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${v.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">${v.status}</span></td>
            <td class="py-4 px-4 font-bold text-emerald-600">${v.total}</td>
            <td class="py-4 px-4 text-gray-500 text-sm">${parseSQLiteDate(v.created_at).toLocaleDateString()}</td>
            <td class="py-4 px-4 text-gray-500 text-sm">${v.resort}</td>
        </tr>
    `).join('');

    return `
        <!-- Dashboard Filter UI -->
        <div class="flex justify-end mb-6">
            <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <i data-lucide="filter" class="w-4 h-4 text-gray-500"></i>
                <select onchange="refreshDashboard(this.value)" class="border-none text-sm font-bold text-gray-800 bg-transparent focus:ring-0 cursor-pointer outline-none">
                    <option value="Daily" ${timeFilter === 'Daily' ? 'selected' : ''}>Today</option>
                    <option value="Weekly" ${timeFilter === 'Weekly' ? 'selected' : ''}>This Week</option>
                    <option value="Monthly" ${timeFilter === 'Monthly' ? 'selected' : ''}>This Month</option>
                    <option value="Annually" ${timeFilter === 'Annually' ? 'selected' : ''}>This Year</option>
                    <option value="All" ${timeFilter === 'All' ? 'selected' : ''}>All Time</option>
                </select>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 fade-in">
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group" onclick="showView('revenue')">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Collection Fee</span>
                <span class="text-3xl font-black text-gray-800">₱${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <i data-lucide="trend-up" class="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 text-emerald-500 opacity-10 transition-transform group-hover:scale-110"></i>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group" onclick="showView('visitors')">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Arrivals</span>
                <span class="text-3xl font-black text-gray-800">${visitors.length.toLocaleString()}</span>
                <i data-lucide="users" class="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 text-blue-500 opacity-10 transition-transform group-hover:scale-110"></i>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group" onclick="showView('visitors-active')">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Visitors</span>
                <span class="text-3xl font-black text-gray-800">${activeCount.toLocaleString()}</span>
                <i data-lucide="user-check" class="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 text-primary opacity-10 transition-transform group-hover:scale-110"></i>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group" onclick="showView('visitors-out')">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Checked Out</span>
                <span class="text-3xl font-black text-gray-800">${checkoutCount.toLocaleString()}</span>
                <i data-lucide="log-out" class="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 text-amber-500 opacity-10 transition-transform group-hover:scale-110"></i>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 fade-in">
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col lg:col-span-2">
                <div class="flex justify-between items-center mb-6">
                    <span class="font-bold text-gray-800 text-lg">Collection Fee & Visitor Growth</span>
                    <button class="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-xl text-sm transition-colors border border-gray-200" onclick="showView('revenue')">View Full Chart</button>
                </div>
                <div class="relative h-[300px] w-full">
                    <canvas id="dashboardRevenueChart"></canvas>
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <span class="font-bold text-gray-800 text-lg">Destination Distribution</span>
                </div>
                <div class="relative h-[300px] w-full">
                    <canvas id="dashboardPieChart"></canvas>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6 fade-in">
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-display font-bold text-gray-800 uppercase tracking-wide">Recent Transactions</h3>
                <button class="bg-primary hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors" onclick="showView('payments')">View All</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-gray-100">
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentTransactionsRows || '<tr><td colspan="5" class="py-8 text-center text-gray-400">No recent transactions for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


async function initDashboardCharts(timeFilter = 'Daily') {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    const storedUser = localStorage.getItem('currentUser');
    let currentUser = null;
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch(e) {}
    }

    if (currentUser && currentUser.level === 'staff') {
        visitors = visitors.filter(v => v.recieved_by === currentUser.username);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());


    let filteredVisitors = visitors;
    if (timeFilter === 'Daily') {
        filteredVisitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= today);
    } else if (timeFilter === 'Weekly') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        filteredVisitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= lastWeek);
    } else if (timeFilter === 'Monthly') {
        filteredVisitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
        });
    } else if (timeFilter === 'Annually') {
        filteredVisitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getFullYear() === now.getFullYear();
        });
    }


    const revenueCtx = document.getElementById('dashboardRevenueChart');
    if (revenueCtx) {
        const labels = [];
        const data = [];
        const visitorGrowth = [];


        const currentDate = new Date();
        for (let i = 6; i >= 0; i--) {
            let d = new Date(currentDate);
            d.setDate(d.getDate() - i);

            let label = "";
            if (timeFilter === 'Weekly') {
                label = d.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
                label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            labels.push(label);

            const daysVisitors = visitors.filter(v => parseSQLiteDate(v.created_at).toDateString() === d.toDateString());
            visitorGrowth.push(daysVisitors.length);
            let dailyRev = 0;
            daysVisitors.forEach(v => {
                const amount = v.total ? (parseFloat(v.total.replace(/[^0-9.-]/g, '')) || 0) : 0;
                dailyRev += amount;
            });
            data.push(dailyRev);
        }

        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Collection Fee (₱)',
                        data: data,
                        borderColor: '#064e3b',
                        backgroundColor: 'rgba(6, 78, 59, 0.05)',
                        borderWidth: 2,
                        tension: 0,
                        fill: true
                    },
                    {
                        label: 'Visitors',
                        data: visitorGrowth,
                        borderColor: '#d97706',
                        borderWidth: 2,
                        tension: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#475569', font: {family: 'Montserrat'} }, position: 'top' }
                },
                scales: {
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#475569',
                            precision: 0,
                            stepSize: 1,
                            font: {family: 'Montserrat'}
                        },
                        beginAtZero: true,
                        border: { display: false }
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#475569', font: {family: 'Montserrat'} },
                        border: { display: false }
                    }
                }
            }
        });
    }


    const pieCtx = document.getElementById('dashboardPieChart');
    if (pieCtx) {
        const resortCounts = {};

        filteredVisitors.forEach(v => {
            if (!resortCounts[v.resort]) resortCounts[v.resort] = 0;
            resortCounts[v.resort]++;
        });

        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(resortCounts),
                datasets: [{
                    data: Object.values(resortCounts),
                    backgroundColor: ['#064e3b', '#d97706', '#475569', '#10b981', '#334155'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#475569', font: { size: 12, family: 'Montserrat' }, padding: 20 } }
                }
            }
        });
    }
}

async function refreshDashboard(filter) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `<div class="flex items-center justify-center h-64 text-gray-500 font-medium"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i> Refreshing Dashboard...</div>`;


    const html = await renderDashboard(filter);
    contentArea.innerHTML = html;


    if (window.lucide) lucide.createIcons();
    setTimeout(() => initDashboardCharts(filter), 50);
}
