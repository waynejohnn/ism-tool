from __future__ import annotations

import uuid
from sqlalchemy import select
from werkzeug.security import generate_password_hash

from db import SessionLocal, engine, Base
from models import Criterion, User, FilterOption


CRITERIA = [
    ("C01", "Value Criterion 1", "Value", "BENEFIT"),
    ("C02", "Value Criterion 2", "Value", "BENEFIT"),
    ("C03", "Value Criterion 3", "Value", "BENEFIT"),
    ("C04", "Value Criterion 4", "Value", "BENEFIT"),
    ("C05", "Value Criterion 5", "Value", "BENEFIT"),
    ("C06", "Value Criterion 6", "Value", "BENEFIT"),
    ("C07", "Value Criterion 7", "Value", "BENEFIT"),
    ("C08", "Feasibility Criterion 1", "Feasibility", "BENEFIT"),
    ("C09", "Feasibility Criterion 2", "Feasibility", "BENEFIT"),
    ("C10", "Feasibility Criterion 3", "Feasibility", "COST"),
    ("C11", "Feasibility Criterion 4", "Feasibility", "BENEFIT"),
    ("C12", "Feasibility Criterion 5", "Feasibility", "COST"),
    ("C13", "Feasibility Criterion 6", "Feasibility", "BENEFIT"),
    ("C14", "Feasibility Criterion 7", "Feasibility", "BENEFIT"),
    ("C15", "Organizational Criterion 1", "Organizational", "BENEFIT"),
    ("C16", "Organizational Criterion 2", "Organizational", "BENEFIT"),
    ("C17", "Organizational Criterion 3", "Organizational", "COST"),
    ("C18", "Organizational Criterion 4", "Organizational", "BENEFIT"),
    ("C19", "Organizational Criterion 5", "Organizational", "BENEFIT"),
    ("C20", "Organizational Criterion 6", "Organizational", "COST"),
    ("C21", "Organizational Criterion 7", "Organizational", "BENEFIT"),
    ("C22", "Strategic Criterion 1", "Strategic", "BENEFIT"),
    ("C23", "Strategic Criterion 2", "Strategic", "BENEFIT"),
    ("C24", "Strategic Criterion 3", "Strategic", "BENEFIT"),
    ("C25", "Strategic Criterion 4", "Strategic", "BENEFIT"),
    ("C26", "Strategic Criterion 5", "Strategic", "COST"),
    ("C27", "Strategic Criterion 6", "Strategic", "BENEFIT"),
    ("C28", "Strategic Criterion 7", "Strategic", "BENEFIT"),
]


def seed():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        # Seed criteria
        existing = session.execute(select(Criterion)).scalars().first()
        if not existing:
            print("Seeding criteria...")
            for order, (cid, name, dimension, polarity) in enumerate(CRITERIA, start=1):
                session.add(
                    Criterion(
                        criterion_id=cid,
                        name=name,
                        dimension=dimension,
                        polarity=polarity,
                        display_order=order,
                        guidance_text="Replace with Appendix A guidance text.",
                    )
                )
            session.commit()

        # Seed users
        existing_users = session.execute(select(User)).scalars().all()
        
        if not existing_users:
            print("Seeding users...")
            users = [
                User(user_id=str(uuid.uuid4()), email="admin@santeecooper.com", full_name="System Administrator", password_hash=generate_password_hash("admin123"), role="Admin", is_active=True),
                User(user_id=str(uuid.uuid4()), email="reviewer@santeecooper.com", full_name="Score Reviewer", password_hash=generate_password_hash("reviewer123"), role="Reviewer", is_active=True),
                User(user_id=str(uuid.uuid4()), email="readonly@santeecooper.com", full_name="Read Only User", password_hash=generate_password_hash("readonly123"), role="Read Only", is_active=True),
            ]
            for user in users:
                session.add(user)
            session.commit()
            print("Users seeded successfully")
        else:
            # Ensure all users have password hashes set
            updated = False
            for user in existing_users:
                if not user.password_hash or user.password_hash == '':
                    if user.email == "admin@santeecooper.com":
                        user.password_hash = generate_password_hash("admin123")
                        updated = True
                    elif user.email == "reviewer@santeecooper.com":
                        user.password_hash = generate_password_hash("reviewer123")
                        updated = True
                    elif user.email == "readonly@santeecooper.com":
                        user.password_hash = generate_password_hash("readonly123")
                        updated = True
            
            if updated:
                session.commit()
                print("User password hashes updated successfully")

        # Seed filter options
        existing_options = session.execute(select(FilterOption)).scalars().first()
        if not existing_options:
            filter_data = [
                # Target Years
                ("TargetYear", "2025", "2025", 1),
                ("TargetYear", "2026", "2026", 2),
                ("TargetYear", "2027", "2027", 3),
                ("TargetYear", "2028", "2028", 4),
                # Capability Categories
                ("CapabilityCategory", "Cloud Services", "Cloud Services", 1),
                ("CapabilityCategory", "Data Analytics", "Data Analytics", 2),
                ("CapabilityCategory", "Cybersecurity", "Cybersecurity", 3),
                ("CapabilityCategory", "AI/Machine Learning", "AI/Machine Learning", 4),
                ("CapabilityCategory", "Digital Transformation", "Digital Transformation", 5),
                # Executive Sponsors
                ("ExecutiveSponsor", "John Doe", "John Doe", 1),
                ("ExecutiveSponsor", "Jane Smith", "Jane Smith", 2),
                ("ExecutiveSponsor", "Michael Johnson", "Michael Johnson", 3),
                ("ExecutiveSponsor", "Sarah Williams", "Sarah Williams", 4),
                # Status
                ("Status", "Intake", "Intake", 1),
                ("Status", "In Review", "In Review", 2),
                ("Status", "Approved", "Approved", 3),
                ("Status", "Implemented", "Implemented", 4),
                ("Status", "On Hold", "On Hold", 5),
            ]
            for category, value, display_name, sort_order in filter_data:
                option = FilterOption(
                    option_id=str(uuid.uuid4()),
                    category=category,
                    value=value,
                    display_name=display_name,
                    sort_order=sort_order,
                    is_active=True,
                )
                session.add(option)
            session.commit()
    finally:
        session.close()


if __name__ == "__main__":
    seed()
