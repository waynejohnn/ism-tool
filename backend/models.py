from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)  # Hashed password for authentication
    role: Mapped[str] = mapped_column(String, nullable=False)  # "Admin", "Reviewer", "Read Only"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FilterOption(Base):
    __tablename__ = "filter_options"

    option_id: Mapped[str] = mapped_column(String, primary_key=True)
    category: Mapped[str] = mapped_column(String, nullable=False)  # "TargetYear", "CapabilityCategory", "ExecutiveSponsor", "Status"
    value: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0)
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UseCase(Base):
    __tablename__ = "use_cases"

    use_case_id: Mapped[str] = mapped_column(String, primary_key=True)
    use_case_number: Mapped[int | None] = mapped_column(nullable=True, unique=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    business_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    strategic_theme: Mapped[str | None] = mapped_column(String, nullable=True)
    strategic_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    capability_areas: Mapped[str | None] = mapped_column(String, nullable=True)
    target_year: Mapped[str | None] = mapped_column(String, nullable=True)
    requestor: Mapped[str | None] = mapped_column(String, nullable=True)
    sponsor: Mapped[str | None] = mapped_column(String, nullable=True)
    technical_sponsor: Mapped[str | None] = mapped_column(String, nullable=True)
    executive_sponsor: Mapped[str | None] = mapped_column(String, nullable=True)
    stakeholders: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="Intake")
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    assigned_coe_id: Mapped[str | None] = mapped_column(String, nullable=True)
    outcomes_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    na_value: Mapped[bool] = mapped_column(Boolean, default=False)
    na_feasibility: Mapped[bool] = mapped_column(Boolean, default=False)
    na_org_capability: Mapped[bool] = mapped_column(Boolean, default=False)
    na_strategic: Mapped[bool] = mapped_column(Boolean, default=False)
    na_value_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    na_feasibility_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    na_org_capability_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    na_strategic_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    na_reviewer_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    na_technical_initiative: Mapped[bool] = mapped_column(Boolean, default=False)

    scores: Mapped[list[Score]] = relationship("Score", back_populates="use_case")
    totals: Mapped[Totals | None] = relationship("Totals", back_populates="use_case", uselist=False)
    sessions: Mapped[list[ReviewSession]] = relationship("ReviewSession", back_populates="use_case")


class Criterion(Base):
    __tablename__ = "criteria"

    criterion_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    dimension: Mapped[str] = mapped_column(String, nullable=False)
    polarity: Mapped[str] = mapped_column(String, nullable=False)
    guidance_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    scores: Mapped[list[Score]] = relationship("Score", back_populates="criterion")


class Score(Base):
    __tablename__ = "scores"

    score_id: Mapped[str] = mapped_column(String, primary_key=True)
    use_case_id: Mapped[str] = mapped_column(ForeignKey("use_cases.use_case_id"))
    criterion_id: Mapped[str] = mapped_column(ForeignKey("criteria.criterion_id"))
    rater_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    round: Mapped[str] = mapped_column(String, default="Initial")
    raw_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_na: Mapped[bool] = mapped_column(Boolean, default=False)
    na_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    use_case: Mapped[UseCase] = relationship("UseCase", back_populates="scores")
    criterion: Mapped[Criterion] = relationship("Criterion", back_populates="scores")


class Totals(Base):
    __tablename__ = "totals"

    use_case_id: Mapped[str] = mapped_column(ForeignKey("use_cases.use_case_id"), primary_key=True)
    s_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_feasibility: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_org_capability: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_strategic: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_composite: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_fc: Mapped[float | None] = mapped_column(Float, nullable=True)
    priority: Mapped[str | None] = mapped_column(String, nullable=True)
    quadrant: Mapped[str | None] = mapped_column(String, nullable=True)
    last_computed_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    use_case: Mapped[UseCase] = relationship("UseCase", back_populates="totals")


class ReviewSession(Base):
    __tablename__ = "review_sessions"

    session_id: Mapped[str] = mapped_column(String, primary_key=True)
    use_case_id: Mapped[str] = mapped_column(ForeignKey("use_cases.use_case_id"))
    assigned_coe_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="In Review")
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    use_case: Mapped[UseCase] = relationship("UseCase", back_populates="sessions")
    invites: Mapped[list[ReviewInvite]] = relationship("ReviewInvite", back_populates="session")
    comments: Mapped[list[ReviewComment]] = relationship("ReviewComment", back_populates="session")


class ReviewInvite(Base):
    __tablename__ = "review_invites"

    invite_id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("review_sessions.session_id"))
    token: Mapped[str] = mapped_column(Text, nullable=False)
    expires_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    can_edit: Mapped[bool] = mapped_column(Boolean, default=True)
    role_hint: Mapped[str | None] = mapped_column(String, nullable=True)

    session: Mapped[ReviewSession] = relationship("ReviewSession", back_populates="invites")


class ReviewComment(Base):
    __tablename__ = "review_comments"

    comment_id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("review_sessions.session_id"))
    author_hint: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[ReviewSession] = relationship("ReviewSession", back_populates="comments")
