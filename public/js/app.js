
let dynamicSettings = {
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

function getFeeForVisitorType(type) {
    const typeObj = dynamicSettings.visitor_types.find(t => t.value === type);
    return typeObj ? parseFloat(typeObj.fee) : 50;
}

function getDiscountForStatus(status) {
    const statusObj = dynamicSettings.statuses.find(s => s.value === status);
    return statusObj ? parseFloat(statusObj.discount) : 0;
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const data = await response.json();
            if (data.statuses) dynamicSettings.statuses = data.statuses;
            if (data.resorts) dynamicSettings.resorts = data.resorts;
            if (data.visitor_types) dynamicSettings.visitor_types = data.visitor_types;
            if (data.durations) dynamicSettings.durations = data.durations;
            
            localStorage.setItem('tibiao_settings', JSON.stringify(dynamicSettings));
        }
    } catch (err) {
        console.warn('Failed to fetch settings from API, using cached or default settings:', err);
        const cached = localStorage.getItem('tibiao_settings');
        if (cached) {
            try {
                dynamicSettings = JSON.parse(cached);
            } catch (e) {}
        }
    }
    populateDropdowns();
}

function populateDropdowns() {
    // Populate resorts
    const resortSelect = document.getElementById('resort');
    if (resortSelect) {
        const selectedVal = resortSelect.value;
        const firstOption = resortSelect.options[0];
        resortSelect.innerHTML = '';
        if (firstOption && firstOption.disabled) {
            resortSelect.appendChild(firstOption);
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.selected = true;
            opt.textContent = 'Select resort';
            resortSelect.appendChild(opt);
        }
        dynamicSettings.resorts.forEach(resort => {
            const opt = document.createElement('option');
            opt.value = resort;
            opt.textContent = resort;
            resortSelect.appendChild(opt);
        });
        const optOthers = document.createElement('option');
        optOthers.value = 'Others';
        optOthers.textContent = 'Others';
        resortSelect.appendChild(optOthers);
        if (selectedVal) resortSelect.value = selectedVal;
    }

    // Populate statuses
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        const selectedVal = statusSelect.value;
        statusSelect.innerHTML = '';
        dynamicSettings.statuses.forEach(status => {
            const opt = document.createElement('option');
            opt.value = status.value;
            opt.textContent = status.value;
            statusSelect.appendChild(opt);
        });
        if (selectedVal) statusSelect.value = selectedVal;
    }

    // Populate visitor-type
    const typeSelect = document.getElementById('visitor-type');
    if (typeSelect) {
        const selectedVal = typeSelect.value;
        const firstOption = typeSelect.options[0];
        typeSelect.innerHTML = '';
        if (firstOption && firstOption.disabled) {
            typeSelect.appendChild(firstOption);
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.selected = true;
            opt.textContent = 'Select type';
            typeSelect.appendChild(opt);
        }
        dynamicSettings.visitor_types.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type.value;
            let desc = type.value;
            if (type.value === 'Domestic Local') desc = 'Domestic (Within Antique)';
            else if (type.value === 'Domestic National') desc = 'Domestic (Outside Antique)';
            opt.textContent = desc;
            typeSelect.appendChild(opt);
        });
        if (selectedVal) typeSelect.value = selectedVal;
    }

    // Populate duration
    const durationSelect = document.getElementById('duration');
    if (durationSelect) {
        const selectedVal = durationSelect.value;
        const firstOption = durationSelect.options[0];
        durationSelect.innerHTML = '';
        if (firstOption && firstOption.disabled) {
            durationSelect.appendChild(firstOption);
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.selected = true;
            opt.textContent = 'Select duration';
            durationSelect.appendChild(opt);
        }
        dynamicSettings.durations.forEach(dur => {
            const opt = document.createElement('option');
            opt.value = dur;
            let desc = dur;
            if (dur === 'Same Day') desc = 'Same Day Visit';
            opt.textContent = desc;
            durationSelect.appendChild(opt);
        });
        if (selectedVal) durationSelect.value = selectedVal;
    }

    // Update help notes
    const notesEl = document.getElementById('payment-help-notes');
    if (notesEl) {
        const feeDescriptions = dynamicSettings.visitor_types.map(t => {
            let desc = t.value;
            if (t.value === 'Domestic Local') desc = 'Within Antique';
            else if (t.value === 'Domestic National') desc = 'Outside Antique';
            return `${desc} ₱${t.fee}`;
        }).join(' • ');

        const discountDescriptions = dynamicSettings.statuses
            .filter(s => s.discount > 0)
            .map(s => `${(s.discount * 100).toFixed(0)}% Discount applied for ${s.value}`)
            .join(' and ');

        notesEl.innerHTML = `
            <p style="margin-bottom: 4px;">* Fees: ${feeDescriptions}.</p>
            ${discountDescriptions ? `<p>* ${discountDescriptions}.</p>` : ''}
        `;
    }
}

