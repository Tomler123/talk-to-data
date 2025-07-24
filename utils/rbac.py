from functools import wraps
from flask import g, jsonify

def role_required(*allowed_roles):
    """
    Decorator to restrict access to users whose g.current_user.role.name
    is in allowed_roles.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, 'current_user', None)
            if not user or user.role.name not in allowed_roles:
                return jsonify({'message': 'Forbidden: insufficient role'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
