let currentUser = null;

window.alert = function (message) {
    showAlert(message);
};

function showAlert(message) {
    const existing = document.querySelector('.custom-alert-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-200';
    overlay.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-sm w-[90%] text-center shadow-2xl border border-gray-100 transform scale-95 transition-transform duration-200">
            <div class="text-gray-800 font-semibold text-base mb-6 leading-relaxed">${message}</div>
            <button class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none w-full" id="alert-ok">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#alert-ok').onclick = () => {
        closeAlert();
    };

    setTimeout(() => {
        overlay.classList.add('show');
        overlay.classList.add('opacity-100');
        overlay.querySelector('div').classList.remove('scale-95');
        overlay.querySelector('div').classList.add('scale-100');
    }, 10);
}

function closeAlert() {
    const overlay = document.querySelector('.custom-alert-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        overlay.classList.remove('opacity-100');
        const card = overlay.querySelector('div');
        if (card) {
            card.classList.remove('scale-100');
            card.classList.add('scale-95');
        }
        setTimeout(() => overlay.remove(), 200);
    }
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const existing = document.querySelector('.custom-alert-overlay');
        if (existing) existing.remove();

        const isDelete = message.toLowerCase().includes('delete');
        const okBtnClass = isDelete 
            ? 'bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none flex-1' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none flex-1';

        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-200';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-sm w-[90%] text-center shadow-2xl border border-gray-100 transform scale-95 transition-transform duration-200">
                <div class="text-gray-800 font-semibold text-base mb-6 leading-relaxed">${message}</div>
                <div class="flex gap-3 justify-center">
                    <button class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-5 rounded-xl transition-all focus:outline-none flex-1" id="confirm-cancel">Cancel</button>
                    <button class="${okBtnClass}" id="confirm-ok">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.add('show');
            overlay.classList.add('opacity-100');
            overlay.querySelector('div').classList.remove('scale-95');
            overlay.querySelector('div').classList.add('scale-100');
        }, 10);

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEscape);
                resolve(false);
                closeAlert();
            }
        };
        document.addEventListener('keydown', handleEscape);

        overlay.querySelector('#confirm-ok').onclick = () => {
            document.removeEventListener('keydown', handleEscape);
            resolve(true);
            closeAlert();
        };
        overlay.querySelector('#confirm-cancel').onclick = () => {
            document.removeEventListener('keydown', handleEscape);
            resolve(false);
            closeAlert();
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    updateDate();

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);

        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard-layout');

        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';

        applyRolePermissions();
        refreshProfile();
        showView('dashboard');
    } else {
        window.location.href = 'login.html';
    }
});

function applyRolePermissions() {
    const isStaff = currentUser.level === 'staff';
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    navItems.forEach(item => {
        const view = item.getAttribute('onclick');
        if (isStaff && (view.includes('reports') || view.includes('settings'))) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

async function showView(viewId) {
    closeCheckoutModal();
    const contentArea = document.getElementById('content-area');
    const viewTitle = document.getElementById('view-title');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(viewId)) {
            item.classList.add('active');
        }
    });

    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1024) {
        sidebar.classList.remove('show');
    }

    const backBtn = document.getElementById('back-btn-header');
    const dashboardSubViews = ['visitors', 'visitors-active', 'visitors-out', 'revenue'];
    if (dashboardSubViews.includes(viewId)) {
        backBtn.style.display = 'flex';
    } else {
        backBtn.style.display = 'none';
    }

    switch (viewId) {
        case 'dashboard':
            viewTitle.innerText = "Dashboard";
            contentArea.innerHTML = `<div style="padding: 2rem; text-align: center;">Loading Data...</div>`;
            const dashboardHtml = await renderDashboard();
            contentArea.innerHTML = dashboardHtml;
            setTimeout(initDashboardCharts, 50);
            break;
        case 'visitors':
            viewTitle.innerText = "Visitor Logs";
            const visitorsHtml = await renderVisitorLogs('All');
            contentArea.innerHTML = visitorsHtml;
            break;
        case 'visitors-active':
            viewTitle.innerText = "Active Visitors";
            const activeHtml = await renderVisitorLogs('Active');
            contentArea.innerHTML = activeHtml;
            break;
        case 'visitors-out':
            viewTitle.innerText = "Checked Out Visitors";
            const outHtml = await renderVisitorLogs('Checked Out');
            contentArea.innerHTML = outHtml;
            break;
        case 'revenue':
            viewTitle.innerText = "Collection Fee Analytics";
            contentArea.innerHTML = renderRevenueGraph();
            await initRevenueChart();
            break;
        case 'payments':
            viewTitle.innerText = "Payments";
            const paymentsHtml = await renderPaymentLogs();
            contentArea.innerHTML = paymentsHtml;
            break;
        case 'attendance':
            viewTitle.innerText = "Staff Time";
            const attendanceHtml = await renderAttendance();
            contentArea.innerHTML = attendanceHtml;
            break;
    }
    lucide.createIcons();
}

