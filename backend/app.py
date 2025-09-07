from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.data import data_bp
from routes.admin import admin_bp
from auth import auth_bp
from routes.voice import voice_bp
import os
from dotenv import load_dotenv
from models import User, db, VoicePhrase
from werkzeug.security import generate_password_hash
load_dotenv()

app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db.init_app(app)

jwt =JWTManager(app)

CORS(app)

app.register_blueprint(data_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(voice_bp, url_prefix='/voice')
app.register_blueprint(admin_bp)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

with app.app_context():
    # db.drop_all()
    # print("Dropped tables")

    db.create_all()

    if VoicePhrase.query.count() == 0:
        phrases = [
            "My voice is my password",
            "Open sesame",
            "Authenticate me by voice"
        ]
        for text in phrases:
            db.session.add(VoicePhrase(text=text))
        db.session.commit()

    if not User.query.filter_by(username="admin").first():
        new_admin = User(username='admin', role='admin')
        new_admin.set_password('admin123')
        
        db.session.add(new_admin)


    if not User.query.filter_by(username="viewer").first():
        new_user = User(username='viewer', role='viewer')
        new_user.set_password('viewer123')
        
        db.session.add(new_user)

    db.session.commit()

    print("Created tables:", db.metadata.tables.keys())

if __name__ == "__main__":
    app.run(debug=True)