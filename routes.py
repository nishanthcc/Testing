from flask import Blueprint, render_template, request, jsonify, current_app, redirect, url_for
from werkzeug.utils import secure_filename
import os
import PyPDF2
from models import db, Task

routes = Blueprint('routes', __name__)

def init_routes(app):
    app.register_blueprint(routes)

# --- MPA Routes ---

@routes.route('/')
def index():
    # Fetch root tasks (no parent) for the dashboard
    tasks = Task.query.filter_by(parent_id=None).order_by(Task.created_at.desc()).all()
    # Serialize for frontend injection
    tasks_data = [t.to_dict() for t in tasks]
    return render_template('index.html', tasks=tasks_data)

@routes.route('/completed')
def completed():
    return render_template('completed.html')

@routes.route('/metrics')
def metrics():
    return render_template('metrics.html')

@routes.route('/settings')
def settings():
    return render_template('settings.html')

@routes.route('/login')
@routes.route('/register')
def auth_placeholder():
    # Redirect old auth routes to the main dashboard
    return redirect(url_for('routes.index'))

# --- API Routes ---

@routes.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        parent_id=data.get('parent_id'),
        depends_on_id=data.get('depends_on_id')
    )
    # Simple deterministic heuristic for manual tasks
    task.estimated_time = len(task.title) * 2
    task.energy_weight = 'Medium' if len(task.title) > 20 else 'Low'
    
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict())

@routes.route('/api/tasks/<int:id>', methods=['PUT', 'DELETE'])
def update_task(id):
    task = Task.query.filter_by(id=id).first_or_404()
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'success': True})
    
    # PUT
    data = request.get_json()
    if 'status' in data:
        task.status = data['status']
    db.session.commit()
    return jsonify(task.to_dict())

@routes.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Parse text
        text_content = ""
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.pdf':
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text_content += page.extract_text() + "\n"
        else:
            with open(filepath, 'r', encoding='utf-8') as f:
                text_content = f.read()
                
        # Mock ML Extraction
        sentences = [s.strip() for s in text_content.split('.') if len(s.strip()) > 10]
        extracted_titles = sentences[:3] # Just grab the first 3 logical sentences as tasks
        
        # Create Parent Document Task
        parent_task = Task(
            title=f"Doc: {filename}",
            attachment_url=filepath
        )
        db.session.add(parent_task)
        db.session.flush() # get ID
        
        # Create Sub-tasks
        for i, title in enumerate(extracted_titles):
            sub = Task(
                title=title[:140],
                parent_id=parent_task.id,
                estimated_time=15 * (i+1),
                energy_weight='High' if len(title) > 50 else 'Medium'
            )
            # Make sequential dependencies for the DAG
            if i > 0:
                db.session.flush()
                pass
            db.session.add(sub)
            
        db.session.commit()
        return jsonify(parent_task.to_dict())

@routes.route('/api/tasks/<int:id>/expand', methods=['POST'])
def expand_task(id):
    parent = Task.query.filter_by(id=id).first_or_404()
    
    # Mock Expansion Pipeline
    steps = ["Environment Setup", "Execution Phase", "Deployment & Verification"]
    new_subs = []
    
    prev_id = None
    for step in steps:
        sub = Task(
            title=f"{parent.title} - {step}",
            parent_id=parent.id,
            estimated_time=30,
            energy_weight='High'
        )
        if prev_id:
            sub.depends_on_id = prev_id
        db.session.add(sub)
        db.session.flush()
        prev_id = sub.id
        new_subs.append(sub)
        
    db.session.commit()
    return jsonify({'parent_id': parent.id, 'new_subtasks': [s.to_dict() for s in new_subs]})

@routes.route('/api/search', methods=['GET'])
def search():
    q = request.args.get('q', '')
    if not q:
        return jsonify([])
    tasks = Task.query.filter(Task.title.ilike(f'%{q}%')).limit(5).all()
    return jsonify([t.to_dict() for t in tasks])
