from flask import Blueprint, jsonify, request, render_template
from models import db, Canvas, Node

routes_canvas = Blueprint('routes_canvas', __name__)

@routes_canvas.route('/')
def index():
    # Load the default To Do List canvas if it exists, otherwise just load the dashboard
    canvas = Canvas.query.filter_by(title='To Do List').first()
    nodes = []
    if canvas:
        nodes = Node.query.filter_by(canvas_id=canvas.id).order_by(Node.position).all()
    return render_template('index.html', canvas=canvas, nodes=[n.to_dict() for n in nodes])

@routes_canvas.route('/api/canvases', methods=['GET'])
def get_canvases():
    canvases = Canvas.query.filter_by(is_trashed=False).all()
    return jsonify([c.to_dict() for c in canvases])

@routes_canvas.route('/api/canvases/tree', methods=['GET'])
def get_canvas_tree():
    # Helper to recursively build tree
    def build_tree(parent_id=None):
        canvases = Canvas.query.filter_by(parent_id=parent_id, is_trashed=False).all()
        tree = []
        for c in canvases:
            c_dict = c.to_dict()
            c_dict['children'] = build_tree(c.id)
            tree.append(c_dict)
        return tree
    return jsonify(build_tree())

@routes_canvas.route('/api/canvases', methods=['POST'])
def create_canvas():
    data = request.get_json()
    canvas = Canvas(
        title=data.get('title', 'Untitled'),
        icon=data.get('icon'),
        parent_id=data.get('parent_id')
    )
    db.session.add(canvas)
    db.session.commit()
    return jsonify(canvas.to_dict())

@routes_canvas.route('/api/canvases/<canvas_id>', methods=['GET'])
def get_canvas(canvas_id):
    canvas = Canvas.query.get_or_404(canvas_id)
    nodes = Node.query.filter_by(canvas_id=canvas_id).order_by(Node.position).all()
    c_dict = canvas.to_dict()
    c_dict['nodes'] = [n.to_dict() for n in nodes]
    return jsonify(c_dict)

@routes_canvas.route('/api/nodes', methods=['POST'])
def create_node():
    data = request.get_json()
    node = Node(
        canvas_id=data['canvas_id'],
        type=data.get('type', 'paragraph'),
        content=data.get('content', ''),
        position=data.get('position', 0.0)
    )
    if 'properties' in data:
        node.set_properties(data['properties'])
    db.session.add(node)
    db.session.commit()
    return jsonify(node.to_dict())

@routes_canvas.route('/api/nodes/<node_id>', methods=['PUT'])
def update_node(node_id):
    node = Node.query.get_or_404(node_id)
    data = request.get_json()
    if 'content' in data:
        node.content = data['content']
    if 'properties' in data:
        props = node.get_properties()
        props.update(data['properties'])
        node.set_properties(props)
    db.session.commit()
    return jsonify(node.to_dict())

@routes_canvas.route('/api/nodes/<node_id>', methods=['DELETE'])
def delete_node(node_id):
    node = Node.query.get_or_404(node_id)
    db.session.delete(node)
    db.session.commit()
    return jsonify({'success': True})
