const { animate } = window.Motion;
const defaultSpring = { type: 'spring', bounce: 0, duration: 0.4 };

document.addEventListener('DOMContentLoaded', () => {

    // 1. Sidebar Search (simulating Cmd+K but inline)
    const searchInput = document.getElementById('searchInput');
    const taskList = document.getElementById('taskList');
    
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const q = e.target.value;
            if(q.length < 2) {
                // Could restore original content here if needed, keeping simple for demo
                return;
            }
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const tasks = await res.json();
            
            // Simple render of search results in feed format
            if(taskList) {
                taskList.innerHTML = tasks.map(t => `
                    <div class="feed-card">
                        <div class="card-header">
                            <div class="user-meta">
                                <div class="meta-text">
                                    <span class="meta-name">Search Result</span>
                                </div>
                            </div>
                        </div>
                        <div class="card-image-area" style="height: 150px;">
                            <div class="simulated-image">
                                <h2 class="task-title-large" style="font-size:20px;">${t.title}</h2>
                            </div>
                        </div>
                    </div>
                `).join('') || '<div class="empty-state">No results found.</div>';
            }
        }, 300);
    });

    // 2. Drag and Drop Upload Zone
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
                animate(dropOverlay, { opacity: 1 }, defaultSpring);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); 
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

// Task Toggle (Heart/Like button in UI translation)
window.toggleTask = async function(id, el, currentStatus) {
    const newStatus = !currentStatus;
    
    // Update SVG colors to emulate liking/completing
    const svg = el.querySelector('svg');
    const count = el.querySelector('.count');
    
    if(newStatus) {
        svg.setAttribute('fill', '#38BDF8');
        svg.setAttribute('stroke', '#38BDF8');
        count.innerText = "1";
    } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        count.innerText = "0";
    }
    
    // Check DAG
    const allCards = document.querySelectorAll('.feed-card');
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
    
    // Refresh to update title strikethroughs etc (or do it in DOM)
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

// Expand Task Pipeline
window.expandTask = async function(id, btnEl) {
    const res = await fetch(`/api/tasks/${id}/expand`, {
        method: 'POST'
    });
    
    if(res.ok) {
        window.location.reload(); 
    }
}
