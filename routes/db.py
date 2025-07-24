# routes/db.py
from flask import Blueprint, jsonify
from sqlalchemy import text
from extensions import db

db_bp = Blueprint('db', __name__)

@db_bp.route('/ping')
def ping():
    return 'pong', 200

@db_bp.route('/db-test')
def db_test():
    try:
        db.session.execute(text('SELECT 1'))
        return 'Database connected', 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
