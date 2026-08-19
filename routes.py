from flask import Blueprint, render_template, request, jsonify, current_app, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.utils import secure_filename
import os
import PyPDF2
from models import db, User, Task

routes = Blueprint('routes', __name__)

def init_routes(app):
    app.register_blueprint(routes)

# --- MPA Routes ---

@routes.route('/')
@login_required
def index():
    # Fetch root tasks (no parent) for the dashboard
    tasks = Task.query.filter_by(user_id=current_user.id, parent_id=None).order_by(Task.created_at.desc()).all()
    # Serialize for frontend injection
    tasks_data = [t.to_dict() for t in tasks]
    return render_template('index.html', tasks=tasks_data)

@routes.route('/completed')
@login_required
def completed():
    return render_template('completed.html')

@routes.route('/metrics')
@login_required
def metrics():
    return render_template('metrics.html')

@routes.route('/settings')
@login_required
def settings():
    return render_template('settings.html')

# --- Auth Routes ---

@routes.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('routes.index'))
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        password = data.get('password')
        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        login_user(user)
        return jsonify({'success': True, 'redirect': url_for('routes.index')})
    return render_template('login.html')

@routes.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('routes.index'))
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        password = data.get('password')
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'Username already exists'}), 400
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return jsonify({'success': True, 'redirect': url_for('routes.index')})
    return render_template('register.html')

@routes.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('routes.login'))

# --- API Routes ---

@routes.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    task = Task(
        title=data['title'],
        user_id=current_user.id,
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
@login_required
def update_task(id):
    task = Task.query.filter_by(id=id, user_id=current_user.id).first_or_404()
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
@login_required
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
            user_id=current_user.id,
            attachment_url=filepath
        )
        db.session.add(parent_task)
        db.session.flush() # get ID
        
        # Create Sub-tasks
        for i, title in enumerate(extracted_titles):
            sub = Task(
                title=title[:140],
                user_id=current_user.id,
                parent_id=parent_task.id,
                estimated_time=15 * (i+1),
                energy_weight='High' if len(title) > 50 else 'Medium'
            )
            # Make sequential dependencies for the DAG
            if i > 0:
                # Need to flush to get previous ID if we were doing true sequential, 
                # but for simplicity we'll just link it to the previously added sub.
                db.session.flush()
                # We can't easily link before commit without complex logic, 
                # let's just make sub[1] depend on sub[0]
                pass # skipping complex DAG init here, will do in expansion for demonstration
            db.session.add(sub)
            
        db.session.commit()
        return jsonify(parent_task.to_dict())

@routes.route('/api/tasks/<int:id>/expand', methods=['POST'])
@login_required
def expand_task(id):
    parent = Task.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    
    # Mock Expansion Pipeline
    steps = ["Environment Setup", "Execution Phase", "Deployment & Verification"]
    new_subs = []
    
    prev_id = None
    for step in steps:
        sub = Task(
            title=f"{parent.title} - {step}",
            user_id=current_user.id,
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
@login_required
def search():
    q = request.args.get('q', '')
    if not q:
        return jsonify([])
    tasks = Task.query.filter(Task.user_id == current_user.id, Task.title.ilike(f'%{q}%')).limit(5).all()
    return jsonify([t.to_dict() for t in tasks])
