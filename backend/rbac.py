from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from functools import wraps

def roles_required(*allowed_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role", "").lower()
            allowed = [r.lower() for r in allowed_roles]
            if user_role not in allowed:
                return jsonify({"msg": "Access denied"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper