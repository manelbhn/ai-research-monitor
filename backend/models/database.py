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

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)