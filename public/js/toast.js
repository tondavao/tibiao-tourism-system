window.alert = function(message) {
    let type = 'success';
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('invalid') || lowerMsg.includes('blocked')) {
        type = 'error';
    } else if (message.includes('⚠️') || lowerMsg.includes('offline')) {
        type = 'warning';
    }
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-[9999] transform transition-all duration-300 -translate-y-24 opacity-0 font-medium max-w-sm border ${
        type === 'error' ? 'bg-white text-red-600 border-red-100 shadow-red-500/10' :
        type === 'warning' ? 'bg-white text-amber-600 border-amber-100 shadow-amber-500/10' :
        'bg-white text-emerald-600 border-emerald-100 shadow-emerald-500/10'
    }`;
    
    let icon = type === 'error' ? 'x-circle' : type === 'warning' ? 'alert-triangle' : 'check-circle-2';
    
    toast.innerHTML = `
        <div class="shrink-0 p-2 rounded-full ${type === 'error' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-emerald-50'}">
            <i data-lucide="${icon}" class="w-5 h-5"></i>
        </div>
        <span class="text-gray-700 text-sm leading-tight">${message.replace('⚠️', '').trim()}</span>
    `;
    
    document.body.appendChild(toast);
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('-translate-y-24', 'opacity-0');
    });
    
    // Animate out
    setTimeout(() => {
        toast.classList.add('-translate-y-24', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4500);
};
