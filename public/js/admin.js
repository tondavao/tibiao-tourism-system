let currentAdmin = null;
let editingUserId = null;
let currentSettings = null;
let editingSettingsState = { category: null, index: null };
let activeSettingsTab = 'statuses';
let currentView = 'dashboard';


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


    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentAdmin = JSON.parse(storedUser);


        if (currentAdmin.level !== 'admin') {
            alert("Unauthorized access. Admin portal only.");
            window.location.href = 'login.html';
            return;
        }


        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard-layout');

        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';

        refreshProfile();
        showView('dashboard');
    } else {
        window.location.href = 'login.html';
    }
});


async function showView(viewId) {
    currentView = viewId;
    const contentArea = document.getElementById('content-area');
    const viewTitle = document.getElementById('view-title');


    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(viewId)) {
            item.classList.add('active');
        }
    });


    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('show');
    }


    const backBtn = document.getElementById('back-btn-header');
    if (backBtn) {
        const subViews = ['visitors-active', 'visitors-out'];
        backBtn.style.display = subViews.includes(viewId) ? 'flex' : 'none';
    }


    switch (viewId) {
        case 'dashboard':
            viewTitle.innerText = "Dashboard";
            contentArea.innerHTML = await renderDashboard();
            setTimeout(initDashboardCharts, 50);
            break;
        case 'visitors':
            viewTitle.innerText = "Visitor Logs";
            contentArea.innerHTML = await renderVisitorLogs('All');
            break;
        case 'visitors-active':
            viewTitle.innerText = "Currently Active";
            contentArea.innerHTML = await renderVisitorLogs('Active');
            break;
        case 'visitors-out':
            viewTitle.innerText = "Checkout Records";
            contentArea.innerHTML = await renderVisitorLogs('Checked Out');
            break;
        case 'payments':
            viewTitle.innerText = "Payments";
            contentArea.innerHTML = await renderPaymentLogs();
            break;
        case 'reports':
            viewTitle.innerText = "Reports";
            contentArea.innerHTML = await renderReports('Daily');
            break;
        case 'revenue':
            viewTitle.innerText = "Financial Analytics";
            contentArea.innerHTML = renderRevenueGraph();
            setTimeout(initRevenueChart, 100);
            break;
        case 'accounts':
            viewTitle.innerText = "Accounts";
            contentArea.innerHTML = await renderAccountsView();
            break;
        case 'attendance':
            viewTitle.innerText = "Staff Time Log";
            contentArea.innerHTML = `<div style="padding: 2rem; text-align: center;">Retrieving Employee Logs...</div>`;
            contentArea.innerHTML = await renderAttendanceLogs();
            break;
        case 'settings':
            viewTitle.innerText = "Settings";
            contentArea.innerHTML = `<div style="padding: 2rem; text-align: center;">Loading settings...</div>`;
            await loadAndRenderSettings();
            break;
    }

    lucide.createIcons();
}




