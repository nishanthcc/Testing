import sqlite3
from sqlalchemy import event
from sqlalchemy.engine import Engine
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Ensure foreign key constraints are enabled for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if type(dbapi_connection) is sqlite3.Connection:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def setup_fts_and_triggers(app):
    """Initializes FTS5 virtual tables and auto-sync triggers."""
    with app.app_context():
        # Get raw SQLite connection
        engine = db.engine
        with engine.begin() as conn:
            # 1. Create FTS5 Table
            conn.exec_driver_sql("""
                CREATE VIRTUAL TABLE IF NOT EXISTS fts_nodes USING fts5(
                    node_id UNINDEXED,
                    canvas_id UNINDEXED,
                    content,
                    tokenize='porter ascii'
                );
            """)
            
            # 2. Auto-Triggers for FTS5 Sync
            conn.exec_driver_sql("""
                CREATE TRIGGER IF NOT EXISTS nodes_ai AFTER INSERT ON nodes BEGIN
                  INSERT INTO fts_nodes(node_id, canvas_id, content) VALUES (new.id, new.canvas_id, new.content);
                END;
            """)
            
            conn.exec_driver_sql("""
                CREATE TRIGGER IF NOT EXISTS nodes_ad AFTER DELETE ON nodes BEGIN
                  DELETE FROM fts_nodes WHERE node_id = old.id;
                END;
            """)
            
            conn.exec_driver_sql("""
                CREATE TRIGGER IF NOT EXISTS nodes_au AFTER UPDATE ON nodes BEGIN
                  UPDATE fts_nodes SET content = new.content WHERE node_id = new.id;
                END;
            """)
