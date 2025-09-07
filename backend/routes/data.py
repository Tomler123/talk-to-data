from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from rbac import roles_required
import pandas  as pd


data_bp = Blueprint("data", __name__)

@data_bp.route("/upload", methods=["POST"])
@jwt_required()
@roles_required("admin", "data_analyst")
def upload_data():
    if 'file' not in request.files:
        return jsonify(msg="No file uploaded"), 400

    file = request.files['file']
    filename = file.filename
    if not filename.endswith('.csv'):
        return jsonify(msg="Only CSV files allowed"), 400

    import pandas as pd
    df = pd.read_csv(file)

    # df.to_csv(f"uploads/{filename}", index=False)

    return jsonify(msg=f"Uploaded {filename} with {len(df)} rows"), 200

@data_bp.route("/query", methods=["POST"])
@jwt_required()
@roles_required("admin", "data_analyst", "business_user")
def query_data():
    return jsonify(result="Query executed.")

@data_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@roles_required("admin", "data_analyst", "business_user", "viewer")
def view_dashboard():
    return jsonify(dashboard="Dashboard content.")

@data_bp.route("/admin/settings", methods=["GET"])
@jwt_required()
@roles_required("admin")
def admin_settings():
    return jsonify(settings="for System config and AI tuning.")

@data_bp.route("/logs", methods=["GET"])
@jwt_required()
@roles_required("admin", "data_analyst")
def view_logs():
    return jsonify(logs="Audit logs go here.")