async function renderVisitorLogs(filter = 'All') {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    const uniqueResorts = [...new Set(visitors.map(v => v.resort).filter(Boolean))];

    let rows = visitors.map(v => {
        const membersList = JSON.parse(v.members || '[]');

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
                    <div class="text-xs text-gray-400">Headcount: ${1 + membersList.length}</div>
                    ${companionsHtml}
                </td>
                <td class="py-4 px-4 text-gray-700">${v.resort}</td>
                <td class="py-4 px-4"><span class="font-bold text-emerald-600">${v.total}</span></td>
                <td class="py-4 px-4"><span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${v.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">${v.status}</span></td>
                <td class="py-4 px-4 text-gray-500 text-sm">${parseSQLiteDate(v.created_at).toLocaleDateString()}</td>
                <td class="py-4 px-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button class="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-xl transition-colors inline-flex items-center justify-center" onclick="viewVisitorDetails('${v.id}')" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center" onclick="deleteVisitor('${v.id}')" title="Delete Record">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
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
                    <tbody>${rows || '<tr><td colspan="7" class="py-8 text-center text-gray-400">No records found.</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
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
                    <div class="p-6 md:p-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shrink-0">
                        <div class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 w-full sm:w-auto justify-center sm:justify-start">
                            <span class="w-2.5 h-2.5 rounded-full ${v.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                            <span class="font-black text-xs uppercase tracking-wider text-gray-700">${v.status}</span>
                        </div>
                        <button class="w-full sm:w-auto sm:px-8 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors shrink-0" onclick="document.getElementById('details-overlay').remove()">
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


async function renderReports(filter = 'Daily') {
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter === 'Daily') {
        visitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= today);
    } else if (filter === 'Weekly') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        visitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= lastWeek);
    } else if (filter === 'Monthly') {
        visitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
        });
    } else if (filter === 'Yearly') {
        visitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getFullYear() === now.getFullYear();
        });
    }

    let screenRows = '';
    let printRows = '';
    let totalRevenue = 0;
    let totalHeadcount = 0;

    const usersResponse = await fetch('/api/users');
    const allUsers = await usersResponse.json();
    const activeAdmin = allUsers.find(u => u.id === currentAdmin.id) || currentAdmin;

    visitors.forEach(v => {
        const amount = v.total ? (parseFloat(v.total.replace(/[^0-9.-]/g, '')) || 0) : 0;
        totalRevenue += amount;
        const members = JSON.parse(v.members || '[]');
        const size = 1 + members.length;
        totalHeadcount += size;

        let companionInfo = '';
        if (members.length > 0) {
            companionInfo = `
                <div class="text-[0.7rem] text-gray-500 mt-1 font-medium">
                    Companions: ${members.map(m => `${m.name} (<span class="text-indigo-500 font-bold">${m.visitorType || 'N/A'}</span>)`).join(', ')}
                </div>
            `;
        }

        screenRows += `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors align-top">
                <td class="py-4 px-4 font-bold text-gray-500 text-xs">${v.id}</td>
                <td class="py-4 px-4 font-semibold text-gray-800">
                    <div>${v.name}</div>
                    ${companionInfo}
                </td>
                <td class="py-4 px-4 text-gray-700">${v.address || 'N/A'}</td>
                <td class="py-4 px-4 text-gray-700">${v.resort}</td>
                <td class="py-4 px-4 text-center text-gray-800 font-semibold">${size}</td>
                <td class="py-4 px-4 text-right text-black font-bold">${v.total}</td>
                <td class="py-4 px-4 text-gray-500 text-sm">${parseSQLiteDate(v.created_at).toLocaleDateString()}</td>
            </tr>
        `;

        printRows += `
            <tr class="border-b border-gray-200 align-top">
                <td class="py-3 px-4 text-left text-gray-500 font-bold text-xs">${v.id}</td>
                <td class="py-3 px-4 text-left text-gray-800 font-bold">
                    <div>${v.name}</div>
                    ${companionInfo}
                </td>
                <td class="py-3 px-4 text-left text-gray-700">${v.address || 'N/A'}</td>
                <td class="py-3 px-4 text-left text-gray-600">${v.resort}</td>
                <td class="py-3 px-4 text-center text-gray-800 font-semibold">${size}</td>
                <td class="py-3 px-4 text-right text-black font-black">${v.total}</td>
                <td class="py-3 px-4 text-left text-gray-500 text-sm">${parseSQLiteDate(v.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });

    setTimeout(() => {
        applyReportFilters();
    }, 20);

    return `
        <!-- SCREEN VIEW (HIDDEN ON PRINT) -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-300 p-6 fade-in no-print">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Operations Reports Table</h2>
            
            <!-- Executive Summary Cards (Screen View Only) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div class="bg-gray-50 p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Total Arrivals</div>
                    <div class="text-3xl font-black text-gray-800">${visitors.length}</div>
                </div>
                <div class="bg-gray-50 p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Total Headcount</div>
                    <div class="text-3xl font-black text-blue-500">${totalHeadcount}</div>
                </div>
                <div class="bg-gray-50 p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                    <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Gross Collection Fee</div>
                    <div class="text-3xl font-black text-emerald-500">₱${totalRevenue.toLocaleString()}</div>
                </div>
            </div>
            
            <!-- Filters & Actions Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <!-- Search -->
                <div class="relative col-span-1 md:col-span-2">
                    <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="report-search" placeholder="Search report registry..." oninput="applyReportFilters()"
                        class="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium placeholder-slate-400">
                </div>
                <!-- Period Filter -->
                <div class="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                    <i data-lucide="filter" class="w-4 h-4 text-gray-500"></i>
                    <select onchange="refreshReport(this.value)" class="border-none text-sm font-bold text-gray-800 bg-transparent focus:ring-0 cursor-pointer outline-none w-full">
                        <option value="Daily" ${filter === 'Daily' ? 'selected' : ''}>Today</option>
                        <option value="Weekly" ${filter === 'Weekly' ? 'selected' : ''}>This Week</option>
                        <option value="Monthly" ${filter === 'Monthly' ? 'selected' : ''}>This Month</option>
                        <option value="Yearly" ${filter === 'Yearly' ? 'selected' : ''}>This Year</option>
                        <option value="All" ${filter === 'All' ? 'selected' : ''}>All Time</option>
                    </select>
                </div>
                <!-- Actions -->
                <div class="flex gap-2">
                    <button onclick="window.print()" class="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all text-xs uppercase tracking-wider">
                        <i data-lucide="printer" class="w-4 h-4 text-slate-500"></i> Print
                    </button>
                    <button onclick="window.exportToCSV('${filter}')" class="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all text-xs uppercase tracking-wider">
                        <i data-lucide="download" class="w-4 h-4 text-slate-500"></i> Export
                    </button>
                </div>
            </div>

            <!-- Screen Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse" id="report-table">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reg ID</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Visitor</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Headcount</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Amount</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Recorded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${screenRows || '<tr><td colspan="7" class="py-12 text-center text-gray-400 font-semibold">No operational data recorded for this selection.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- PRINTABLE VIEW (HIDDEN ON SCREEN, VISIBLE ON PRINT) -->
        <div class="hidden print:block printable-area">
            <!-- Centered Header with Logos close to Title -->
            <div class="flex items-center justify-center gap-6 mb-8 border-b-2 border-gray-800 pb-6 relative">
                <!-- Left Logo -->
                <div class="flex-shrink-0 animate-fade-in">
                    <img src="../images/Tibiao OS LOGO.png" class="h-20 object-contain" alt="Tibiao OS Logo">
                </div>
                
                <!-- Center Title -->
                <div class="text-center leading-tight">
                    <div class="text-xs uppercase font-bold text-gray-600">Republic of the Philippines</div>
                    <div class="text-xs uppercase font-bold text-gray-600">Municipality of Tibiao</div>
                    <div class="text-sm uppercase font-extrabold text-gray-800 tracking-wider">Municipal Tourism Office</div>
                    <div class="text-xs text-gray-600 font-medium">Tibiao, Antique</div>
                    
                    <h2 class="text-lg font-black uppercase text-emerald-700 mt-4 tracking-wide">${filter === 'Daily' ? 'Daily' : (filter === 'Weekly' ? 'Weekly' : (filter === 'Monthly' ? 'Monthly' : (filter === 'Yearly' ? 'Yearly' : 'All Time')))} Operations Report</h2>
                    ${filter === 'Monthly' ? `<div class="text-xs font-bold text-gray-600 mt-1">For the month of ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>` : ''}
                </div>
                
                <!-- Right Logos -->
                <div class="flex items-center gap-4 flex-shrink-0">
                    <img src="../images/logo.png" class="h-20 object-contain" alt="Logo">
                    <img src="../images/Bagong_Pilipinas_logo.png" class="h-20 object-contain" alt="Bagong Pilipinas Logo">
                </div>
                
                <!-- Date on the right side just above the line -->
                <div class="absolute right-0 bottom-1 text-xs text-gray-700 font-bold">Date: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>

            <!-- Detailed Data Table -->
            <div class="mb-12">
                <h4 class="font-display font-bold text-lg text-gray-800 mb-5">Detailed Entry Logs</h4>
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b-2 border-gray-200">
                                <th class="py-4 px-4 text-left text-gray-500 font-bold text-xs uppercase tracking-wider rounded-tl-xl">Reg ID</th>
                                <th class="py-4 px-4 text-left text-gray-500 font-bold text-xs uppercase tracking-wider">Primary Visitor</th>
                                <th class="py-4 px-4 text-left text-gray-500 font-bold text-xs uppercase tracking-wider">Address</th>
                                <th class="py-4 px-4 text-left text-gray-500 font-bold text-xs uppercase tracking-wider">Destination</th>
                                <th class="py-4 px-4 text-center text-gray-500 font-bold text-xs uppercase tracking-wider">Quantity</th>
                                <th class="py-4 px-4 text-right text-gray-500 font-bold text-xs uppercase tracking-wider">Total Amount</th>
                                <th class="py-4 px-4 text-left text-gray-500 font-bold text-xs uppercase tracking-wider rounded-tr-xl">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${printRows || '<tr><td colspan="7" class="py-12 text-center text-gray-400 font-semibold">No operational data recorded for this selection.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Report Footer (VISIBLE ON PRINT) -->
            <div class="hidden print:flex justify-between items-end pt-8 mt-20">
                <div class="text-left">
                    <div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Authenticated By:</div>
                    <div class="text-xl font-black text-gray-800 m-0">
                        ${activeAdmin.username}
                    </div>
                    <div class="text-xs text-gray-500 mt-1 font-medium">${activeAdmin.role} • Tibiao Tourism Office</div>
                </div>
                <div class="text-right text-xs text-gray-400 max-w-xs leading-relaxed">
                    This document is a system-generated official record 
                    issued by the Tibiao Municipal Tourism Office.
                </div>
            </div>
        </div>

        <style>
            @media print {
                @page {
                    size: landscape;
                    margin: 0.5in;
                }
                html, body, .dashboard-container, .main-content, #content-area, .report-wrapper {
                    height: auto !important;
                    overflow: visible !important;
                    display: block !important;
                }

                .printable-area { border: none !important; box-shadow: none !important; padding: 0 !important; display: block !important; }
                
                thead { display: table-header-group; }
                tr { page-break-inside: avoid; }
                .executive-summary { page-break-inside: avoid; margin-top: 20px; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 20px !important; }
                
                table { border-collapse: collapse; width: 100%; table-layout: auto; }
            }
        </style>
    `;
}

async function refreshReport(filter) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `<div style="padding: 2rem; text-align: center;">Refreshing...</div>`;
    contentArea.innerHTML = await renderReports(filter);
    lucide.createIcons();
}

window.exportToCSV = async function(filter) {
    window.alert('Generating CSV export...');
    const response = await fetch('/api/visitors');
    let visitors = await response.json();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter === 'Daily') {
        visitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= today);
    } else if (filter === 'Weekly') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        visitors = visitors.filter(v => parseSQLiteDate(v.created_at) >= lastWeek);
    } else if (filter === 'Monthly') {
        visitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
        });
    } else if (filter === 'Yearly') {
        visitors = visitors.filter(v => {
            const vDate = parseSQLiteDate(v.created_at);
            return vDate.getFullYear() === now.getFullYear();
        });
    }

    let csvContent = "Registration ID,Primary Visitor,Destination,Quantity,Total Amount,Status,Date Recorded\n";

    visitors.forEach(v => {
        const members = JSON.parse(v.members || '[]');
        const size = 1 + members.length;
        const totalAmount = v.total ? v.total.replace(/[^0-9.-]/g, '') : '0.00';
        const dateRecorded = parseSQLiteDate(v.created_at).toLocaleDateString();
        
        const row = [
            `"${v.id}"`,
            `"${v.name}"`,
            `"${v.resort}"`,
            `"${size}"`,
            `"${totalAmount}"`,
            `"${v.status}"`,
            `"${dateRecorded}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Tourism_Report_${filter}_${now.getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

async function renderPaymentLogs() {
    const response = await fetch('/api/visitors');
    const visitors = await response.json();

    const uniqueResorts = [...new Set(visitors.map(v => v.resort).filter(Boolean))];

    let rows = visitors.map(v => {
        const pStatus = v.payment_status || 'Paid';
        const badgeColor = pStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                data-created-at="${v.created_at}"
                data-resort="${v.resort}"
                data-payment-status="${pStatus}">
                <td class="py-4 px-4 font-bold text-gray-500 text-xs">${v.id}</td>
                <td class="py-4 px-4 font-semibold text-gray-800">${v.name}</td>
                <td class="py-4 px-4 text-gray-700">${v.resort}</td>
                <td class="py-4 px-4 font-bold text-emerald-600">${v.total}</td>
                <td class="py-4 px-4"><span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${badgeColor}">${pStatus}</span></td>
                <td class="py-4 px-4 font-semibold text-gray-700">${v.recieved_by || 'Online'}</td>
                <td class="py-4 px-4 text-center">
                    <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center" onclick="deleteVisitor('${v.id}')" title="Delete Record">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
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
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Paid</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Recieved By</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="7" class="py-8 text-center text-gray-400">No payment records found.</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

async function togglePaymentStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    if (!(await showConfirm(`Change payment status for [${id}] to [${newStatus}]?`))) return;

    try {
        const username = currentAdmin ? currentAdmin.username : 'Online';
        const response = await fetch('/api/visitors/payment-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id, 
                paymentStatus: newStatus,
                recievedBy: newStatus === 'Paid' ? username : 'Online'
            })
        });

        if (response.ok) {
            showView('payments');
        } else {
            alert("Failed to update payment status.");
        }
    } catch (err) {
        alert("Network error.");
    }
}

async function deleteVisitor(id) {
    if (!(await showConfirm(`Are you sure you want to delete record [${id}]? This action cannot be undone.`))) return;

    try {
        const response = await fetch(`/api/visitors/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Record deleted successfully.");
            showView(currentView);
        } else {
            const err = await response.json();
            alert("Deletion failed: " + (err.error || "Unknown error."));
        }
    } catch (err) {
        alert("Network failure.");
    }
}


async function renderAccountsView() {
    const response = await fetch('/api/users');
    const users = await response.json();

    let userRows = users.map(u => `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td class="py-4 px-4 font-bold text-gray-800">${u.username}</td>
            <td class="py-4 px-4 text-gray-700">${u.role}</td>
            <td class="py-4 px-4"><span class="px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${u.level === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}">${u.level}</span></td>
            <td class="py-4 px-4 text-gray-500">${parseSQLiteDate(u.created_at).toLocaleDateString()}</td>
            <td class="py-4 px-4 no-print text-center">
                <div class="flex gap-2 justify-center">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors flex items-center justify-center shadow-md hover:shadow-lg" onclick='editUser(${JSON.stringify(u).replace(/'/g, "&apos;")})'>
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors flex items-center justify-center shadow-md hover:shadow-lg" onclick="deleteUser(${u.id})">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    return `
        <div class="flex justify-end mb-6 no-print fade-in">
            <button class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all text-xs uppercase tracking-wider" onclick="toggleAccountForm()">
                <i data-lucide="plus-circle" class="w-4 h-4"></i> Add Account
            </button>
        </div>

        <div id="account-creation-card" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] opacity-0 pointer-events-none transition-all duration-200 no-print">
            <div class="bg-white rounded-2xl p-8 max-w-2xl w-[90%] shadow-2xl border border-slate-300 transform scale-95 transition-all duration-200 relative">
                <button type="button" onclick="closeAccountModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
                <h3 class="font-display font-bold text-gray-800 text-xl mb-6">Create Staff Account</h3>
                <form id="add-user-form" class="grid grid-cols-1 md:grid-cols-2 gap-6" autocomplete="off">
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-600 uppercase tracking-wide">Personnel Username</label>
                        <input type="text" id="new-username" placeholder="Full name or Employee Tag" required autocomplete="new-password" class="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-gray-50">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-600 uppercase tracking-wide">Security Password</label>
                        <input type="password" id="new-password" placeholder="••••••••" required autocomplete="new-password" class="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-gray-50">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-600 uppercase tracking-wide">Duty Assignment / Role</label>
                        <input type="text" id="new-role" placeholder="e.g. BlueWave Duty Officer" required class="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-gray-50">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-bold text-gray-600 uppercase tracking-wide">Authorized Portal</label>
                        <select id="new-level" required class="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-gray-50 cursor-pointer">
                            <option value="staff">Staff Portal (Restricted)</option>
                            <option value="admin">Admin Portal (Full Access)</option>
                        </select>
                    </div>
                    <div class="col-span-1 md:col-span-2 flex gap-3 mt-4">
                        <button type="button" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all" onclick="closeAccountModal()">
                            Cancel
                        </button>
                        <button type="button" class="account-submit-btn flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg" onclick="createUserAccount()">
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-slate-300 p-6 fade-in">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Personnel Accounts Table</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assignment</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Access Level</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member Since</th>
                            <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${userRows || '<tr><td colspan="5" class="py-8 text-center text-gray-400">No personnel records found.</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

function toggleAccountForm() {
    editingUserId = null;
    const card = document.getElementById('account-creation-card');
    card.querySelector('h3').innerText = "Create Staff Account";
    card.querySelector('.account-submit-btn').innerText = "Create Account";

    document.getElementById('add-user-form').reset();
    document.getElementById('new-password').placeholder = "••••••••";
    document.getElementById('new-password').required = true;

    card.classList.remove('pointer-events-none', 'opacity-0');
    card.classList.add('opacity-100');
    card.querySelector('div').classList.remove('scale-95');
    card.querySelector('div').classList.add('scale-100');
    if (window.lucide) lucide.createIcons();
}

async function createUserAccount() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const level = document.getElementById('new-level').value;

    if (!username || !role || (!editingUserId && !password)) {
        alert("Please fill in all required fields.");
        return;
    }

    try {
        const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
        const method = editingUserId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, level })
        });

        if (response.ok) {
            alert(editingUserId ? "Account updated successfully!" : "Account provisioned successfully!");


            if (editingUserId && editingUserId == currentAdmin.id) {
                currentAdmin.username = username;
                currentAdmin.role = role;
                currentAdmin.level = level;
                localStorage.setItem('currentUser', JSON.stringify(currentAdmin));
                refreshProfile();
            }

            editingUserId = null;
            showView('accounts');
        } else {
            const err = await response.json();
            alert("Action failed: " + err.error);
        }
    } catch (err) {
        alert("Network failure.");
    }
}

