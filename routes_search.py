from flask import Blueprint, jsonify
from database import db

routes_search = Blueprint('routes_search', __name__)

@routes_search.route('/api/search', methods=['GET'])
def search_fts():
    from flask import request
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    # Query FTS5 table
    sql = """
        SELECT f.node_id, f.canvas_id, f.content, c.title, c.icon 
        FROM fts_nodes f
        JOIN canvases c ON f.canvas_id = c.id
        WHERE fts_nodes MATCH :query
        LIMIT 20
    """
    
    results = db.session.execute(db.text(sql), {"query": query}).fetchall()
    
    response = []
    for row in results:
        response.append({
            'node_id': row[0],
            'canvas_id': row[1],
            'snippet': row[2],
            'canvas_title': row[3],
            'icon': row[4]
        })
    return jsonify(response)
