// Editor Block Mechanics
async function toggleNodeStatus(nodeId, isChecked) {
    await fetch(`/api/nodes/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            properties: { status: isChecked ? 'done' : 'todo' }
        })
    });
}

function appendNewBlock() {
    // Basic placeholder for adding a block
    const editor = document.getElementById('editorBlocks');
    const newBlock = document.createElement('div');
    newBlock.className = 'block-node';
    newBlock.innerHTML = `
        <div class="drag-handle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </div>
        <div class="block-content">
            <input type="checkbox" class="node-checkbox" onchange="toggleNodeStatus('new', this.checked)">
            <div class="content-editable" contenteditable="true"></div>
        </div>
    `;
    editor.appendChild(newBlock);
    newBlock.querySelector('.content-editable').focus();
}
