# simple dummy authentication module
from datetime import datetime, timedelta, timezone
from jose import jwt


SECRET = "dev-secret-change-me"
ALGORITHM = "HS256"


# Dummy users: username -> password (plain for now)
DUMMY_USERS = {
"planner": "password123",
"researcher": "password123",
}




def authenticate_user(username: str, password: str):
    if username in DUMMY_USERS and DUMMY_USERS[username] == password:
        return True
    return False




def create_access_token(data: dict, expires_delta: int = 60*60):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_delta)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)
    return encoded_jwt