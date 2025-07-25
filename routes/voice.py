# routes/voice.py
import base64
from flask import Blueprint, request, jsonify
from extensions import db
from models import User, Voice

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

    # decode raw audio
    raw = base64.b64decode(audio_b64)

    # create a new Voice entry linked to this user
    voice_entry = Voice(
        user_id=user.id,
        audio_data=raw
    )
    db.session.add(voice_entry)
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

# GET /voice/users – list all users
@voice_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    from models import User
    users = User.query.all()
    return jsonify([
        {'id': u.id, 'username': u.username}
        for u in users
    ]), 200

# GET /voice/users/<user_id>/voices – list recordings for one user
@voice_bp.route('/users/<int:user_id>/voices', methods=['GET'])
@jwt_required()
def list_user_voices(user_id):
    from models import Voice
    import base64

    voices = Voice.query.filter_by(user_id=user_id).order_by(Voice.created_at).all()
    return jsonify([
        {
            'id': v.id,
            'created_at': v.created_at.isoformat(),
            'audio': base64.b64encode(v.audio_data).decode('utf-8')
        }
        for v in voices
    ]), 200

# DELETE /voice/voices/<voice_id> — remove a single voice entry
@voice_bp.route('/voices/<int:voice_id>', methods=['DELETE'])
@jwt_required()
def delete_voice(voice_id):
    from models import Voice

    voice = Voice.query.get(voice_id)
    if not voice:
        return jsonify({'message': 'Voice not found'}), 404

    db.session.delete(voice)
    db.session.commit()
    return jsonify({'message': 'Voice deleted'}), 200