async function renderVisitorLogs(filter = 'All') {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    if (currentUser) {
        visitors = visitors.filter(v => v.recieved_by === currentUser.username);
    }

    const uniqueResorts = [...new Set(visitors.map(v => v.resort).filter(Boolean))];

    let rows = visitors.map(v => {
        const statusClass = v.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600';
        const membersList = JSON.parse(v.members || '[]');
        const totalPeople = 1 + membersList.length;

        let companionsHtml = '';
        if (membersList.length > 0) {
            companionsHtml = `
                <div id="companions-${v.id}" class="hidden text-xs text-gray-500 mt-2 pl-3 border-l-2 border-emerald-500 animate-[fadeIn_0.2s_ease-out]">
                    <div class="font-bold text-[0.65rem] uppercase text-gray-500 mb-1 tracking-wide">Companions:</div>
                    ${membersList.map(m => `
                        <div class="mb-1 flex items-center gap-1.5">
                            <span class="text-emerald-500 text-[0.4rem]">●</span>
                            <span class="font-semibold text-gray-700">${m.name}</span>
                            <span class="text-gray-500 text-[0.7rem]">(${m.age}) — <span class="text-indigo-500">${m.visitorType || 'N/A'}</span></span>
                        </div>
                    `).join('')}
                </div>`;
        }

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                data-created-at="${v.created_at}"
                data-resort="${v.resort}"
                data-status="${v.status}">
                <td class="py-4 px-4 font-bold text-gray-500 text-xs">${v.id}</td>
                <td class="py-4 px-4">
                    <div class="font-bold ${membersList.length > 0 ? 'text-emerald-600 cursor-pointer hover:underline hover:opacity-80' : 'text-gray-800'} inline-block transition-all" 
                         ${membersList.length > 0 ? `onclick="toggleCompanions('${v.id}')"` : ''}>
                        ${v.name}
                    </div>
                    <div class="text-xs text-gray-400">Headcount: ${totalPeople}</div>
                    ${companionsHtml}
                </td>
                <td class="py-4 px-4 text-gray-700">${v.resort}</td>
                <td class="py-4 px-4 font-bold text-emerald-600">${v.total}</td>
                <td class="py-4 px-4"><span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${statusClass}">${v.status}</span></td>
                <td class="py-4 px-4 text-gray-500 text-sm">${parseSQLiteDate(v.created_at).toLocaleDateString()}</td>
                <td class="py-4 px-4 text-center">
                    <button class="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-xl transition-colors inline-flex items-center justify-center" onclick="viewVisitorDetails('${v.id}')" title="View Details">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    setTimeout(() => {
        applyVisitorFilters();
    }, 20);

    return `
        <div class="bg-white rounded-xl shadow-lg border border-slate-300 p-6 fade-in">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Visitor Logs Table</h2>
            <!-- Filters & Search Bar Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
                <!-- Search -->
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="visitor-search" placeholder="Search visitors..." oninput="applyVisitorFilters()"
                        class="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium placeholder-slate-400">
                </div>
                <!-- Status Filter -->
                <select id="visitor-status-filter" onchange="applyVisitorFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Statuses</option>
                    <option value="Active" ${filter === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Checked Out" ${filter === 'Checked Out' ? 'selected' : ''}>Checked Out</option>
                </select>
                <!-- Date Filter -->
                <select id="visitor-date-filter" onchange="applyVisitorFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Dates</option>
                    <option value="Daily">Today</option>
                    <option value="Weekly">This Week</option>
                    <option value="Monthly">This Month</option>
                </select>
                <!-- Resort Filter -->
                <select id="visitor-resort-filter" onchange="applyVisitorFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Destinations</option>
                    ${uniqueResorts.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse" id="visitor-table">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visitor</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Resort</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="7" class="py-8 text-center text-gray-400 font-medium">No records found.</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}



async function renderPaymentLogs() {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    if (currentUser) {
        visitors = visitors.filter(v => v.recieved_by === currentUser.username);
    }

    const uniqueResorts = [...new Set(visitors.map(v => v.resort).filter(Boolean))];

    let rows = visitors.map(v => {
        const pStatus = v.payment_status || 'Paid';
        const badgeColor = pStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
        const date = parseSQLiteDate(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                data-created-at="${v.created_at}"
                data-resort="${v.resort}"
                data-payment-status="${pStatus}">
                <td class="py-4 px-4 font-bold text-gray-500 text-xs">${v.id}</td>
                <td class="py-4 px-4 font-semibold text-gray-800">${v.name}</td>
                <td class="py-4 px-4 text-gray-700">${v.resort}</td>
                <td class="py-4 px-4"><span class="text-gray-500">${date}</span></td>
                <td class="py-4 px-4 font-bold text-emerald-600">${v.total}</td>
                <td class="py-4 px-4"><span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${badgeColor}">${pStatus}</span></td>
            </tr>
        `;
    }).join('');

    setTimeout(() => {
        applyPaymentFilters();
    }, 20);

    return `
        <div class="bg-white rounded-xl shadow-lg border border-slate-300 p-6 fade-in">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Payments Table</h2>
            <!-- Filters & Search Bar Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
                <!-- Search -->
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="payment-search" placeholder="Search payors..." oninput="applyPaymentFilters()"
                        class="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium placeholder-slate-400">
                </div>
                <!-- Status Filter -->
                <select id="payment-status-filter" onchange="applyPaymentFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                </select>
                <!-- Date Filter -->
                <select id="payment-date-filter" onchange="applyPaymentFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Dates</option>
                    <option value="Daily">Today</option>
                    <option value="Weekly">This Week</option>
                    <option value="Monthly">This Month</option>
                </select>
                <!-- Resort Filter -->
                <select id="payment-resort-filter" onchange="applyPaymentFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Destinations</option>
                    ${uniqueResorts.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse" id="payment-table">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payor Name</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Paid</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="6" class="py-8 text-center text-gray-400 font-medium">No records found.</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderRevenueGraph() {
    return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 fade-in">
            <h3 class="font-display font-black text-xl text-gray-800 mb-6">Collection Fee Overview (Daily Trend)</h3>
            <div class="h-[400px]">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>
    `;
}

