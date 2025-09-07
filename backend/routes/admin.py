from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import AuditLog, User, db
from rbac import roles_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

ALLOWED_ROLES = ['admin', 'data analyst', 'business user', 'viewer']

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@roles_required('admin')
def list_users():
    page = int(request.args.get('page',  1))
    per_page = int(request.args.get('per_page', 50))
    
    filters = {
        'id':       request.args.get('id', '').strip(),
        'username': request.args.get('username', '').strip(),
        'role':     request.args.get('role', '').strip(),
    }
    
    query = User.query

    if filters['id']:
        try:
            query = query.filter(User.id == int(filters['id']))
        except ValueError:
            return jsonify({'msg': 'Invalid id parameter'}), 400

    if filters['username']:
        query = query.filter(User.username.ilike(f"%{filters['username']}%"))

    if filters['role']:
        query = query.filter(User.role == filters['role'])

    query = query.order_by(User.id)
    paged = query.paginate(page=page, per_page=per_page, error_out=False)

    users = [
        {'id': u.id, 'username': u.username, 'role': u.role}
        for u in paged.items
    ]

    return jsonify({
        'users': users,
        'total': paged.total,
        'page':  paged.page,
        'pages': paged.pages
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['PATCH'])
@jwt_required()
@roles_required('admin')
def update_user_role(user_id):
    data = request.get_json() or {}
    new_role = data.get('role')
    if not new_role:
        return jsonify({'msg': 'Missing role field'}), 400

    if new_role not in ALLOWED_ROLES:
        return jsonify({'msg': f'Invalid role: must be one of {ALLOWED_ROLES}'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    if user.role == new_role:
        return jsonify({'msg': 'Role unchanged'}), 409

    user.role = new_role
    db.session.commit()

    return jsonify({
        'id':       user.id,
        'username': user.username,
        'role':     user.role
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@roles_required('admin')
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({'msg': f'User {user.username} deleted'}), 200

@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@roles_required('admin')
def list_audit_logs():
    # pagination params
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    filters = {
        'id':       request.args.get('id', '').strip(),
        'user_id':  request.args.get('user_id', '').strip(),
        'username': request.args.get('username', '').strip(),
        'action':   request.args.get('action', '').strip(),
    }

    query = AuditLog.query
    # Exact ID
    if filters['id']:
        query = query.filter(AuditLog.id == int(filters['id']))
    # Exact user_id
    if filters['user_id']:
        query = query.filter(AuditLog.user_id == int(filters['user_id']))
    # Partial username (case-insensitive)
    if filters['username']:
        query = query.join(User).filter(User.username.ilike(f"%{filters['username']}%"))
    # Partial action
    if filters['action']:
        query = query.filter(AuditLog.action.ilike(f"%{filters['action']}%"))
    # Then apply ordering & pagination
    query = query.order_by(AuditLog.timestamp.desc())
    paged = query.paginate(page=page, per_page=per_page, error_out=False)

    items = [{
        'id': a.id,
        'user_id': a.user_id,
        'username': a.user.username if a.user else None,
        'action': a.action,
        'timestamp': a.timestamp.isoformat(),
        'details': a.details
    } for a in paged.items]

    return jsonify({
        'logs': items,
        'total': paged.total,
        'page': paged.page,
        'pages': paged.pages
    }), 200
