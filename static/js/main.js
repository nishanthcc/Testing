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

// Dynamic Sidebar Loading
async function loadSidebarTree() {
    try {
        const res = await fetch('/api/canvases/tree');
        const treeData = await res.json();
        
        const privateContainer = document.getElementById('privateTree');
        if (!privateContainer) return;

        function renderNodes(nodes, depth = 0) {
            let html = '';
            for (const node of nodes) {
                html += \
                    <div class="tree-item" style="padding-left: \px" onclick="loadCanvas('\')">
                        <span class="tree-icon">\</span>
                        <span class="tree-label">\</span>
                    </div>
                \;
                if (node.children && node.children.length > 0) {
                    html += renderNodes(node.children, depth + 1);
                }
            }
            return html;
        }

        privateContainer.innerHTML = renderNodes(treeData);
    } catch(err) {
        console.error("Failed to load sidebar tree", err);
    }
}

async function loadCanvas(canvasId) {
    try {
        const res = await fetch(\/api/canvases/\\);
        const data = await res.json();
        
        // Update Title & Icon
        document.querySelector('.page-title').textContent = data.title;
        document.querySelector('.page-icon').textContent = data.icon || '📄';
        
        // Update Breadcrumb
        const bc = document.querySelector('.breadcrumb');
        if(bc) {
            bc.innerHTML = \<span class="icon">\</span><span class="title">\</span>\;
        }

        // Render Nodes in Editor
        const editor = document.getElementById('editorBlocks');
        editor.innerHTML = '';
        
        for (const node of data.nodes) {
            const el = document.createElement('div');
            el.className = 'block-node';
            el.setAttribute('data-id', node.id);
            el.setAttribute('data-type', node.type);
            
            // Reconstruct block HTML based on type
            let inner = '';
            const text = node.content || '';
            if (node.type === 'checkbox') {
                const checked = (node.properties && node.properties.status === 'done') ? 'checked' : '';
                inner = \<input type="checkbox" class="node-checkbox" \ onchange="toggleNodeStatus('\', this.checked)"><div class="content-editable" contenteditable="true">\</div>\;
            } else if (node.type === 'code') {
                inner = \<div class="code-wrapper"><div class="content-editable code-editable" contenteditable="true">\</div></div>\;
            } else if (node.type === 'quote') {
                inner = \<div class="quote-wrapper"><div class="content-editable" contenteditable="true">\</div></div>\;
            } else if (node.type === 'callout') {
                inner = \<div class="callout-wrapper"><span class="callout-icon">💡</span><div class="content-editable" contenteditable="true">\</div></div>\;
            } else if (node.type === 'divider') {
                inner = \<hr class="node-divider"><div class="content-editable hidden" contenteditable="true"></div>\;
            } else {
                inner = \<div class="content-editable node-\" contenteditable="true">\</div>\;
            }

            el.innerHTML = \
                <div class="drag-handle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <div class="block-content">
                    \
                </div>
            \;
            editor.appendChild(el);
        }
        
        // Re-bind editor context if needed
        BlockEngine.canvasId = canvasId;
    } catch(err) {
        console.error("Failed to load canvas", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarTree();
});
