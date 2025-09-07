import base64
import json
import math
import traceback
from flask import Blueprint, request, jsonify, abort
from models import AuditLog, User, Voice, VoicePhrase, db
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, create_access_token
from voice_service import extract_embedding, transcribe_and_match
from rbac import roles_required
import numpy as np
import datetime

voice_bp = Blueprint('voice', __name__)

# List all users in the dropdown list
@voice_bp.route('/users', methods=['GET'])
@jwt_required()
@roles_required('admin')
def list_users():
    users = User.query.order_by(User.username).all()
    return jsonify([{
        'id': u.id,
        'username': u.username
    } for u in users]), 200

@voice_bp.route('/my-voices', methods=['POST'])
@jwt_required()
@roles_required('admin', 'data analyst', 'business user', 'viewer')
def add_voice():
    """
    Free‐form: allow a user to upload one arbitrary recording (no phrase matching).
    """
    data = request.get_json() or {}
    audio_b64 = data.get('audio')
    if not audio_b64:
        return jsonify({'message': 'audio field is required'}), 400

    # decode base64
    try:
        raw = base64.b64decode(audio_b64)
    except Exception:
        return jsonify({'message': 'Invalid base64 audio'}), 400

    # extract embedding
    try:
        emb = extract_embedding(raw)
    except Exception:
        traceback.print_exc()
        return jsonify({'message': 'Error extracting embedding'}), 500

    # save to DB
    current = get_jwt_identity()
    v = Voice(
        user_id     = current,
        audio_data  = raw,
        embedding   = emb,
        created_at  = datetime.datetime.utcnow()
    )
    db.session.add(v)
    db.session.commit()

    return jsonify({
        'id':         v.id,
        'created_at': v.created_at.isoformat()
    }), 201

# Get all voices from ONE user
@voice_bp.route('/users/<user_id>/voices', methods=['GET'])
@jwt_required()
@roles_required('admin','data analyst', 'business user', 'viewer')
def get_user_voices(user_id):
    # ensure user exists
    if user_id == 'me':
        user_id = get_jwt_identity()
    if not User.query.get(user_id):
        abort(404, description="User not found")

    claims   = get_jwt()
    current  = get_jwt_identity()
    # non-admins can only see their own voices
    if claims.get("role") != "admin" and current != user_id:
        abort(403, description="Access denied")

    vs = Voice.query\
        .filter_by(user_id=user_id)\
        .order_by(Voice.created_at.desc())\
        .all()
    return jsonify([{
        'id': v.id,
        'created_at': v.created_at.isoformat(),
        'audio': base64.b64encode(v.audio_data).decode('utf-8')
    } for v in vs]), 200

# Delete one voice from the database
@voice_bp.route('/voices/<int:voice_id>', methods=['DELETE'])
@jwt_required()
@roles_required("admin", "data analyst", "business user", "viewer")
def delete_voice(voice_id):
    v: Voice = Voice.query.get(voice_id)
    if not v:
        abort(404, description="Recording not found")

    claims  = get_jwt()
    current = get_jwt_identity()
    # non-admins can only delete their own recordings
    if claims.get("role") != "admin" and v.user_id != current:
        abort(403, description="Access denied")

    db.session.delete(v)
    db.session.commit()
    return '', 204

