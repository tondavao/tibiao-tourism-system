

const CLOUD_URL = "https://tourist-digital-logging-and-monitor-three.vercel.app";
let isSyncing = false;


async function runCloudSync() {
    if (isSyncing) return;


    if (!navigator.onLine) return;

    try {
        isSyncing = true;
        console.log(`[SyncEngine] Starting periodic sync with ${CLOUD_URL}...`);


        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${CLOUD_URL}/api/visitors`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Cloud connection failed (${response.status})`);

        const cloudVisitors = await response.json();


        let newRecords = 0;
        for (const visitor of cloudVisitors) {
            try {
                const localRes = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: visitor.id,
                        name: visitor.name,
                        address: visitor.address,
                        age: visitor.age,
                        gender: visitor.gender,
                        resort: visitor.resort,
                        visitorType: visitor.visitor_type || visitor.visitorType,
                        duration: visitor.duration,
                        members: typeof visitor.members === 'string' ? JSON.parse(visitor.members) : visitor.members,
                        total: visitor.total,
                        recievedBy: visitor.recieved_by || visitor.recievedBy || 'Online'
                    })
                });

                if (localRes.ok) {
                    const data = await localRes.json();
                    if (!data.duplicate) newRecords++;
                }
            } catch (err) {
                console.warn(`[SyncEngine] Skipped item ${visitor.id}`);
            }
        }

        if (newRecords > 0) {
            console.log(`[SyncEngine] Sync Complete! Found ${newRecords} new registrations.`);

            if (typeof showView === 'function') {
                const activeNav = document.querySelector('.nav-item.active');
                if (activeNav) {
                    const onclickStr = activeNav.getAttribute('onclick');
                    const match = onclickStr ? onclickStr.match(/'([^']+)'/) : null;
                    if (match && (match[1] === 'dashboard' || match[1] === 'visitors')) {
                        showView(match[1]);
                    }
                }
            }
        }

    } catch (err) {
        console.error("[SyncEngine] Sync Error:", err.message);
    } finally {
        isSyncing = false;
    }
}


let isUploading = false;

async function uploadOfflineQueues() {
    if (isUploading) return;
    if (!navigator.onLine) return;

    let registers = JSON.parse(localStorage.getItem('offline_register_queue') || '[]');
    let checkouts = JSON.parse(localStorage.getItem('offline_checkout_queue') || '[]');

    if (registers.length === 0 && checkouts.length === 0) return;

    try {
        isUploading = true;
        console.log(`[SyncEngine] Found ${registers.length} offline registrations and ${checkouts.length} checkouts. Uploading...`);

        let registersRemaining = [];
        let checkoutsRemaining = [];
        let syncedCount = 0;

        for (const formData of registers) {
            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (res.ok) {
                    syncedCount++;
                } else {
                    registersRemaining.push(formData);
                }
            } catch (err) {
                registersRemaining.push(formData);
            }
        }
        
        for (const id of checkouts) {
            try {
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });
                if (res.ok || res.status === 404) {
                    syncedCount++;
                } else {
                    checkoutsRemaining.push(id);
                }
            } catch (err) {
                checkoutsRemaining.push(id);
            }
        }

        localStorage.setItem('offline_register_queue', JSON.stringify(registersRemaining));
        localStorage.setItem('offline_checkout_queue', JSON.stringify(checkoutsRemaining));

        if (syncedCount > 0) {
            console.log(`[SyncEngine] Successfully uploaded ${syncedCount} offline records.`);
            if (typeof showView === 'function') {
                const activeNav = document.querySelector('.nav-item.active');
                if (activeNav) {
                    const onclickStr = activeNav.getAttribute('onclick');
                    const match = onclickStr ? onclickStr.match(/'([^']+)'/) : null;
                    if (match && (match[1] === 'dashboard' || match[1] === 'visitors')) {
                        showView(match[1]);
                    }
                }
            }
        }
    } catch (err) {
        console.error("[SyncEngine] Upload Error:", err.message);
    } finally {
        isUploading = false;
    }
}


function initAutoSync() {

    setTimeout(() => {
        uploadOfflineQueues();
        runCloudSync();
    }, 1000);


    setInterval(() => {
        if (document.visibilityState === 'visible') {
            uploadOfflineQueues();
            runCloudSync();
        }
    }, 10000);


    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            uploadOfflineQueues();
            runCloudSync();
        }
    });

    window.addEventListener('online', () => {
        console.log('[SyncEngine] Network restored. Triggering immediate offline upload.');
        window.alert('Network restored. Syncing offline data...');
        uploadOfflineQueues();
    });

    window.addEventListener('offline', () => {
        console.log('[SyncEngine] Network connection lost.');
        window.alert('⚠️ You are offline. Changes will be saved locally and synced later.');
    });

    window.syncCloudData = () => { console.log("Manual sync button removed. System syncs automatically every 10s.") };
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoSync);
} else {
    initAutoSync();
}
