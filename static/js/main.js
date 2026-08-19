document.addEventListener('DOMContentLoaded', () => {

    // 1. Search Logic
    const searchInput = document.getElementById('searchInput');
    const taskList = document.getElementById('taskList');
    
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const q = e.target.value;
            if(q.length < 2) return;
            
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const tasks = await res.json();
            
            if(taskList) {
                taskList.innerHTML = tasks.map(t => `
                    <div class="task-card">
                        <div class="card-body">
                            <h2 class="task-title">${t.title}</h2>
                        </div>
                    </div>
                `).join('') || '<div class="empty-state">No results found.</div>';
            }
        }, 300);
    });

    // 2. Strict Bounded Drag & Drop Zone
    // We attach events to the mainContent area so the overlay stays bounded
    const mainContent = document.getElementById('mainContent');
    const dropOverlay = document.getElementById('dropOverlay');
    const fileUpload = document.getElementById('fileUpload');

    if(mainContent && dropOverlay) {
        let dragCounter = 0;

        mainContent.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if(dragCounter === 1) {
                dropOverlay.style.display = 'flex';
            }
        });

        mainContent.addEventListener('dragover', (e) => {
            e.preventDefault(); 
        });

        mainContent.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if(dragCounter === 0) {
                dropOverlay.style.display = 'none';
            }
        });

        mainContent.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            dropOverlay.style.display = 'none';
            
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
    
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    
    if(res.ok) {
        window.location.reload(); 
    } else {
        alert("Upload failed.");
    }
}

// Main Task Toggle
window.toggleTask = async function(id, el, currentStatus) {
    const newStatus = !currentStatus;
    
    const svg = el.querySelector('svg');
    const path = svg.querySelector('path');
    
    // Optimistic checkmark SVG state update
    if(newStatus) {
        svg.setAttribute('fill', '#0084ff');
        svg.setAttribute('stroke', '#0084ff');
    } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#666');
    }
    
    // DAG evaluation
    const allCards = document.querySelectorAll('.task-card');
    allCards.forEach(card => {
        if(card.dataset.depends == id) {
            if(newStatus) card.classList.remove('locked');
            else card.classList.add('locked');
        }
    });

    await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    
    window.location.reload();
}

// Subtask Toggle
window.toggleSubtask = async function(id, el) {
    const isChecked = el.classList.contains('checked');
    const newStatus = !isChecked;
    
    if(newStatus) {
        el.classList.add('checked');
        el.nextElementSibling.style.textDecoration = 'line-through';
    } else {
        el.classList.remove('checked');
        el.nextElementSibling.style.textDecoration = 'none';
    }

    await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
}

// Expand Task
window.expandTask = async function(id, btnEl) {
    const res = await fetch(`/api/tasks/${id}/expand`, {
        method: 'POST'
    });
    
    if(res.ok) {
        window.location.reload(); 
    }
}
