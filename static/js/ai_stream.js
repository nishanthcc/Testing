// Ollama SSE Stream Consumer
async function handleAiInput(e) {
    if (e.key === 'Enter') {
        const input = e.target.value;
        if (!input) return;
        
        e.target.value = '';
        const chatBody = document.getElementById('aiChatBody');
        
        // Add user message
        chatBody.innerHTML += `<div class="ai-message" style="background:#0084ff; color:white;">${input}</div>`;
        
        // Add AI placeholder
        const aiMsgId = 'ai-msg-' + Date.now();
        chatBody.innerHTML += `<div class="ai-message" id="${aiMsgId}">...</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
        
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input })
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (let line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.response) {
                                aiText += data.response;
                                document.getElementById(aiMsgId).innerText = aiText;
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch (err) {
            document.getElementById(aiMsgId).innerText = "Error connecting to Nexus Engine.";
        }
    }
}
