# routes/auth.py
from utils.rbac import role_required
from flask_jwt_extended import create_access_token, jwt_required
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import User, Role

auth_bp = Blueprint('auth', __name__)

# @auth_bp.route('/login', methods=['POST'])
# def login():
#     data = request.get_json()
#     username = data.get('username')
#     password = data.get('password')
#     if username and password:
#         return jsonify({'message': 'Login successful'}), 200
#     return jsonify({'message': 'Missing credentials'}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(data.get('password')):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'role': user.role.name
        }
    }), 200

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
@role_required('Admin')
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role_name = data.get('role')
    if not all([username, password, role_name]):
        return jsonify({'message': 'Username, password, and role are required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already taken'}), 409
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({'message': 'Invalid role'}), 400
    pw_hash = generate_password_hash(password)
    new_user = User(username=username, password_hash=pw_hash, role=role)
    db.session.add(new_user)
    db.session.commit()
    # return jsonify({'message': 'User registered successfully'}), 201
    # Return the new user’s ID, username, and role
    return jsonify({
        'id': new_user.id,
        'username': new_user.username,
        'role': new_user.role.name
    }), 201
