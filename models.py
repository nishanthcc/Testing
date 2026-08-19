import uuid
from datetime import datetime
from database import db
import json

def generate_uuid():
    return str(uuid.uuid4())

class Canvas(db.Model):
    __tablename__ = 'canvases'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.Integer, nullable=True)
    parent_id = db.Column(db.String(36), db.ForeignKey('canvases.id', ondelete='CASCADE'), nullable=True)
    title = db.Column(db.String(255), nullable=False, default='Untitled')
    icon = db.Column(db.String(255), nullable=True)
    cover_image = db.Column(db.String(255), nullable=True)
    is_matrix = db.Column(db.Boolean, default=False)
    is_trashed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    nodes = db.relationship('Node', backref='canvas', lazy=True, cascade='all, delete-orphan')
    sub_canvases = db.relationship('Canvas', backref=db.backref('parent', remote_side=[id]), cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'icon': self.icon,
            'is_matrix': self.is_matrix,
            'parent_id': self.parent_id
        }

class Node(db.Model):
    __tablename__ = 'nodes'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    canvas_id = db.Column(db.String(36), db.ForeignKey('canvases.id', ondelete='CASCADE'), nullable=False)
    parent_node_id = db.Column(db.String(36), db.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=True)
    type = db.Column(db.String(50), nullable=False, default='paragraph')
    content = db.Column(db.Text, nullable=True)
    properties = db.Column(db.Text, nullable=True) # JSON string
    position = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sub_nodes = db.relationship('Node', backref=db.backref('parent_node', remote_side=[id]), cascade='all, delete-orphan')

    def set_properties(self, props_dict):
        self.properties = json.dumps(props_dict)

    def get_properties(self):
        return json.loads(self.properties) if self.properties else {}

    def to_dict(self):
        return {
            'id': self.id,
            'canvas_id': self.canvas_id,
            'parent_node_id': self.parent_node_id,
            'type': self.type,
            'content': self.content,
            'properties': self.get_properties(),
            'position': self.position
        }

class MatrixField(db.Model):
    __tablename__ = 'matrix_fields'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    matrix_canvas_id = db.Column(db.String(36), db.ForeignKey('canvases.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    config = db.Column(db.Text, nullable=True)
    position = db.Column(db.Float, nullable=False)

class MatrixValue(db.Model):
    __tablename__ = 'matrix_values'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    node_id = db.Column(db.String(36), db.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False)
    field_id = db.Column(db.String(36), db.ForeignKey('matrix_fields.id', ondelete='CASCADE'), nullable=False)
    value = db.Column(db.Text, nullable=True)
