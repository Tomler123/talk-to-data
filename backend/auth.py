from flask import request, jsonify, Blueprint
from models import db, User, AuditLog
from flask_jwt_extended import create_access_token
import base64, io, json, numpy as np
from voice_service import extract_embedding
from flask_jwt_extended import jwt_required, get_jwt_identity
from rbac import roles_required
import datetime

# auth_bp = Blueprint("auth", __name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        now_iso = datetime.datetime.utcnow().isoformat()
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'role': user.role.lower(),
                'username': user.username,
                'voice_verified_at': now_iso
            }
        )
        log = AuditLog(
            user_id=user.id,
            action='login',
            details={'method': 'password'}
        )
        db.session.add(log)
        db.session.commit()
        return  jsonify(access_token=access_token),  200
    return jsonify(msg="Bad credentials"), 401

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
@roles_required("admin")
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify(msg="Invalid or missing JSON payload"), 400

    # Validate required fields
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if not all([username, password, role]):
        return jsonify(msg="Username, password, and role are required"), 400

    if User.query.filter_by(username=username).first():
        return jsonify(msg="User already exists"), 409
    
    new_user = User(username=username, role=role.lower())
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify(msg="User created successfully"), 201

@auth_bp.route('/login/voice', methods=['POST'])
def login_voice():
    data = request.get_json()
    phrase_id = data.get('phrase_id')
    audio_b64 = data.get('audio')
    if phrase_id is None or not audio_b64:
        return jsonify(msg="phrase_id and audio are required"), 400

    # decode base64 (allow data: URI or raw)
    header, b64 = audio_b64.split(',', 1) if ',' in audio_b64 else ("", audio_b64)
    webm_bytes = base64.b64decode(b64)

    # extract ECAPA-TDNN embedding
    try:
        probe_emb = extract_embedding(webm_bytes)
    except Exception as e:
        return jsonify(msg="Embedding extraction failed", error=str(e)), 500

    # find best cosine-similarity match
    probe_arr = np.array(probe_emb, dtype=float)
    probe_norm = np.linalg.norm(probe_arr) + 1e-8
    best_user, best_conf = None, -1.0

    for user in User.query.filter(User.voice_profile.isnot(None)).all():
        try:
            profile = np.array(json.loads(user.voice_profile.decode('utf-8')), dtype=float)
        except Exception:
            continue
        cos_sim = float(np.dot(probe_arr, profile) /
                        (probe_norm * (np.linalg.norm(profile) + 1e-8)))
        if cos_sim > best_conf:
            best_conf, best_user = cos_sim, user

    if best_user is None:
        return jsonify(message="No enrolled users", confidence=0), 404

    # threshold = 0.6
    # if best_conf < 0.6:
    if best_conf < 0.5:
        return jsonify(message="No matching user", confidence=best_conf), 401

    # success → issue JWT
    token = create_access_token(
        identity=str(best_user.id),
        additional_claims={
            "role": best_user.role.lower(),
            "username": best_user.username
        }
    )
    log = AuditLog(
        user_id=best_user.id,
        action='login_voice',
        details={'phrase_id': phrase_id, 'confidence': best_conf}
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(access_token=token, confidence=best_conf), 200