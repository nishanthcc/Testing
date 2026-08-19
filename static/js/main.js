// Extract motion from global window object (loaded via CDN)
const { animate, spring } = window.Motion;

// Default critically damped spring for standard UI appearances
const defaultSpring = { type: 'spring', bounce: 0, duration: 0.4 };

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Floating Nav Clock
    const clockEl = document.getElementById('clock');
    if(clockEl) {
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = `${now.toTimeString().split(' ')[0]} IST / ACTIVE SESSION`;
        }, 1000);
    }

    // 2. Cmd+K Search Modal
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    let searchModalOpen = false;

    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleSearchModal();
        }
        if (e.key === 'Escape' && searchModalOpen) {
            toggleSearchModal();
        }
    });

    searchModal?.addEventListener('click', (e) => {
        if(e.target === searchModal) toggleSearchModal();
    });

    function toggleSearchModal() {
        searchModalOpen = !searchModalOpen;
        if(searchModalOpen) {
            searchModal.style.display = 'flex';
            searchInput.focus();
            animate(searchModal, { opacity: [0, 1] }, defaultSpring);
            animate('.search-modal-content', { y: [-50, 0], scale: [0.95, 1] }, defaultSpring);
        } else {
            animate(searchModal, { opacity: 0 }, defaultSpring).finished.then(() => {
                searchModal.style.display = 'none';
                searchInput.value = '';
                searchResults.innerHTML = '';
            });
        }
    }

    // Debounced Search API call
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const q = e.target.value;
            if(q.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const tasks = await res.json();
            
            searchResults.innerHTML = tasks.map(t => `
                <div class="search-result-item" onclick="window.location.href='/'">
                    <div style="font-weight:500">${t.title}</div>
                    <div style="font-size:0.8rem; color:#a1a1aa; margin-top:4px;">${t.status ? 'Completed' : 'Active'}</div>
                </div>
            `).join('');
        }, 300);
    });

    // 3. Drag and Drop Upload Zone
    const dropZone = document.getElementById('dropZone');
    const dropOverlay = document.getElementById('dropOverlay');
    const fileUpload = document.getElementById('fileUpload');

    if(dropZone && dropOverlay) {
        let dragCounter = 0;

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if(dragCounter === 1) {
                dropOverlay.style.display = 'flex';
                animate(dropOverlay, { opacity: 1, scale: [1.05, 1] }, defaultSpring);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); // necessary to allow dropping
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if(dragCounter === 0) {
                animate(dropOverlay, { opacity: 0 }, defaultSpring).finished.then(() => {
                    dropOverlay.style.display = 'none';
                });
            }
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            animate(dropOverlay, { opacity: 0 }, defaultSpring).finished.then(() => {
                dropOverlay.style.display = 'none';
            });
            
            if(e.dataTransfer.files.length) {
                uploadFile(e.dataTransfer.files[0]);
            }
        });

        fileUpload?.addEventListener('change', (e) => {
            if(e.target.files.length) {
                uploadFile(e.target.files[0]);
            }
        });
    }
});

// File Upload Logic
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // We can show a loading state here
    
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    
    if(res.ok) {
        // Just reload the page for simplicity of rendering the new complex DOM state
        // Ideally we inject DOM using document.createElement for true zero-reload, 
        // but given the nested nature, reloading keeps it clean for this phase.
        window.location.reload(); 
    } else {
        alert("Upload failed.");
    }
}

// Task Toggle
window.toggleTask = async function(id, el) {
    const isChecked = el.classList.contains('checked');
    const newStatus = !isChecked;
    
    // Optimistic UI update
    if(newStatus) {
        el.classList.add('checked');
    } else {
        el.classList.remove('checked');
    }

    // Check for dependencies unlocked
    const allCards = document.querySelectorAll('.task-card');
    allCards.forEach(card => {
        if(card.dataset.depends == id) {
            if(newStatus) {
                card.classList.remove('locked');
            } else {
                card.classList.add('locked');
            }
        }
    });

    await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
}

// Expand Task Pipeline
window.expandTask = async function(id, btnEl) {
    btnEl.disabled = true;
    btnEl.innerText = "Expanding...";
    
    const res = await fetch(`/api/tasks/${id}/expand`, {
        method: 'POST'
    });
    
    if(res.ok) {
        window.location.reload(); // Reloading to render the new nested pipeline
    }
}