let html5QrCode = null;

let currentScreen = 'landing-screen';
let lastFormData = null;


function navigateTo(screenId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        currentScreen = screenId;
    }

    if (screenId === 'welcome-screen') {
        document.querySelector('.app-container').style.backgroundColor = 'var(--primary)';
    } else {
        document.querySelector('.app-container').style.backgroundColor = 'var(--white)';
    }

    if (window.lucide) {
        lucide.createIcons();
    }

    window.scrollTo(0, 0);
}


function startQRScanner() {
    navigateTo('scan-screen');

    html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        stopQRScanner();
        navigateTo('welcome-screen');
    };

    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback)
                .catch(err2 => {
                    console.error(err2);
                    alert("Camera still blocked. Click the CAMERA ICON in your browser's address bar (top right) and select 'Always allow'.");
                    navigateTo('landing-screen');
                });
        });
}


function stopQRScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
    }
}


function simulateScan() {
    stopQRScanner();
    navigateTo('welcome-screen');
}


function addMember() {
    const list = document.getElementById('members-list');
    const memberId = 'member-' + Date.now();

    const defaultType = document.getElementById('visitor-type').value || 'Domestic Local';

    const memberCard = document.createElement('div');
    memberCard.className = 'member-card fade-in';
    memberCard.id = memberId;

    const statusOptions = dynamicSettings.statuses.map(s => {
        return `<option value="${s.value}">${s.value}</option>`;
    }).join('');

    const typeOptions = dynamicSettings.visitor_types.map(t => {
        let desc = t.value;
        if (t.value === 'Domestic Local') desc = 'Within Antique';
        else if (t.value === 'Domestic National') desc = 'Outside Antique';
        return `<option value="${t.value}" ${defaultType === t.value ? 'selected' : ''}>${desc}</option>`;
    }).join('');

    memberCard.innerHTML = `
        <button type="button" class="remove-member" onclick="removeMember('${memberId}')">
            <i data-lucide="x-circle"></i>
        </button>
        <div class="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Member's Name" class="member-name-input">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Age</label>
                <input type="number" placeholder="Age" class="member-age-input">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="member-status-input">
                    ${statusOptions}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Visitor Origin / Type</label>
            <select class="member-type-input">
                ${typeOptions}
            </select>
        </div>
    `;

    list.appendChild(memberCard);

    if (window.lucide) {
        lucide.createIcons();
    }
}


function removeMember(memberId) {
    const member = document.getElementById(memberId);
    if (member) {
        member.classList.add('fade-out');
        setTimeout(() => {
            member.remove();
        }, 100);
    }
}


function calculateTotalValue() {
    const primaryAge = parseInt(document.getElementById('age').value) || 0;
    const primaryStatus = document.getElementById('status').value;
    const primaryType = document.getElementById('visitor-type').value;

    let total = 0;

    const primaryDiscount = getDiscountForStatus(primaryStatus);
    const baseFee = getFeeForVisitorType(primaryType);
    const primaryCost = primaryAge <= 5 ? 0 : baseFee * (1 - primaryDiscount);
    total += primaryCost;

    const memberCards = document.querySelectorAll('.member-card');
    memberCards.forEach((card) => {
        const age = parseInt(card.querySelector('.member-age-input').value) || 0;
        const status = card.querySelector('.member-status-input').value;
        const type = card.querySelector('.member-type-input').value;

        const discount = getDiscountForStatus(status);
        const mBaseFee = getFeeForVisitorType(type);
        const cost = age <= 5 ? 0 : mBaseFee * (1 - discount);
        total += cost;
    });

    return `₱${total.toFixed(2)}`;
}


