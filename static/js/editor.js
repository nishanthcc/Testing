const BlockEngine = {
    canvasId: null,
    activeSlashNode: null,
    
    init() {
        this.editor = document.getElementById('editorBlocks');
        if (!this.editor) return;
        
        // Use path to extract Canvas ID (assume URL like / or /canvas/123)
        // For MVP, we'll assume the canvas_id is embedded or we can grab the first node's canvas_id
        const firstNode = this.editor.querySelector('.block-node');
        if (firstNode) {
            // Need a way to get canvas ID. We can just store it globally on the page.
        }

        this.bindEvents();
        this.initSlashMenu();
        this.initFormatToolbar();
    },

    bindEvents() {
        // Event delegation for editable content
        this.editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.editor.addEventListener('input', (e) => this.handleInput(e));
        
        // Formatting commands
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const format = btn.getAttribute('data-format');
                if (format === 'link') {
                    const url = prompt('Enter link URL:');
                    if (url) document.execCommand('createLink', false, url);
                } else if (format === 'code') {
                    // Wrap selection in <code>
                    const sel = window.getSelection();
                    if (!sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        const code = document.createElement('code');
                        code.textContent = range.extractContents().textContent;
                        range.insertNode(code);
                    }
                } else {
                    document.execCommand(format, false, null);
                }
            });
        });
    },

    handleKeyDown(e) {
        if (!e.target.classList.contains('content-editable')) return;
        const node = e.target.closest('.block-node');

        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefault();
                this.splitBlock(node);
            }
        } else if (e.key === 'Backspace') {
            const sel = window.getSelection();
            if (sel.isCollapsed && sel.anchorOffset === 0) {
                e.preventDefault();
                this.mergeWithPrevious(node);
            }
        }
    },

    handleInput(e) {
        if (!e.target.classList.contains('content-editable')) return;
        const node = e.target.closest('.block-node');
        const text = e.target.textContent;

        // Auto-markdown conversion
        if (text === '# ' && node.getAttribute('data-type') !== 'h1') {
            this.morphNode(node, 'h1');
            e.target.textContent = '';
        } else if (text === '## ' && node.getAttribute('data-type') !== 'h2') {
            this.morphNode(node, 'h2');
            e.target.textContent = '';
        } else if (text === '### ' && node.getAttribute('data-type') !== 'h3') {
            this.morphNode(node, 'h3');
            e.target.textContent = '';
        } else if (text === '[] ' && node.getAttribute('data-type') !== 'checkbox') {
            this.morphNode(node, 'checkbox');
            e.target.textContent = '';
        } else if (text === '---' && node.getAttribute('data-type') !== 'divider') {
            this.morphNode(node, 'divider');
            e.target.textContent = '';
            this.appendNewBlock(node);
        }

        // Trigger Slash Menu
        if (text.endsWith('/')) {
            this.showSlashMenu(node);
        } else if (this.activeSlashNode) {
            const match = text.match(/\/(\w*)$/);
            if (match) {
                this.filterSlashMenu(match[1]);
            } else {
                this.hideSlashMenu();
            }
        }
    },

    splitBlock(currentNode) {
        // Find selection offset to split text
        const sel = window.getSelection();
        const editable = currentNode.querySelector('.content-editable');
        let remainingText = '';
        let newText = '';

        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const preRange = range.cloneRange();
            preRange.selectNodeContents(editable);
            preRange.setEnd(range.startContainer, range.startOffset);
            remainingText = preRange.toString();
            
            const postRange = range.cloneRange();
            postRange.selectNodeContents(editable);
            postRange.setStart(range.endContainer, range.endOffset);
            newText = postRange.toString();
        }

        editable.textContent = remainingText;

        const newNode = document.createElement('div');
        newNode.className = 'block-node';
        newNode.setAttribute('data-type', 'paragraph');
        
        let innerHtml = `
            <div class="drag-handle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <div class="block-content">
                <div class="content-editable" contenteditable="true">${newText}</div>
            </div>
        `;
        newNode.innerHTML = innerHtml;
        
        currentNode.insertAdjacentElement('afterend', newNode);
        const newEditable = newNode.querySelector('.content-editable');
        newEditable.focus();
        
        // Set cursor to start
        const range = document.createRange();
        range.selectNodeContents(newEditable);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        // Async save logic goes here
    },

    mergeWithPrevious(currentNode) {
        const prevNode = currentNode.previousElementSibling;
        if (!prevNode || !prevNode.classList.contains('block-node')) return;

        const currentEditable = currentNode.querySelector('.content-editable');
        const prevEditable = prevNode.querySelector('.content-editable');

        const prevLen = prevEditable.textContent.length;
        prevEditable.textContent += currentEditable.textContent;
        
        currentNode.remove();
        prevEditable.focus();

        // Restore cursor position
        const range = document.createRange();
        const sel = window.getSelection();
        if (prevEditable.childNodes.length > 0) {
            range.setStart(prevEditable.childNodes[0], prevLen);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        
        // Async delete logic goes here
    },

    appendNewBlock(afterNode = null) {
        const newNode = document.createElement('div');
        newNode.className = 'block-node';
        newNode.setAttribute('data-type', 'paragraph');
        newNode.innerHTML = `
            <div class="drag-handle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></div>
            <div class="block-content">
                <div class="content-editable" contenteditable="true"></div>
            </div>
        `;
        if (afterNode) {
            afterNode.insertAdjacentElement('afterend', newNode);
        } else {
            this.editor.appendChild(newNode);
        }
        newNode.querySelector('.content-editable').focus();
    },

    morphNode(node, type) {
        node.setAttribute('data-type', type);
        const contentDiv = node.querySelector('.block-content');
        const editable = node.querySelector('.content-editable');
        const text = editable.innerHTML;

        let inner = '';
        if (type === 'checkbox') {
            inner = `<input type="checkbox" class="node-checkbox"><div class="content-editable" contenteditable="true">${text}</div>`;
        } else if (type === 'code') {
            inner = `<div class="code-wrapper"><div class="content-editable code-editable" contenteditable="true">${text}</div></div>`;
        } else if (type === 'quote') {
            inner = `<div class="quote-wrapper"><div class="content-editable" contenteditable="true">${text}</div></div>`;
        } else if (type === 'callout') {
            inner = `<div class="callout-wrapper"><span class="callout-icon">💡</span><div class="content-editable" contenteditable="true">${text}</div></div>`;
        } else if (type === 'divider') {
            inner = `<hr class="node-divider"><div class="content-editable hidden" contenteditable="true"></div>`;
        } else {
            // standard h1, h2, h3, paragraph
            inner = `<div class="content-editable node-${type}" contenteditable="true">${text}</div>`;
        }

        contentDiv.innerHTML = inner;
        const newEditable = contentDiv.querySelector('.content-editable');
        if (newEditable && !newEditable.classList.contains('hidden')) {
            newEditable.focus();
            // Move cursor to end
            const range = document.createRange();
            range.selectNodeContents(newEditable);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    },

    /* Slash Menu */
    initSlashMenu() {
        this.slashMenu = document.getElementById('slashMenu');
        if(!this.slashMenu) return;

        this.slashMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.slash-menu-item');
            if (item && this.activeSlashNode) {
                const type = item.getAttribute('data-type');
                const editable = this.activeSlashNode.querySelector('.content-editable');
                // Remove the slash text
                editable.textContent = editable.textContent.replace(/\/(\w*)$/, '');
                this.morphNode(this.activeSlashNode, type);
                this.hideSlashMenu();
            }
        });
    },

    showSlashMenu(node) {
        this.activeSlashNode = node;
        this.slashMenu.classList.remove('hidden');
        
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            this.slashMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
            this.slashMenu.style.left = `${rect.left + window.scrollX}px`;
        }
    },

    hideSlashMenu() {
        this.activeSlashNode = null;
        this.slashMenu.classList.add('hidden');
    },

    filterSlashMenu(query) {
        const items = this.slashMenu.querySelectorAll('.slash-menu-item');
        let hasVisible = false;
        items.forEach(item => {
            const text = item.querySelector('.slash-text').textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                item.style.display = 'flex';
                hasVisible = true;
            } else {
                item.style.display = 'none';
            }
        });
        if (!hasVisible) this.hideSlashMenu();
    },

    /* Floating Toolbar */
    initFormatToolbar() {
        this.formatToolbar = document.getElementById('floatingFormatToolbar');
        if(!this.formatToolbar) return;

        document.addEventListener('selectionchange', () => {
            const sel = window.getSelection();
            if (!sel.isCollapsed && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer;
                // Only show if inside editor
                if (container.nodeType === 3 ? container.parentNode.closest('.editor-blocks') : container.closest('.editor-blocks')) {
                    const rect = range.getBoundingClientRect();
                    this.formatToolbar.classList.remove('hidden');
                    this.formatToolbar.style.top = `${rect.top + window.scrollY - 40}px`;
                    this.formatToolbar.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (this.formatToolbar.offsetWidth / 2)}px`;
                    return;
                }
            }
            this.formatToolbar.classList.add('hidden');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    BlockEngine.init();
});
