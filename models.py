from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    tasks = db.relationship('Task', backref='author', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    # Hierarchical fields (for document extraction / expansion)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    subtasks = db.relationship('Task', foreign_keys=[parent_id], backref=db.backref('parent', remote_side=[id]), cascade='all, delete-orphan')
    
    # Attachments
    attachment_url = db.Column(db.String(256), nullable=True)
    
    # ML & Statistical inference fields
    estimated_time = db.Column(db.Integer, nullable=True) # minutes
    energy_weight = db.Column(db.String(20), nullable=True) # e.g., 'High', 'Medium', 'Low'
    
    # Semantic Dependency Mapping (DAG)
    depends_on_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    dependencies = db.relationship('Task', foreign_keys=[depends_on_id], backref=db.backref('blocks', remote_side=[id]))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'parent_id': self.parent_id,
            'attachment_url': self.attachment_url,
            'estimated_time': self.estimated_time,
            'energy_weight': self.energy_weight,
            'depends_on_id': self.depends_on_id,
            'is_locked': self.depends_on_id is not None and not Task.query.get(self.depends_on_id).status,
            'subtasks': [t.to_dict() for t in self.subtasks]
        }