async function initRevenueChart() {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    if (currentUser) {
        visitors = visitors.filter(v => v.recieved_by === currentUser.username);
    }

    const resortData = {};
    visitors.forEach(v => {
        const amount = v.total ? (parseFloat(v.total.replace(/[^0-9.-]/g, '')) || 0) : 0;
        resortData[v.resort] = (resortData[v.resort] || 0) + amount;
    });

    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(resortData).length > 0 ? Object.keys(resortData) : ['Calawag', 'BlueWave', 'Campolly'],
            datasets: [{
                label: 'Collection Fee by Destination (₱)',
                data: Object.values(resortData).length > 0 ? Object.values(resortData) : [0, 0, 0],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'],
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
}

async function logout() {
    const confirm = await showConfirm("Are you sure you want to logout?");
    if (!confirm) return;
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

async function refreshProfile() {
    const nameEl = document.getElementById('user-profile-name');
    const roleEl = document.getElementById('user-profile-role');
    const sidebarNameEl = document.getElementById('sidebar-profile-name');
    const sidebarRoleEl = document.getElementById('sidebar-profile-role');
    if (!currentUser) return;
    if (nameEl) nameEl.innerText = currentUser.username;
    if (roleEl) roleEl.innerText = currentUser.role || "Staff";
    if (sidebarNameEl) sidebarNameEl.innerText = currentUser.username;
    if (sidebarRoleEl) sidebarRoleEl.innerText = currentUser.role || "Staff Portal";
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

async function viewVisitorDetails(id) {
    try {
        const response = await fetch('/api/visitors');
        const visitors = await response.json();
        const v = visitors.find(v => v.id === id);
        if (!v) return;

        const membersList = JSON.parse(v.members || '[]');
        const detailsHtml = `
            <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" id="details-overlay">
                <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
                    <!-- Header -->
                    <div class="p-6 md:p-8 pb-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <h3 class="font-display font-black text-xl text-gray-800 m-0 tracking-tight">Visitor Profile</h3>
                        <span class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">Ref: ${v.id}</span>
                    </div>
                    
                    <!-- Scrollable Body -->
                    <div class="p-6 md:p-8 py-4 overflow-y-auto flex-1">
                        <div class="flex flex-col md:flex-row gap-8">
                            <!-- Left: Details -->
                            <div class="flex-1 space-y-6">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Visitor</label>
                                        <div class="font-bold text-base text-gray-800">${v.name}</div>
                                    </div>
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Age / Gender</label>
                                        <div class="font-bold text-gray-800">${v.age || 'N/A'} • ${v.gender || 'N/A'}</div>
                                    </div>
                                    <div class="sm:col-span-2">
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Address</label>
                                        <div class="font-bold text-gray-800">${v.address || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Visitor Type</label>
                                        <div class="font-bold text-gray-800">${v.visitor_type || v.visitorType || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Destination</label>
                                        <div class="font-bold text-base text-gray-800">${v.resort}</div>
                                    </div>
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Stay Duration</label>
                                        <div class="font-bold text-gray-800">${v.duration || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</label>
                                        <div class="font-black text-lg text-emerald-500">${v.total}</div>
                                    </div>
                                    <div>
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Status</label>
                                        <div class="font-bold text-gray-800">
                                            <span class="px-2.5 py-0.5 text-xs font-extrabold uppercase rounded-full ${v.payment_status === 'Paid' || v.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                                ${v.payment_status || v.paymentStatus || 'Paid'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="sm:col-span-2">
                                        <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Visit Date</label>
                                        <div class="font-bold text-gray-800">${parseSQLiteDate(v.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-2">Companions (${membersList.length})</label>
                                    <div class="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-48 overflow-y-auto">
                                        ${membersList.length > 0 ? `
                                            <table class="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr class="border-b border-gray-200 text-[0.65rem] text-gray-400 font-bold uppercase tracking-wider">
                                                        <th class="pb-2 font-semibold">Name</th>
                                                        <th class="pb-2 font-semibold text-center">Age</th>
                                                        <th class="pb-2 font-semibold text-center">Status</th>
                                                        <th class="pb-2 font-semibold text-right">Visitor Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-gray-100">
                                                    ${membersList.map(m => `
                                                        <tr class="text-gray-700">
                                                            <td class="py-2.5 font-bold text-gray-800">${m.name}</td>
                                                            <td class="py-2.5 text-center font-medium">${m.age}</td>
                                                            <td class="py-2.5 text-center font-medium"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">${m.status_display || m.status || 'Regular'}</span></td>
                                                            <td class="py-2.5 text-right font-medium text-indigo-600">${m.visitorType || m.visitor_type || 'N/A'}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        ` : '<div class="text-xs font-medium text-gray-400 text-center py-2">No companions registered.</div>'}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right: QR Code -->
                            <div class="w-full md:w-52 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 shrink-0">
                                <div class="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-4">Registration QR</div>
                                <div id="modal-qrcode" class="p-3 bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/50 flex items-center justify-center mb-3"></div>
                                <div class="font-mono text-xs font-extrabold text-gray-600 tracking-wider">${v.id}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer / Actions -->
                    <div class="p-6 md:p-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-end gap-4 shrink-0">
                        <div class="w-full sm:flex-1">
                            <label class="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center sm:text-left">Update Visit Status</label>
                            <div class="flex gap-2">
                                <button onclick="updateVisitorStatus('${v.id}', 'Active')" 
                                    class="flex-1 py-2.5 px-2 rounded-xl font-black text-[0.7rem] uppercase tracking-wider transition-all duration-200 border-2 ${v.status === 'Active' ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:text-gray-600'}">
                                    Active
                                </button>
                                <button onclick="updateVisitorStatus('${v.id}', 'Checked Out')" 
                                    class="flex-1 py-2.5 px-2 rounded-xl font-black text-[0.7rem] uppercase tracking-wider transition-all duration-200 border-2 ${v.status === 'Checked Out' ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:text-gray-600'}">
                                    Checked Out
                                </button>
                            </div>
                        </div>
                        <button class="w-full sm:w-auto sm:px-8 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors shrink-0" onclick="document.getElementById('details-overlay').remove()">
                            Close Profile
                        </button>
                    </div>
                </div>
            </div>
        `;
        const existing = document.getElementById('details-overlay');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', detailsHtml);

        // Generate the QR Code dynamically in the modal
        const qrContainer = document.getElementById('modal-qrcode');
        if (qrContainer) {
            new QRCode(qrContainer, {
                text: v.id,
                width: 120,
                height: 120,
                colorDark: "#064e3b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        if (window.lucide) lucide.createIcons();
    } catch (err) {
        alert('Failed to load visitor details.');
    }
}

async function updateVisitorStatus(id, newStatus) {
    try {
        const response = await fetch('/api/visitors/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update status');
        const overlay = document.getElementById('details-overlay');
        if (overlay) overlay.remove();
        const activeNav = document.querySelector('.nav-item.active');
        const currentViewId = activeNav ? activeNav.getAttribute('onclick').match(/'([^']+)'/)[1] : 'visitors';
        showView(currentViewId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function toggleCompanions(id) {
    const el = document.getElementById(`companions-${id}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

let attendanceTimer = null;

async function renderAttendance() {
    const statusRes = await fetch(`/api/attendance/status/${currentUser.id}`);
    const currentStatus = await statusRes.json();
    const logsRes = await fetch(`/api/attendance/logs?userId=${currentUser.id}`);
    const logs = await logsRes.json();

    if (attendanceTimer) clearInterval(attendanceTimer);
    const isTimedIn = currentStatus.status === 'IN' || currentStatus.status === 'BREAK';
    const isOnBreak = currentStatus.status === 'BREAK';
    const statusColor = currentStatus.status === 'IN' ? '#10b981' : (currentStatus.status === 'BREAK' ? '#f59e0b' : '#ef4444');
    const statusText = currentStatus.status === 'IN' ? 'Time In (On Duty)' : (currentStatus.status === 'BREAK' ? 'On Break' : 'Time Out');

    let logRows = logs.map(log => {
        const date = parseSQLiteDate(log.time_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeIn = parseSQLiteDate(log.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeOut = log.time_out ? parseSQLiteDate(log.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '<span class="text-red-500 font-black animate-pulse">ON DUTY</span>';

        let dutyStatus = '';
        if (log.status === 'IN') {
            dutyStatus = '<span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800">Active</span>';
        } else if (log.status === 'BREAK') {
            dutyStatus = '<span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-800">On Break</span>';
        } else {
            dutyStatus = '<span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full bg-slate-100 text-slate-600">Timed Out</span>';
        }

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                data-time-in="${log.time_in}"
                data-status="${log.status}">
                <td class="py-4 px-4 font-bold text-gray-500 text-xs">${date}</td>
                <td class="py-4 px-4 font-bold text-emerald-500">${timeIn}</td>
                <td class="py-4 px-4 font-semibold text-gray-800">${timeOut}</td>
                <td class="py-4 px-4">${dutyStatus}</td>
                <td class="py-4 px-4 text-sm text-gray-500 max-w-xs truncate">${log.remarks || '<em class="text-gray-300">No remarks</em>'}</td>
                <td class="py-4 px-4 text-center no-print">
                    <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center" onclick="deleteAttendanceLog('${log.id}')" title="Delete Record">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    setTimeout(() => {
        applyAttendanceFilters();
    }, 20);

    const html = `
        <div class="fade-in">
            <div class="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden mb-10">
                <div class="p-6 md:px-10 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full animate-pulse" style="background: ${statusColor};"></div>
                        <span class="font-bold text-gray-600 text-sm uppercase tracking-wide">Current: ${statusText}</span>
                    </div>
                    <div id="live-timer" class="font-display font-black text-2xl text-gray-800 tracking-tight">00:00:00</div>
                </div>
                <div class="p-6 md:p-10">
                    <div class="grid grid-cols-1 ${isTimedIn ? 'md:grid-cols-2' : ''} gap-4 mb-6">
                        ${!isTimedIn ? `
                            <button class="bg-primary hover:bg-primary-dark text-white p-4 rounded-lg font-black text-lg transition-colors shadow-sm" onclick="timeIn()">Time In</button>
                        ` : `
                            <button class="text-white p-4 rounded-lg font-black text-lg transition-colors shadow-sm" style="background: ${isOnBreak ? '#10b981' : '#f59e0b'};" onclick="toggleBreak()">${isOnBreak ? 'Resume' : 'Break'}</button>
                            <button class="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-black text-lg transition-colors shadow-sm" onclick="timeOut()">Time Out</button>
                        `}
                    </div>
                    <textarea id="attendance-remarks" placeholder="Add notes..." class="w-full p-4 border border-gray-200 rounded-lg min-h-[100px] text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-gray-50"></textarea>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-lg border border-slate-300 p-6 md:p-8 fade-in">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Staff Time Logs Table</h2>
                <!-- Actions Row (HIDDEN ON PRINT) -->
                <div class="flex justify-end gap-3 mb-6 no-print">
                    <button onclick="window.print()" class="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all text-xs uppercase tracking-wider">
                        <i data-lucide="printer" class="w-4 h-4 text-slate-500"></i> Print
                    </button>
                    <button onclick="exportTableToCSV('attendance-table', 'attendance_logs.csv')" class="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all text-xs uppercase tracking-wider">
                        <i data-lucide="download" class="w-4 h-4 text-slate-500"></i> Export
                    </button>
                </div>

                <!-- Filters & Search Bar Row -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
                    <!-- Search -->
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                        <input type="text" id="attendance-search" placeholder="Search logs..." oninput="applyAttendanceFilters()"
                            class="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium placeholder-slate-400">
                    </div>
                    <!-- Status Filter -->
                    <select id="attendance-status-filter" onchange="applyAttendanceFilters()"
                        class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                        <option value="All">All Statuses</option>
                        <option value="IN">Active (On Duty)</option>
                        <option value="BREAK">On Break</option>
                        <option value="OUT">Timed Out</option>
                    </select>
                    <!-- Date Filter -->
                    <select id="attendance-date-filter" onchange="applyAttendanceFilters()"
                        class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                        <option value="All">All Dates</option>
                        <option value="Daily">Today</option>
                        <option value="Weekly">This Week</option>
                        <option value="Monthly">This Month</option>
                    </select>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse" id="attendance-table">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shift Start</th>
                                <th class="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shift End</th>
                                <th class="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                                <th class="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${logRows || '<tr><td colspan="6" class="py-12 text-center text-gray-400 font-medium">No logs found.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    if (isTimedIn) {
        setTimeout(() => startLiveTimer(currentStatus.time_in, currentStatus.total_break_time || 0, currentStatus.break_start, isOnBreak), 100);
    }
    return html;
}

function parseSQLiteDate(sqliteDate) {
    if (!sqliteDate) return null;
    if (typeof sqliteDate !== 'string') return new Date(sqliteDate);
    if (sqliteDate.includes('T') || sqliteDate.includes('Z')) {
        return new Date(sqliteDate);
    }
    const isoStr = sqliteDate.replace(' ', 'T') + 'Z';
    const date = new Date(isoStr);
    return isNaN(date.getTime()) ? null : date;
}

function startLiveTimer(startTime, totalBreakTime, breakStart, isOnBreak) {
    const timerEl = document.getElementById('live-timer');
    if (!timerEl) return;
    const startDate = parseSQLiteDate(startTime);
    if (!startDate) return;
    const start = startDate.getTime();
    const breakTotalMs = (parseInt(totalBreakTime) || 0) * 1000;

    attendanceTimer = setInterval(() => {
        const now = new Date().getTime();
        let elapsed = (now - start) - breakTotalMs;
        if (isOnBreak && breakStart) {
            const bStart = parseSQLiteDate(breakStart);
            if (bStart) elapsed = (bStart.getTime() - start) - breakTotalMs;
        }
        if (elapsed < 0) elapsed = 0;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        timerEl.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

async function timeIn() {
    const remarks = document.getElementById('attendance-remarks').value;
    const response = await fetch('/api/attendance/timein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, username: currentUser.username, remarks })
    });
    if (response.ok) showView('attendance');
}

async function timeOut() {
    const remarks = document.getElementById('attendance-remarks').value;
    if (!confirm("Time out?")) return;
    const response = await fetch('/api/attendance/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, remarks })
    });
    if (response.ok) showView('attendance');
}

async function toggleBreak() {
    const response = await fetch('/api/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
    });
    if (response.ok) showView('attendance');
}

function filterTableRows(query, tableId) {
    const lowerQuery = query.toLowerCase().trim();
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
}

// --- QUICK CHECKOUT SCANNER & MANUAL INTERFACE ---
let checkoutScanner = null;

function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    const modalContainer = modal.querySelector('.transform');
    if (modalContainer) {
        modalContainer.classList.remove('scale-95');
        modalContainer.classList.add('scale-100');
    }
    initCheckoutView();
    if (window.lucide) lucide.createIcons();
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    const modalContainer = modal.querySelector('.transform');
    if (modalContainer) {
        modalContainer.classList.remove('scale-100');
        modalContainer.classList.add('scale-95');
    }
    stopCheckoutScanner();
}

function initCheckoutView() {
    if (window.lucide) lucide.createIcons();
    stopCheckoutScanner();
}

function startCheckoutScanner() {
    const readerEl = document.getElementById('checkout-reader');
    if (!readerEl) return;

    const placeholderEl = document.getElementById('scanner-placeholder');
    if (placeholderEl) placeholderEl.style.display = 'none';

    const activeGuideEl = document.getElementById('scanner-active-guide');
    if (activeGuideEl) activeGuideEl.classList.remove('hidden');

    const startBtn = document.getElementById('btn-start-scanner');
    const stopBtn = document.getElementById('btn-stop-scanner');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    checkoutScanner = new Html5Qrcode("checkout-reader");
    const config = { fps: 15 };
    
    const successCallback = (decodedText) => {
        performCheckout(decodedText);
        stopCheckoutScanner();
    };

    checkoutScanner.start({ facingMode: "environment" }, config, successCallback)
        .catch(err => {
            console.warn("Environment camera failed, trying user camera...", err);
            checkoutScanner.start({ facingMode: "user" }, config, successCallback)
                .catch(err2 => {
                    console.error("Camera start failure:", err2);
                    showCheckoutResult('error', 'Camera access denied or device has no camera.');
                    stopCheckoutScanner();
                });
        });
}

function stopCheckoutScanner() {
    const startBtn = document.getElementById('btn-start-scanner');
    const stopBtn = document.getElementById('btn-stop-scanner');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';

    const placeholderEl = document.getElementById('scanner-placeholder');
    if (placeholderEl) placeholderEl.style.display = 'flex';

    const activeGuideEl = document.getElementById('scanner-active-guide');
    if (activeGuideEl) activeGuideEl.classList.add('hidden');

    if (checkoutScanner && checkoutScanner.isScanning) {
        checkoutScanner.stop().then(() => {
            checkoutScanner.clear();
        }).catch(err => console.error("Failed to stop scanner:", err));
    }
}

function processManualCheckout() {
    const inputEl = document.getElementById('manual-checkout-id');
    if (!inputEl) return;
    const rawId = inputEl.value.trim().toUpperCase();
    if (!rawId) return;

    performCheckout(rawId);
    inputEl.value = '';
}

async function performCheckout(id) {
    showCheckoutResult('pending', `Checking out ID ${id}...`);
    
    const triggerToast = (msg, type) => {
        if (typeof showToast === 'function') {
            showToast(msg, type);
        } else {
            console.log(`[Toast] ${type}: ${msg}`);
        }
    };

    if (!navigator.onLine) {
        queueOfflineCheckout(id, triggerToast);
        return;
    }

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        if (response.ok) {
            showCheckoutResult('success', `Successfully checked out: <strong>${id}</strong>`);
            triggerToast('Visitor checked out successfully!', 'success');
        } else if (response.status === 404) {
            showCheckoutResult('warning', `Visitor <strong>${id}</strong> not found or already checked out.`);
        } else {
            const err = await response.json();
            showCheckoutResult('error', `Failed to checkout: ${err.error || 'Server error'}`);
        }
    } catch (err) {
        console.error("Network checkout error:", err);
        queueOfflineCheckout(id, triggerToast);
    }
}

function queueOfflineCheckout(id, triggerToast) {
    let checkouts = JSON.parse(localStorage.getItem('offline_checkout_queue') || '[]');
    if (!checkouts.includes(id)) {
        checkouts.push(id);
        localStorage.setItem('offline_checkout_queue', JSON.stringify(checkouts));
    }
    showCheckoutResult('offline', `Offline. Queued checkout locally for ID: <strong>${id}</strong>`);
    triggerToast('Offline. Checkout queued locally.', 'warning');
}

function showCheckoutResult(type, message) {
    const container = document.getElementById('checkout-result-container');
    if (!container) return;

    let content = '';
    if (type === 'pending') {
        content = `
            <div class="text-indigo-500 animate-pulse flex flex-col items-center">
                <i data-lucide="loader" class="w-12 h-12 animate-spin mb-3"></i>
                <p class="text-xs font-bold">${message}</p>
            </div>
        `;
    } else if (type === 'success') {
        content = `
            <div class="text-emerald-600 animate-[fadeIn_0.3s_ease-out] flex flex-col items-center">
                <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100 shadow-sm">
                    <i data-lucide="check" class="w-6 h-6 text-emerald-600"></i>
                </div>
                <h4 class="font-display font-black text-sm uppercase tracking-wider mb-1">Checkout Success</h4>
                <p class="text-xs text-gray-500">${message}</p>
            </div>
        `;
    } else if (type === 'warning') {
        content = `
            <div class="text-amber-600 animate-[fadeIn_0.3s_ease-out] flex flex-col items-center">
                <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 border border-amber-100 shadow-sm">
                    <i data-lucide="alert-triangle" class="w-6 h-6 text-amber-600"></i>
                </div>
                <h4 class="font-display font-black text-sm uppercase tracking-wider mb-1">Status Conflict</h4>
                <p class="text-xs text-gray-500">${message}</p>
            </div>
        `;
    } else if (type === 'offline') {
        content = `
            <div class="text-indigo-600 animate-[fadeIn_0.3s_ease-out] flex flex-col items-center">
                <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 border border-indigo-100 shadow-sm">
                    <i data-lucide="wifi-off" class="w-6 h-6 text-indigo-600"></i>
                </div>
                <h4 class="font-display font-black text-sm uppercase tracking-wider mb-1">Saved Locally</h4>
                <p class="text-xs text-gray-500">${message}</p>
            </div>
        `;
    } else {
        content = `
            <div class="text-rose-600 animate-[fadeIn_0.3s_ease-out] flex flex-col items-center">
                <div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-3 border border-rose-100 shadow-sm">
                    <i data-lucide="x" class="w-6 h-6 text-rose-600"></i>
                </div>
                <h4 class="font-display font-black text-sm uppercase tracking-wider mb-1">Checkout Failed</h4>
                <p class="text-xs text-gray-500">${message}</p>
            </div>
        `;
    }

    container.innerHTML = content;
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
}


function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => {
            let text = th.innerText.replace(/[\n\t]/g, ' ').trim();
            if (text.toLowerCase() === 'actions') return null;
            return `"${text.replace(/"/g, '""')}"`;
        }).filter(h => h !== null);
    csv.push(headers.join(','));

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (row.style.display !== 'none') {
            const cols = Array.from(row.querySelectorAll('td'))
                .map((td, index) => {
                    const headerText = table.querySelectorAll('thead th')[index]?.innerText || '';
                    if (headerText.toLowerCase() === 'actions') return null;
                    
                    let text = td.innerText.replace(/[\n\t]/g, ' ').trim();
                    text = text.replace(/\s+/g, ' ');
                    return `"${text.replace(/"/g, '""')}"`;
                }).filter(c => c !== null);
            csv.push(cols.join(','));
        }
    });

    const csvContent = csv.join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename || "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
window.exportTableToCSV = exportTableToCSV;

function applyVisitorFilters() {
    const searchVal = document.getElementById('visitor-search')?.value.toLowerCase().trim() || '';
    const dateVal = document.getElementById('visitor-date-filter')?.value || 'All';
    const resortVal = document.getElementById('visitor-resort-filter')?.value || 'All';
    const statusVal = document.getElementById('visitor-status-filter')?.value || 'All';

    const table = document.getElementById('visitor-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    rows.forEach(row => {
        const createdAtStr = row.getAttribute('data-created-at');
        const resort = row.getAttribute('data-resort');
        const status = row.getAttribute('data-status');
        const text = row.innerText.toLowerCase();

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesStatus = statusVal === 'All' || status === statusVal;
        const matchesResort = resortVal === 'All' || resort === resortVal;

        let matchesDate = true;
        if (createdAtStr && dateVal !== 'All') {
            const date = parseSQLiteDate(createdAtStr);
            if (dateVal === 'Daily') {
                matchesDate = date >= today;
            } else if (dateVal === 'Weekly') {
                matchesDate = date >= lastWeek;
            } else if (dateVal === 'Monthly') {
                matchesDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
        }

        if (matchesSearch && matchesStatus && matchesResort && matchesDate) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
window.applyVisitorFilters = applyVisitorFilters;

function applyPaymentFilters() {
    const searchVal = document.getElementById('payment-search')?.value.toLowerCase().trim() || '';
    const dateVal = document.getElementById('payment-date-filter')?.value || 'All';
    const resortVal = document.getElementById('payment-resort-filter')?.value || 'All';
    const statusVal = document.getElementById('payment-status-filter')?.value || 'All';

    const table = document.getElementById('payment-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    rows.forEach(row => {
        const createdAtStr = row.getAttribute('data-created-at');
        const resort = row.getAttribute('data-resort');
        const status = row.getAttribute('data-payment-status');
        const text = row.innerText.toLowerCase();

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesStatus = statusVal === 'All' || status === statusVal;
        const matchesResort = resortVal === 'All' || resort === resortVal;

        let matchesDate = true;
        if (createdAtStr && dateVal !== 'All') {
            const date = parseSQLiteDate(createdAtStr);
            if (dateVal === 'Daily') {
                matchesDate = date >= today;
            } else if (dateVal === 'Weekly') {
                matchesDate = date >= lastWeek;
            } else if (dateVal === 'Monthly') {
                matchesDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
        }

        if (matchesSearch && matchesStatus && matchesResort && matchesDate) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
window.applyPaymentFilters = applyPaymentFilters;

function applyAttendanceFilters() {
    const searchVal = document.getElementById('attendance-search')?.value.toLowerCase().trim() || '';
    const dateVal = document.getElementById('attendance-date-filter')?.value || 'All';
    const statusVal = document.getElementById('attendance-status-filter')?.value || 'All';

    const table = document.getElementById('attendance-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    rows.forEach(row => {
        const timeInStr = row.getAttribute('data-time-in');
        const status = row.getAttribute('data-status');
        const text = row.innerText.toLowerCase();

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesStatus = statusVal === 'All' || status === statusVal;

        let matchesDate = true;
        if (timeInStr && dateVal !== 'All') {
            const date = parseSQLiteDate(timeInStr);
            if (dateVal === 'Daily') {
                matchesDate = date >= today;
            } else if (dateVal === 'Weekly') {
                matchesDate = date >= lastWeek;
            } else if (dateVal === 'Monthly') {
                matchesDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
        }

        if (matchesSearch && matchesStatus && matchesDate) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
window.applyAttendanceFilters = applyAttendanceFilters;

async function deleteAttendanceLog(id) {
    if (!(await showConfirm(`Are you sure you want to delete this attendance record? This action cannot be undone.`))) return;

    try {
        const response = await fetch(`/api/attendance/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Record deleted successfully.");
            showView('attendance');
        } else {
            const err = await response.json();
            alert("Deletion failed: " + (err.error || "Unknown error."));
        }
    } catch (err) {
        alert("Network failure.");
    }
}
window.deleteAttendanceLog = deleteAttendanceLog;

