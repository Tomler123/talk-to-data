from extensions import db
from sqlalchemy.dialects.postgresql import BYTEA
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import LargeBinary
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    # back‑ref from User.role
    users = db.relationship('User', back_populates='role')

    def __repr__(self):
        return f"<Role {self.name}>"

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    # voice_profile = db.Column(BYTEA, nullable=True)  # stores voice‑embedding blob
    voice_profile = db.Column(LargeBinary)
    # relationship to Role
    role = db.relationship('Role', back_populates='users')
    # relationship to multiple voice recordings
    voices = db.relationship(
        'Voice',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    # password helpers
    def set_password(self, password: str) -> None:
        """Hash & store the given plaintext password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    @property
    def role_name(self) -> str:
        """Convenience alias for JWT claims."""
        return self.role.name
    
    def __repr__(self):
        return f"<User {self.username} ({self.role.name})>"


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