function renderPreview(formData) {
    const list = document.getElementById('preview-items-list');
    const totalEl = document.getElementById('preview-total-amount');
    list.innerHTML = '';

    const primaryRow = document.createElement('div');
    primaryRow.style.display = 'flex';
    primaryRow.style.justifyContent = 'space-between';
    primaryRow.style.fontSize = '1.05rem';
    primaryRow.style.color = '#1e293b';

    const primaryDiscount = getDiscountForStatus(formData.status_display);
    const baseFee = getFeeForVisitorType(formData.visitorType);
    const cost = formData.age <= 5 ? 0 : baseFee * (1 - primaryDiscount);

    primaryRow.innerHTML = `
        <span style="font-weight: 500;">Primary Visitor <span style="color:#64748b; font-size: 0.9rem;">(${formData.status_display} - ${formData.visitorType})</span></span>
        <span style="font-weight: 700;">₱${cost.toFixed(2)}</span>
    `;
    list.appendChild(primaryRow);

    formData.members.forEach(m => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = '1.05rem';
        row.style.color = '#1e293b';

        const mDiscount = getDiscountForStatus(m.status_display);
        const mBaseFee = getFeeForVisitorType(m.visitorType);
        const mCost = m.age <= 5 ? 0 : mBaseFee * (1 - mDiscount);

        row.innerHTML = `
            <span style="font-weight: 500;">${m.name} <span style="color:#64748b; font-size: 0.9rem;">(${m.status_display} - ${m.visitorType})</span></span>
            <span style="font-weight: 700;">₱${mCost.toFixed(2)}</span>
        `;
        list.appendChild(row);
    });

    totalEl.innerText = formData.total;

    if (window.lucide) lucide.createIcons();
}


function toggleOtherResort() {
    const resortSelect = document.getElementById('resort');
    const otherGroup = document.getElementById('resort-other-group');
    const otherInput = document.getElementById('resort-other');
    if (resortSelect.value === 'Others') {
        otherGroup.style.display = 'block';
        otherInput.setAttribute('required', 'required');
    } else {
        otherGroup.style.display = 'none';
        otherInput.removeAttribute('required');
        otherInput.value = '';
    }
}


document.getElementById('tourist-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const memberData = [];
    document.querySelectorAll('.member-card').forEach((card, index) => {
        const status = card.querySelector('.member-status-input').value;
        const age = parseInt(card.querySelector('.member-age-input').value) || 0;

        memberData.push({
            name: card.querySelector('.member-name-input').value || `Member ${index + 1}`,
            age: age,
            status: status,
            status_display: status,
            visitorType: card.querySelector('.member-type-input').value
        });
    });

    const primaryStatus = document.getElementById('status').value;
    const primaryAge = parseInt(document.getElementById('age').value) || 0;

    const loggedUser = localStorage.getItem('currentUser');
    let recievedBy = 'Online';
    if (loggedUser) {
        try {
            const parsed = JSON.parse(loggedUser);
            if (parsed && parsed.username) {
                recievedBy = parsed.username;
            }
        } catch (e) {}
    }

    lastFormData = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        age: primaryAge,
        status: primaryStatus,
        status_display: primaryStatus,
        gender: document.getElementById('gender').value,
        resort: (document.getElementById('resort').value === 'Others')
            ? (document.getElementById('resort-other').value.trim() || 'Others')
            : document.getElementById('resort').value,
        visitorType: document.getElementById('visitor-type').value,
        duration: document.getElementById('duration').value,
        members: memberData,
        total: calculateTotalValue(),
        status: 'Active',
        recievedBy: recievedBy
    };

    renderPreview(lastFormData);
    navigateTo('preview-screen');
});