function editUser(user) {
    editingUserId = user.id;
    const card = document.getElementById('account-creation-card');

    document.getElementById('new-username').value = user.username;
    document.getElementById('new-role').value = user.role;
    document.getElementById('new-level').value = user.level;
    document.getElementById('new-password').placeholder = "Leave blank to keep current";
    document.getElementById('new-password').required = false;
    document.getElementById('new-password').value = "";

    card.querySelector('h3').innerText = "Update Account Details";
    card.querySelector('.account-submit-btn').innerText = "Update User Account";

    card.classList.remove('pointer-events-none', 'opacity-0');
    card.classList.add('opacity-100');
    card.querySelector('div').classList.remove('scale-95');
    card.querySelector('div').classList.add('scale-100');
    if (window.lucide) lucide.createIcons();
}

async function deleteUser(id) {
    if (!(await showConfirm("Are you sure you want to delete this account? This action cannot be undone."))) return;

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Account deleted successfully.");
            showView('accounts');
        } else {
            const err = await response.json();
            alert("Deletion failed: " + err.error);
        }
    } catch (err) {
        alert("Network failure.");
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

async function logout() {
    const confirm = await showConfirm("Are you sure you want to logout?");
    if (!confirm) return;
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

async function refreshProfile() {
    const nameEl = document.getElementById('admin-profile-name');
    const roleEl = document.getElementById('admin-profile-role');

    if (!currentAdmin) return;

    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const me = users.find(u => u.id == currentAdmin.id);

        if (me) {

            if (me.username !== currentAdmin.username || me.role !== currentAdmin.role) {
                currentAdmin.username = me.username;
                currentAdmin.role = me.role;
                localStorage.setItem('currentUser', JSON.stringify(currentAdmin));
            }
            if (nameEl) nameEl.innerText = me.username;
            if (roleEl) roleEl.innerText = me.role;
        } else {
            if (nameEl) nameEl.innerText = currentAdmin.username;
            if (roleEl) roleEl.innerText = currentAdmin.role;
        }
    } catch (err) {
        if (nameEl) nameEl.innerText = currentAdmin.username;
        if (roleEl) roleEl.innerText = currentAdmin.role;
    }
}

function renderRevenueGraph() {
    return `
        <div class="table-container fade-in">
            <h3 style="font-family: 'Montserrat'; margin-bottom: 2rem;">Collection Fee Overview (Daily Trend)</h3>
            <div style="height: 400px;">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>
    `;
}

async function initRevenueChart() {
    const response = await fetch('/api/visitors');
    const visitors = await response.json();


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
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

async function renderAttendanceLogs() {
    const response = await fetch('/api/attendance/logs');
    const logs = await response.json();

    const uniquePersonnel = [...new Set(logs.map(log => log.username).filter(Boolean))];

    let rows = logs.map(log => {
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
                data-status="${log.status}"
                data-username="${log.username}">
                <td class="py-4 px-4">
                    <div class="font-bold text-gray-800">${log.username}</div>
                    <div class="text-xs text-gray-400 mt-1">${date}</div>
                </td>
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

    return `
        <div class="bg-white rounded-xl shadow-lg border border-slate-300 p-6 fade-in">
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
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
                <!-- Search -->
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="attendance-search" placeholder="Search staff..." oninput="applyAttendanceFilters()"
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
                <!-- Personnel Filter -->
                <select id="attendance-personnel-filter" onchange="applyAttendanceFilters()"
                    class="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-semibold text-slate-700 cursor-pointer">
                    <option value="All">All Personnel</option>
                    ${uniquePersonnel.map(u => `<option value="${u}">${u}</option>`).join('')}
                </select>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse" id="attendance-table">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Personnel</th>
                            <th class="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">In</th>
                            <th class="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Out</th>
                            <th class="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Duty Status</th>
                            <th class="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</th>
                            <th class="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="6" class="py-12 text-center text-gray-400 font-medium font-bold">No attendance records found.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


function toggleCompanions(id) {
    const el = document.getElementById(`companions-${id}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
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

async function loadAndRenderSettings() {
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            currentSettings = await response.json();
        } else {
            currentSettings = {
                statuses: [
                    { value: 'Regular', discount: 0 },
                    { value: 'PWD', discount: 0.20 },
                    { value: 'Senior Citizen', discount: 0.20 }
                ],
                resorts: ['Calawag', 'BlueWave', 'Campolly'],
                visitor_types: [
                    { value: 'Domestic Local', fee: 20 },
                    { value: 'Domestic National', fee: 50 },
                    { value: 'Foreigner', fee: 50 }
                ],
                durations: ['Same Day', 'Overnight', '2-3 Days', 'Week Long']
            };
        }
    } catch (err) {
        console.error('Error fetching settings:', err);
        currentSettings = {
            statuses: [
                { value: 'Regular', discount: 0 },
                { value: 'PWD', discount: 0.20 },
                { value: 'Senior Citizen', discount: 0.20 }
            ],
            resorts: ['Calawag', 'BlueWave', 'Campolly'],
            visitor_types: [
                { value: 'Domestic Local', fee: 20 },
                { value: 'Domestic National', fee: 50 },
                { value: 'Foreigner', fee: 50 }
            ],
            durations: ['Same Day', 'Overnight', '2-3 Days', 'Week Long']
        };
    }
    renderSettingsView();
}

function renderSettingsView() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea || !currentSettings) return;

    if (!window.activeSettingsTab) {
        window.activeSettingsTab = 'statuses';
    }

    const tab = window.activeSettingsTab;
    let tabContentHtml = '';

    if (tab === 'statuses') {
        let statusesHtml = '';
        if (currentSettings.statuses) {
            currentSettings.statuses.forEach((s, idx) => {
                const isEditing = editingSettingsState.category === 'statuses' && editingSettingsState.index === idx;
                if (isEditing) {
                    statusesHtml += `
                        <tr class="animate-[fadeIn_0.2s_ease-out]">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <input type="text" id="edit-status-val-${idx}" value="${s.value}" class="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200">
                                <div class="flex items-center gap-1.5">
                                    <input type="number" id="edit-status-discount-${idx}" value="${(s.discount * 100).toFixed(0)}" placeholder="%" class="w-20 px-3 py-1.5 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                                    <span class="text-xs text-gray-500 font-bold">%</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-1.5">
                                    <button onclick="saveSettingEdit('statuses', ${idx})" class="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"><i data-lucide="check" class="w-4 h-4"></i></button>
                                    <button onclick="cancelSettingEdit()" class="p-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    statusesHtml += `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <span class="font-semibold text-gray-800 text-sm">${s.value}</span>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200">
                                <span class="text-xs font-bold text-emerald-600 bg-emerald-100/70 px-2.5 py-1 rounded-full">${(s.discount * 100).toFixed(0)}% Discount</span>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-2">
                                    <button onclick="startSettingEdit('statuses', ${idx})" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                    <button onclick="deleteSettingItem('statuses', ${idx})" class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });
        }

        tabContentHtml = `
            <div>
                <div class="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                    <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/5">
                        <i data-lucide="percent" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-slate-800 text-lg leading-tight">Status Options</h4>
                        <p class="text-xs text-slate-400 mt-0.5">Configure discounts for different tourist statuses (e.g. Senior Citizen, PWD, Regular)</p>
                    </div>
                </div>

                <div class="bg-slate-50/50 rounded-2xl border border-slate-300 p-5 mb-6 shadow-md">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Add New Status Option</h5>
                    <form onsubmit="addSettingItem(event, 'statuses')" class="flex flex-col sm:flex-row gap-3">
                        <input type="text" id="new-status-val" placeholder="e.g. Student" required class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10">
                        <div class="relative flex items-center">
                            <input type="number" id="new-status-discount" placeholder="Discount %" required min="0" max="100" class="w-full sm:w-36 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10 text-center pr-8">
                            <span class="absolute right-4 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center justify-center gap-2 text-sm font-bold">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Option
                        </button>
                    </form>
                </div>

                <div class="mb-3">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider">Status Options Table</h5>
                </div>

                <div class="overflow-x-auto mb-6 rounded-xl border border-slate-300 shadow-lg bg-white">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4">Discount Percentage</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${statusesHtml || '<tr><td colspan="3" class="text-center py-8 text-gray-400 text-sm">No status options configured.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tab === 'visitor_types') {
        let visitorTypesHtml = '';
        if (currentSettings.visitor_types) {
            currentSettings.visitor_types.forEach((t, idx) => {
                const isEditing = editingSettingsState.category === 'visitor_types' && editingSettingsState.index === idx;
                if (isEditing) {
                    visitorTypesHtml += `
                        <tr class="animate-[fadeIn_0.2s_ease-out]">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <input type="text" id="edit-type-val-${idx}" value="${t.value}" class="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-sm text-slate-500 font-semibold">₱</span>
                                    <input type="number" id="edit-type-fee-${idx}" value="${t.fee}" placeholder="Fee" class="w-24 px-3 py-1.5 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                                </div>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-1.5">
                                    <button onclick="saveSettingEdit('visitor_types', ${idx})" class="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"><i data-lucide="check" class="w-4 h-4"></i></button>
                                    <button onclick="cancelSettingEdit()" class="p-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    visitorTypesHtml += `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <span class="font-semibold text-gray-800 text-sm">${t.value}</span>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200">
                                <span class="text-xs font-bold text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-full">₱${parseFloat(t.fee).toFixed(2)} Fee</span>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-2">
                                    <button onclick="startSettingEdit('visitor_types', ${idx})" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                    <button onclick="deleteSettingItem('visitor_types', ${idx})" class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });
        }

        tabContentHtml = `
            <div>
                <div class="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                    <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/5">
                        <i data-lucide="coins" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-slate-800 text-lg leading-tight">Visitor Types</h4>
                        <p class="text-xs text-slate-400 mt-0.5">Configure admission fees for different types of visitors (e.g. Domestic Local, Domestic National, Foreigner)</p>
                    </div>
                </div>

                <div class="bg-slate-50/50 rounded-2xl border border-slate-300 p-5 mb-6 shadow-md">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Add New Visitor Type</h5>
                    <form onsubmit="addSettingItem(event, 'visitor_types')" class="flex flex-col sm:flex-row gap-3">
                        <input type="text" id="new-type-val" placeholder="e.g. Domestic National" required class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10">
                        <div class="relative flex items-center">
                            <span class="absolute left-4 text-xs font-bold text-slate-400">₱</span>
                            <input type="number" id="new-type-fee" placeholder="Fee" required min="0" class="w-full sm:w-36 px-4 py-2.5 pl-8 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10 text-center">
                        </div>
                        <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center justify-center gap-2 text-sm font-bold">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Type
                        </button>
                    </form>
                </div>

                <div class="mb-3">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider">Visitor Types Table</h5>
                </div>

                <div class="overflow-x-auto mb-6 rounded-xl border border-slate-300 shadow-lg bg-white">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <th class="px-6 py-4">Visitor Type</th>
                                <th class="px-6 py-4">Admission Fee</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${visitorTypesHtml || '<tr><td colspan="3" class="text-center py-8 text-gray-400 text-sm">No visitor types configured.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tab === 'resorts') {
        let resortsHtml = '';
        if (currentSettings.resorts) {
            currentSettings.resorts.forEach((r, idx) => {
                const isEditing = editingSettingsState.category === 'resorts' && editingSettingsState.index === idx;
                if (isEditing) {
                    resortsHtml += `
                        <tr class="animate-[fadeIn_0.2s_ease-out]">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <input type="text" id="edit-resort-val-${idx}" value="${r}" class="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-1.5">
                                    <button onclick="saveSettingEdit('resorts', ${idx})" class="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"><i data-lucide="check" class="w-4 h-4"></i></button>
                                    <button onclick="cancelSettingEdit()" class="p-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    resortsHtml += `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <span class="font-semibold text-gray-800 text-sm">${r}</span>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-2">
                                    <button onclick="startSettingEdit('resorts', ${idx})" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                    <button onclick="deleteSettingItem('resorts', ${idx})" class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });
        }

        tabContentHtml = `
            <div>
                <div class="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                    <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-500/5">
                        <i data-lucide="palmtree" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-slate-800 text-lg leading-tight">Destination Resorts</h4>
                        <p class="text-xs text-slate-400 mt-0.5">Configure available destination resorts for selection (e.g. Calawag, BlueWave, Campolly)</p>
                    </div>
                </div>

                <div class="bg-slate-50/50 rounded-2xl border border-slate-300 p-5 mb-6 shadow-md">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Add New Destination Resort</h5>
                    <form onsubmit="addSettingItem(event, 'resorts')" class="flex flex-col sm:flex-row gap-3">
                        <input type="text" id="new-resort-val" placeholder="e.g. Calawag Resort" required class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10">
                        <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center justify-center gap-2 text-sm font-bold">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Resort
                        </button>
                    </form>
                </div>

                <div class="mb-3">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider">Destination Resorts Table</h5>
                </div>

                <div class="overflow-x-auto mb-6 rounded-xl border border-slate-300 shadow-lg bg-white">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <th class="px-6 py-4">Resort Name</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${resortsHtml || '<tr><td colspan="2" class="text-center py-8 text-gray-400 text-sm">No resorts configured.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tab === 'durations') {
        let resortsHtml = '';
        if (currentSettings.durations) {
            currentSettings.durations.forEach((d, idx) => {
                const isEditing = editingSettingsState.category === 'durations' && editingSettingsState.index === idx;
                if (isEditing) {
                    resortsHtml += `
                        <tr class="animate-[fadeIn_0.2s_ease-out]">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <input type="text" id="edit-duration-val-${idx}" value="${d}" class="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-1.5">
                                    <button onclick="saveSettingEdit('durations', ${idx})" class="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"><i data-lucide="check" class="w-4 h-4"></i></button>
                                    <button onclick="cancelSettingEdit()" class="p-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    resortsHtml += `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 border-b border-slate-200">
                                <span class="font-semibold text-gray-800 text-sm">${d}</span>
                            </td>
                            <td class="px-6 py-4 border-b border-slate-200 text-right">
                                <div class="flex justify-end gap-2">
                                    <button onclick="startSettingEdit('durations', ${idx})" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                    <button onclick="deleteSettingItem('durations', ${idx})" class="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors inline-flex items-center justify-center shadow-md hover:shadow-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });
        }

        tabContentHtml = `
            <div>
                <div class="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                    <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-500/5">
                        <i data-lucide="calendar-range" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-slate-800 text-lg leading-tight">Duration of Stay</h4>
                        <p class="text-xs text-slate-400 mt-0.5">Configure options for the length of tourist stays (e.g. Same Day, Overnight, 2-3 Days)</p>
                    </div>
                </div>

                <div class="bg-slate-50/50 rounded-2xl border border-slate-300 p-5 mb-6 shadow-md">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Add New Duration Option</h5>
                    <form onsubmit="addSettingItem(event, 'durations')" class="flex flex-col sm:flex-row gap-3">
                        <input type="text" id="new-duration-val" placeholder="e.g. Overnight" required class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10">
                        <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center justify-center gap-2 text-sm font-bold">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Duration
                        </button>
                    </form>
                </div>

                <div class="mb-3">
                    <h5 class="font-display font-bold text-xs text-slate-500 uppercase tracking-wider">Duration of Stay Table</h5>
                </div>

                <div class="overflow-x-auto mb-6 rounded-xl border border-slate-300 shadow-lg bg-white">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <th class="px-6 py-4">Duration Name</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${resortsHtml || '<tr><td colspan="2" class="text-center py-8 text-gray-400 text-sm">No duration options configured.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    const htmlContent = `
        <div class="fade-in max-w-6xl mx-auto">
            <!-- Horizontal Tabs -->
            <div class="mb-6 border-b border-gray-200">
                <nav class="-mb-px flex gap-2 sm:gap-6 overflow-x-auto" aria-label="Tabs">
                    <button onclick="switchSettingsTab('statuses')" class="border-b-2 py-3 px-2 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 ${tab === 'statuses' ? 'border-primary text-emerald-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}">
                        <i data-lucide="percent" class="w-4 h-4"></i>
                        Status Options
                    </button>
                    <button onclick="switchSettingsTab('visitor_types')" class="border-b-2 py-3 px-2 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 ${tab === 'visitor_types' ? 'border-primary text-emerald-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}">
                        <i data-lucide="coins" class="w-4 h-4"></i>
                        Visitor Types
                    </button>
                    <button onclick="switchSettingsTab('resorts')" class="border-b-2 py-3 px-2 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 ${tab === 'resorts' ? 'border-primary text-emerald-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}">
                        <i data-lucide="palmtree" class="w-4 h-4"></i>
                        Destination Resorts
                    </button>
                    <button onclick="switchSettingsTab('durations')" class="border-b-2 py-3 px-2 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 ${tab === 'durations' ? 'border-primary text-emerald-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}">
                        <i data-lucide="calendar-range" class="w-4 h-4"></i>
                        Duration of Stay
                    </button>
                </nav>
            </div>
            
            <!-- Active Tab Content Card -->
            <div class="bg-white rounded-2xl border border-slate-300 p-6 shadow-lg">
                ${tabContentHtml}
            </div>
        </div>
    `;

    contentArea.innerHTML = htmlContent;
    if (window.lucide) lucide.createIcons();
}

function switchSettingsTab(tabId) {
    window.activeSettingsTab = tabId;
    editingSettingsState = { category: null, index: null };
    renderSettingsView();
}


function startSettingEdit(category, index) {
    editingSettingsState = { category, index };
    renderSettingsView();
}

function cancelSettingEdit() {
    editingSettingsState = { category: null, index: null };
    renderSettingsView();
}

async function saveSettingEdit(category, index) {
    let updatedVal = null;
    if (category === 'statuses') {
        const valInput = document.getElementById(`edit-status-val-${index}`);
        const discountInput = document.getElementById(`edit-status-discount-${index}`);
        if (!valInput || !discountInput) return;
        const discountVal = parseFloat(discountInput.value) / 100;
        updatedVal = {
            value: valInput.value.trim(),
            discount: isNaN(discountVal) ? 0 : discountVal
        };
    } else if (category === 'visitor_types') {
        const valInput = document.getElementById(`edit-type-val-${index}`);
        const feeInput = document.getElementById(`edit-type-fee-${index}`);
        if (!valInput || !feeInput) return;
        updatedVal = {
            value: valInput.value.trim(),
            fee: parseFloat(feeInput.value) || 0
        };
    } else if (category === 'resorts') {
        const valInput = document.getElementById(`edit-resort-val-${index}`);
        if (!valInput) return;
        updatedVal = valInput.value.trim();
    } else if (category === 'durations') {
        const valInput = document.getElementById(`edit-duration-val-${index}`);
        if (!valInput) return;
        updatedVal = valInput.value.trim();
    }

    if (!updatedVal || (typeof updatedVal === 'object' && !updatedVal.value)) {
        alert("Invalid input.");
        return;
    }

    currentSettings[category][index] = updatedVal;
    
    if (await pushSettingsToServer(category)) {
        editingSettingsState = { category: null, index: null };
        renderSettingsView();
    }
}

async function addSettingItem(e, category) {
    e.preventDefault();
    let newItem = null;
    if (category === 'statuses') {
        const valEl = document.getElementById('new-status-val');
        const discEl = document.getElementById('new-status-discount');
        const discVal = parseFloat(discEl.value) / 100;
        newItem = {
            value: valEl.value.trim(),
            discount: isNaN(discVal) ? 0 : discVal
        };
        valEl.value = '';
        discEl.value = '';
    } else if (category === 'visitor_types') {
        const valEl = document.getElementById('new-type-val');
        const feeEl = document.getElementById('new-type-fee');
        newItem = {
            value: valEl.value.trim(),
            fee: parseFloat(feeEl.value) || 0
        };
        valEl.value = '';
        feeEl.value = '';
    } else if (category === 'resorts') {
        const valEl = document.getElementById('new-resort-val');
        newItem = valEl.value.trim();
        valEl.value = '';
    } else if (category === 'durations') {
        const valEl = document.getElementById('new-duration-val');
        newItem = valEl.value.trim();
        valEl.value = '';
    }

    if (!newItem || (typeof newItem === 'object' && !newItem.value)) {
        alert("Invalid input.");
        return;
    }

    currentSettings[category].push(newItem);

    if (await pushSettingsToServer(category)) {
        renderSettingsView();
    }
}

async function deleteSettingItem(category, index) {
    const itemLabel = typeof currentSettings[category][index] === 'object' 
        ? currentSettings[category][index].value 
        : currentSettings[category][index];
        
    if (!(await showConfirm(`Are you sure you want to delete "${itemLabel}" from ${category}?`))) return;

    currentSettings[category].splice(index, 1);

    if (await pushSettingsToServer(category)) {
        renderSettingsView();
    }
}

async function pushSettingsToServer(category) {
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: category,
                value: currentSettings[category]
            })
        });

        if (response.ok) {
            return true;
        } else {
            const err = await response.json();
            alert("Failed to save settings: " + (err.error || "Unknown error"));
            return false;
        }
    } catch (err) {
        alert("Failed to save settings: network error.");
        return false;
    }
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
    const personnelVal = document.getElementById('attendance-personnel-filter')?.value || 'All';

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
        const username = row.getAttribute('data-username');
        const text = row.innerText.toLowerCase();

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesStatus = statusVal === 'All' || status === statusVal;
        const matchesPersonnel = personnelVal === 'All' || username === personnelVal;

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

        if (matchesSearch && matchesStatus && matchesPersonnel && matchesDate) {
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

function applyReportFilters() {
    const searchVal = document.getElementById('report-search')?.value.toLowerCase().trim() || '';
    const table = document.getElementById('report-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const matchesSearch = !searchVal || text.includes(searchVal);
        if (matchesSearch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
window.applyReportFilters = applyReportFilters;

function closeAccountModal() {
    const card = document.getElementById('account-creation-card');
    if (!card) return;
    card.classList.add('pointer-events-none', 'opacity-0');
    card.classList.remove('opacity-100');
    card.querySelector('div').classList.add('scale-95');
    card.querySelector('div').classList.remove('scale-100');
}
window.closeAccountModal = closeAccountModal;

