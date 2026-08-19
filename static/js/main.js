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
                <span style="font-weight:500">${item.canvas_title}</span>
                <span style="font-size:11px; color:#888;">${item.snippet.substring(0, 50)}...</span>
            </div>
        </div>
    `).join('');
});

function previewResult(snippet) {
    document.getElementById('searchPreviewPanel').innerHTML = `
        <div style="padding: 20px;">
            <h3>Preview</h3>
            <p style="margin-top: 10px; color: #ccc;">${snippet}</p>
        </div>
    `;
}
