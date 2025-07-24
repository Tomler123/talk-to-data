# routes/voice.py
import base64
from flask import Blueprint, request, jsonify
from extensions import db
from models import User

from utils.rbac import role_required

voice_bp = Blueprint('voice', __name__)

from flask_jwt_extended import jwt_required, get_jwt_identity

@voice_bp.route('/enroll/voice', methods=['POST'])
@jwt_required()
def enroll_voice():
    data = request.get_json()
    audio_b64 = data.get('audio')
    if not audio_b64:
        return jsonify({'message': 'audio is required'}), 400

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # decode and store raw audio; swap in embedding logic here
    raw = base64.b64decode(audio_b64)
    user.voice_profile = raw
    db.session.commit()

    return jsonify({'message': 'Enrollment successful'}), 201

# POST /voice/identify – compare incoming audio to enrolled profiles
@voice_bp.route('/identify', methods=['POST'])
@jwt_required()
def identify_voice():
    data = request.get_json()
    audio_b64 = data.get('audio')
    if not audio_b64:
        return jsonify({'message': 'audio is required'}), 400

    raw = base64.b64decode(audio_b64)

    # Simple byte‑equality matching for now
    user = User.query.filter_by(voice_profile=raw).first()
    if not user:
        return jsonify({'message': 'No matching voice profile'}), 404

    return jsonify({
        'message': 'User identified',
        'user': {
            'id': user.id,
            'username': user.username,
            'role': user.role.name
        }
    }), 200