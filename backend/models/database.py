from sqlalchemy import create_engine, Column, Integer, Text
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine("sqlite:///papers.db")

Base = declarative_base()

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True)
    paper_id = Column(Text)
    title = Column(Text)
    abstract = Column(Text)
    authors = Column(Text)
    date = Column(Text)
    pdf = Column(Text)
    source = Column(Text)
    citation_count = Column(Integer)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    hashed_password = Column(Text, nullable=False)
    created_at = Column(Text, nullable=False)


Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)