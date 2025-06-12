
from app.database import engine, Base
import app.models  # чтобы SQLAlchemy „увидел“ все модели

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created")

if __name__ == "__main__":
    init_db()