from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from .database import Base


class App(Base):
    __tablename__ = "apps"

    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(String(50), unique=True, nullable=False, index=True)
    app_name = Column(String(200), nullable=False)
    platform = Column(String(20), nullable=False)  # Web / App / Database

    app_owner = Column(String(150), nullable=False)
    app_owner_email = Column(String(200), nullable=False)
    platform_owner = Column(String(150), nullable=False)
    platform_owner_email = Column(String(200), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    components = relationship(
        "Component", back_populates="app", cascade="all, delete-orphan", order_by="Component.id"
    )


class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("apps.id", ondelete="CASCADE"), nullable=False, index=True)

    component_type = Column(String(20), nullable=False)  # Application / Database / OS
    tech_name = Column(String(100), nullable=False)       # e.g. Java, PostgreSQL, RHEL
    version = Column(String(50), nullable=True)

    eol_date = Column(Date, nullable=False)
    extended_support_date = Column(Date, nullable=True)

    upgrade_plan = Column(Text, nullable=True)
    upgrade_target_date = Column(Date, nullable=True)

    app = relationship("App", back_populates="components")


class TechCatalog(Base):
    """The organization's approved technology list: one row per
    component_type/tech_name/version combination, with its vendor-published
    support dates. Components can be created by picking an entry here so the
    EOS/extended dates (and resulting RAG+Blue status) are populated from a
    single source of truth instead of retyped by hand each time."""

    __tablename__ = "tech_catalog"
    __table_args__ = (UniqueConstraint("component_type", "tech_name", "version", name="uq_catalog_entry"),)

    id = Column(Integer, primary_key=True, index=True)
    component_type = Column(String(20), nullable=False)  # Application / Database / OS
    tech_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)

    eoss_date = Column(Date, nullable=False)   # End of Standard Support
    eoes_date = Column(Date, nullable=True)    # End of Extended Support

    notes = Column(String(300), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
