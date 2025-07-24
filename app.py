from flask import Flask, jsonify, request
from flask_cors import CORS
# from sqlalchemy import text
from dotenv import load_dotenv
import os
from extensions import db
from werkzeug.security import generate_password_hash
from models import Role, User
from flask_jwt_extended import JWTManager, create_access_token

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret')
jwt = JWTManager(app)

from models import Role, User

from routes.auth import auth_bp
from routes.db import db_bp
from routes.voice import voice_bp

app.register_blueprint(db_bp)
# app.register_blueprint(db_bp, url_prefix='/db-test')
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(voice_bp, url_prefix='/voice')

def create_tables():
    # Only create missing tables – do NOT drop existing data
    db.create_all()

    for role_name in ['Admin', 'Data Analyst', 'Business User', 'Viewer']:
        if not Role.query.filter_by(name=role_name).first():
            db.session.add(Role(name=role_name))

    # Seed an initial admin user if none exists
    from werkzeug.security import generate_password_hash
    if not User.query.filter_by(username='admin').first():
        admin_role = Role.query.filter_by(name='Admin').first()
        admin = User(
            username='admin',
            password_hash=generate_password_hash('password')
        )
        admin.role = admin_role
        db.session.add(admin)

    db.session.commit()

if __name__ == '__main__':   # at the bottom of app.py
    # ensure tables exist before handling any requests
    with app.app_context():
        create_tables()
    app.run(debug=True)