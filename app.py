import os
from flask import Flask
from database import db, setup_fts_and_triggers
from routes_canvas import routes_canvas
from routes_matrix import routes_matrix
from routes_search import routes_search
from routes_ai import routes_ai

def seed_database(app):
    from models import Canvas, Node
    with app.app_context():
        # Check if canvases are empty
        if Canvas.query.first() is None:
            # Seed 1: Getting Started
            c1 = Canvas(title='Getting Started', icon='👋')
            db.session.add(c1)
            db.session.flush()

            n1 = Node(canvas_id=c1.id, type='h1', content='Welcome to your new Workspace', position=1000)
            n2 = Node(canvas_id=c1.id, type='paragraph', content='This is an infinite canvas for thoughts, tasks, and matrix databases.', position=2000)
            db.session.add_all([n1, n2])

            # Seed 2: To Do List
            c2 = Canvas(title='To Do List', icon='☑️')
            db.session.add(c2)
            db.session.flush()

            tasks = [
                "[x] Check the box to mark items as done",
                "[ ] Click the due date to change it",
                "[ ] Click me to see even more detail",
                "[ ] Click the blue New button to add a task",
                "[ ] Click me to learn how to hide checked items",
                "[ ] See finished items in the \"Done\" view",
                "[ ] Click me to learn how to see your content your way"
            ]

            for i, task_text in enumerate(tasks):
                status = 'done' if task_text.startswith('[x]') else 'todo'
                clean_text = task_text[4:]
                
                # Mock properties for tags
                props = {
                    "status": status,
                    "date": "Today" if i < 6 else "Tomorrow",
                    "tags": ["TIME:30m", "ENRG:HIGH"] if i == 0 else []
                }
                
                n = Node(
                    canvas_id=c2.id,
                    type='checkbox',
                    content=clean_text,
                    position=(i+1)*1000
                )
                n.set_properties(props)
                db.session.add(n)

            db.session.commit()
            print("Database seeded with default templates.")

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'apple_fluid_interfaces_secret_key_123'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure upload folder
    UPLOAD_FOLDER = os.path.join(app.root_path, 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    db.init_app(app)
    
    # Register Domain Blueprints
    app.register_blueprint(routes_canvas)
    app.register_blueprint(routes_matrix)
    app.register_blueprint(routes_search)
    app.register_blueprint(routes_ai)

    with app.app_context():
        db.create_all()
        setup_fts_and_triggers(app)
        seed_database(app)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5050)