@voice_bp.route('/enroll', methods=['POST'])
@jwt_required()
@roles_required("admin", "data analyst", "business user")
def enroll_voice():
    """
    Enroll the **current** logged‑in user. Expects 3 recordings:
      { recordings: [ { phrase_id, audio }, … ] }
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json() or {}
    recs = data.get('recordings')
    if not isinstance(recs, list) or len(recs) != 3:
        return jsonify({'message': 'Exactly 3 recordings required'}), 400

    embeddings = []
    for rec in recs:
        phrase = VoicePhrase.query.get(rec.get('phrase_id'))
        if not phrase:
            return jsonify({'message': f'Phrase {rec.get("phrase_id")} invalid'}), 400

        audio_b64 = rec.get('audio')
        if not audio_b64:
            return jsonify({'message': 'Missing audio for a phrase'}), 400

        raw = base64.b64decode(audio_b64)
        emb = extract_embedding(raw)
        voice = Voice(user_id=user.id, audio_data=raw, embedding=emb)
        db.session.add(voice)
        embeddings.append(emb)

    # average the embeddings
    avg_emb = [sum(vals)/len(vals) for vals in zip(*embeddings)]
    user.voice_profile = json.dumps(avg_emb).encode('utf-8')

    db.session.commit()
    log = AuditLog(
        user_id=current_user_id,
        action='voice_enroll',
        details={'recordings_count': len(recs)}
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Enrollment complete'}), 201

@voice_bp.route('/phrases', methods=['GET'])
def list_voice_phrases():
    phrases = VoicePhrase.query.order_by(VoicePhrase.id).all()
    return jsonify([
        {'id': p.id, 'text': p.text}
        for p in phrases
    ]), 200

@voice_bp.route('/verify', methods=['POST'])
def verify_voice_phrase():
    """
    Verify that the recording matches the target phrase.
    Expects:
      { "phrase_id": 1, "audio": "<base64‑webm>" }
    Returns:
      { transcript: string, score: number (0–1), match: boolean }
    """
    data = request.get_json() or {}
    pid = data.get('phrase_id')
    audio_b64 = data.get('audio')
    if pid is None or audio_b64 is None:
        return jsonify({'message': 'phrase_id and audio are required'}), 400

    phrase = VoicePhrase.query.get(pid)
    if not phrase:
        return jsonify({'message': f'Phrase {pid} not found'}), 404

    try:
        raw = base64.b64decode(audio_b64)
    except Exception:
        return jsonify({'message': 'Invalid base64 audio'}), 400

    try:
        transcript, score, match = transcribe_and_match(raw, phrase.text)
    except Exception:
        traceback.print_exc()
        return jsonify({'message': 'Error during verification'}), 500

    log = AuditLog(
        user_id=None,  # unknown until login, or you could require jwt here
        action='phrase_verify',
        details={'phrase_id': pid, 'score': score, 'match': match}
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'transcript': transcript,
        'score': score,
        'match': match
    }), 200

@voice_bp.route('/identify', methods=['POST'])
@jwt_required()
def identify_voice():
    """
    Identify which enrolled user best matches the submitted audio.
    Expects JSON: { "audio": "<base64‑webm>" }
    Returns 200:
      { user: { id, username, role }, confidence: float }
    401 if no match above threshold.
    """
    data = request.get_json() or {}
    audio_b64 = data.get('audio')
    if not audio_b64:
        return jsonify({'message': 'audio field is required'}), 400

    # decode
    try:
        raw = base64.b64decode(audio_b64)
    except Exception:
        return jsonify({'message': 'Invalid base64 audio'}), 400

    # get embedding for the probe
    try:
        probe_emb = extract_embedding(raw)
    except Exception:
        traceback.print_exc()
        return jsonify({'message': 'Error extracting embedding'}), 500

    # find best match via cosine similarity
    best_user = None
    best_conf = -1.0
    probe_arr = np.array(probe_emb, dtype=float)
    probe_norm = np.linalg.norm(probe_arr) + 1e-8
    for user in User.query.filter(User.voice_profile.isnot(None)).all():
        try:
            profile = np.array(json.loads(user.voice_profile.decode('utf-8')), dtype=float)
        except Exception:
            continue

        # cosine similarity = dot / (||a|| * ||b||)
        cos_sim = float(np.dot(probe_arr, profile) / (probe_norm * (np.linalg.norm(profile) + 1e-8)))
        if cos_sim > best_conf:
            best_conf, best_user = cos_sim, user

    if best_user is None:
        return jsonify({'message': 'No enrolled users found'}), 404

    if best_conf < 0.5:
        return jsonify({'message': 'No matching user', 'confidence': best_conf}), 401

    log = AuditLog(
        user_id=best_user.id,
        action='voice_identify',
        details={'confidence': best_conf}
    )
    
    db.session.add(log)
    db.session.commit()

    now_iso = datetime.datetime.utcnow().isoformat()
    token = create_access_token(
        identity=str(best_user.id),
        additional_claims={
            'role': best_user.role.lower(),
            'username': best_user.username,
            'voice_verified_at': now_iso
        }
    )
    return jsonify({
        'access_token': token,
        'user': {
            'id':       best_user.id,
            'username': best_user.username,
            'role':     best_user.role
        },
        'confidence': best_conf
    }), 200