from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy import LargeBinary
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime


db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='viewer')

    voice_profile = db.Column(LargeBinary)

    voices = db.relationship(
        'Voice',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Voice(db.Model):
    __tablename__ = 'voices'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # raw audio blob (e.g. your base64‑decoded webm bytes)
    audio_data = db.Column(LargeBinary, nullable=False)
    # optional embedding vector (filled in later)
    embedding = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # back‑ref to its owner
    user = db.relationship('User', back_populates='voices')

class VoicePhrase(db.Model):
    __tablename__ = 'voice_phrases'
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(256), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id         = db.Column(db.Integer,   primary_key=True)
    user_id    = db.Column(db.Integer,   db.ForeignKey('users.id'), nullable=True)
    action     = db.Column(db.String(64), nullable=False)
    timestamp  = db.Column(db.DateTime,  default=datetime.utcnow, nullable=False)
    details    = db.Column(JSON,         nullable=True)

    user = db.relationship('User', backref='audit_logs')
