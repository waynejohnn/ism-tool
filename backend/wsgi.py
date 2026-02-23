"""
WSGI entry point for production use with Gunicorn.
This file is used by the Gunicorn application server.
"""

from app import app, init_db

# Initialize database on startup
init_db()

if __name__ == "__main__":
    app.run()
