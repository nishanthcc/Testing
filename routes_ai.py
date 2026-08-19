from flask import Blueprint, jsonify, request, Response
import requests
import json
import traceback

routes_ai = Blueprint('routes_ai', __name__)

@routes_ai.route('/api/ai/generate', methods=['POST'])
def ollama_generate():
    data = request.get_json()
    prompt = data.get('prompt', '')
    
    def generate():
        try:
            response = requests.post(
                'http://127.0.0.1:11434/api/generate',
                json={
                    'model': 'qwen2.5:7b',
                    'prompt': prompt,
                    'stream': True
                },
                stream=True,
                timeout=5
            )
            for line in response.iter_lines():
                if line:
                    yield f"data: {line.decode('utf-8')}\n\n"
        except requests.exceptions.RequestException as e:
            # Graceful Ollama fallback
            err_msg = json.dumps({"response": "\n\n*[System]* Local Ollama daemon offline. Please run `ollama serve` and ensure `qwen2.5:7b` is pulled.", "done": True})
            yield f"data: {err_msg}\n\n"
            
    return Response(generate(), mimetype='text/event-stream')