function confirmRegistration() {
    if (!lastFormData) return;

    const visitorId = `TIB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    lastFormData.id = visitorId;

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastFormData)
    })
        .then(async response => {
            if (!response.ok) {
                try {
                    const errorBody = await response.json();
                    throw new Error(errorBody.error || `Server Error ${response.status}`);
                } catch (e) {
                    throw new Error(`Server Error ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            saveToLocalAndShowSuccess(lastFormData, visitorId);
        })
        .catch((error) => {
            console.error('Registration Error:', error);
            console.log("Saving offline...");
            alert("⚠️ No connection to server detected. Saving registration OFFLINE on this device.");

            let queue = JSON.parse(localStorage.getItem('offline_register_queue') || '[]');
            queue.push(lastFormData);
            localStorage.setItem('offline_register_queue', JSON.stringify(queue));

            saveToLocalAndShowSuccess(lastFormData, visitorId);
        });
}


function saveToLocalAndShowSuccess(formData, visitorId) {
    let visitors = JSON.parse(localStorage.getItem('tibiao_visitors') || '[]');
    visitors.push(formData);
    localStorage.setItem('tibiao_visitors', JSON.stringify(visitors));

    document.getElementById('generated-id').innerText = visitorId;
    
    // Generate QR Code
    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: visitorId,
            width: 140,
            height: 140,
            colorDark: "#064e3b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    const summaryCard = document.getElementById('summary-card');
    summaryCard.innerHTML = `
        <h3 class="payment-title"><i data-lucide="file-text"></i> Registration Details</h3>
        <div class="payment-item"><span>Visitor:</span> <strong>${formData.name}</strong></div>
        <div class="payment-item"><span>Resort:</span> <strong>${formData.resort}</strong></div>
        <div class="payment-item"><span>Visitor Type:</span> <strong>${formData.visitorType}</strong></div>
        <div class="payment-item"><span>Total Members:</span> <strong>${1 + (formData.members ? formData.members.length : 0)}</strong></div>
        <div class="payment-total">
            <span>Total Paid:</span>
            <span>${formData.total}</span>
        </div>
    `;
    navigateTo('success-screen');
}


function copyID() {
    const idText = document.getElementById('generated-id').innerText;
    navigator.clipboard.writeText(idText).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalHTML = copyBtn.innerHTML;

        copyBtn.innerHTML = '<i data-lucide="check" style="width: 18px; height: 18px; color: #10b981;"></i>';
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            if (window.lucide) lucide.createIcons();
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}


function processCheckout() {
    const idInput = document.getElementById('checkout-id').value.toUpperCase().trim();
    if (!idInput) {
        alert("Please enter a valid Registration ID.");
        return;
    }

    fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idInput })
    })
        .then(response => {
            if (!response.ok) throw new Error('ID not found or already checked out');
            return response.json();
        })
        .then(data => {
            handleSuccessfulCheckout(idInput);
        })
        .catch(error => {
            console.error('Network Error during checkout:', error);

            let queue = JSON.parse(localStorage.getItem('offline_checkout_queue') || '[]');
            queue.push(idInput);
            localStorage.setItem('offline_checkout_queue', JSON.stringify(queue));

            alert("⚠️ No connection to server detected. Visitor check-out saved OFFLINE.");
            handleSuccessfulCheckout(idInput);
        });
}

function handleSuccessfulCheckout(idInput) {
    let visitors = JSON.parse(localStorage.getItem('tibiao_visitors') || '[]');
    const visitorIndex = visitors.findIndex(v => v.id === idInput);
    if (visitorIndex !== -1) {
        visitors[visitorIndex].status = 'Checked Out';
        localStorage.setItem('tibiao_visitors', JSON.stringify(visitors));
    }

    alert(`Success! Visitor has been checked out.`);
    navigateTo('landing-screen');
    document.getElementById('checkout-id').value = '';
}


document.getElementById('add-member').addEventListener('click', addMember);


document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('register') === 'true' || window.location.hash === '#registration-screen') {
        navigateTo('registration-screen');
    } else if (window.location.hash) {
        const target = window.location.hash.substring(1);
        if (document.getElementById(target)) {
            navigateTo(target);
        }
    }
});
