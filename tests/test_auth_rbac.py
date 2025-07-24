import json
import pytest
from app import create_app, jwt
from models import db, Role, User

@pytest.fixture
def client():
    app = create_app()
    app.config.update({
        'TESTING': True,
        'JWT_SECRET_KEY': 'your_super_secret_key',  # same as in your app
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'
    })
    with app.app_context():
        db.init_app(app)
        db.create_all()
        # seed roles
        admin_role = Role(name='Admin')
        user_role = Role(name='User')
        db.session.add_all([admin_role, user_role])
        db.session.commit()
        # create one admin and one normal user
        admin = User(username='admin')
        admin.set_password('adminpass')
        admin.role = admin_role
        user = User(username='user')
        user.set_password('userpass')
        user.role = user_role
        db.session.add_all([admin, user])
        db.session.commit()
        yield app.test_client()
        db.drop_all()

def get_token(client, email, password):
    resp = client.post('/auth/login',
                       data=json.dumps({'username': email, 'password': password}),
                       content_type='application/json')
    return json.loads(resp.data)['access_token']

def test_admin_can_register(client):
    token = get_token(client, 'admin', 'adminpass')
    resp = client.post('/auth/register',
                       headers={'Authorization': f'Bearer {token}'},
                       data=json.dumps({
                         'username': 'newuser',
                         'password': 'newpass',
                         'role': 'User'
                       }),
                       content_type='application/json')
    print(resp.status_code, resp.get_json())
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data['username'] == 'newuser'
    assert data['role'] == 'User'

def test_user_cannot_register(client):
    token = get_token(client, 'user', 'userpass')
    resp = client.post('/auth/register',
                       headers={'Authorization': f'Bearer {token}'},
                       data=json.dumps({
                         'username': 'hack',
                         'password': 'hackpass',
                         'role': 'User'
                       }),
                       content_type='application/json')
    assert resp.status_code == 403
    assert b'insufficient role' in resp.data
