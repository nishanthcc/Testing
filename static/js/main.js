// Global Search & Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K for Search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
    }
    // Ctrl+O for Floating AI
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        toggleFloatingAI();
    }
});

function openSearchModal() {
    document.getElementById('searchModal').classList.remove('hidden');
    document.getElementById('globalSearchInput').focus();
}
function closeSearchModal() {
    document.getElementById('searchModal').classList.add('hidden');
}

function openTemplateModal() {
    document.getElementById('templateModal').classList.remove('hidden');
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal-backdrop')) {
        event.target.classList.add('hidden');
    }
}

function toggleFloatingAI() {
    document.getElementById('aiChatWidget').classList.toggle('hidden');
    if(!document.getElementById('aiChatWidget').classList.contains('hidden')) {
        document.getElementById('aiChatInput').focus();
    }
}

// Global Search FTS Logic
document.getElementById('globalSearchInput')?.addEventListener('input', async (e) => {
    const q = e.target.value;
    const resultsContainer = document.getElementById('searchResultsList');
    if (q.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    
    resultsContainer.innerHTML = data.map(item => `
        <div class="quick-action-item" onclick="previewResult('${item.snippet.replace(/'/g, "\\'")}')">
            <div class="action-icon">${item.icon || '📄'}</div>
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:500; color: #fff;">${item.canvas_title}</span>
                <span style="font-size:12px; color:#aaa;">${item.snippet.substring(0, 60)}...</span>
            </div>
        </div>
    `).join('');
});

function previewResult(snippet) {
    document.getElementById('searchPreviewPanel').innerHTML = `
        <div style="padding: 20px;">
            <h3 style="color:#fff; margin-bottom: 12px;">Preview</h3>
            <p style="color: #ccc; line-height: 1.5; font-size: 13px;">${snippet}</p>
        </div>
    `;
}

// Drag & Drop File Parsing
const dropZone = document.getElementById('dropZone');
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dropZone) dropZone.classList.remove('hidden');
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0 && dropZone) {
        dropZone.classList.add('hidden');
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (dropZone) dropZone.classList.add('hidden');
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
        // We'll map this to the AI upload endpoint later if implemented, 
        // for now just simulate a visual feedback
        console.log("File dropped:", files[0].name);
        alert("File parsing initiated: " + files[0].name);
    } catch(err) {
        console.error(err);
    }
});
