from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta

import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import func, select, text
from werkzeug.security import generate_password_hash, check_password_hash

from db import Base, SessionLocal, engine
from models import (
    Criterion,
    FilterOption,
    ReviewComment,
    ReviewInvite,
    ReviewSession,
    Score,
    Totals,
    User,
    UseCase,
)
from scoring import CriterionScore, compute_totals
from seed import seed

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ISSUER = os.getenv("JWT_ISSUER", "usecase-scoring")

# Valid status values from Status table
VALID_STATUSES = {"Intake", "In Review", "Approved", "Implemented", "On Hold"}


def init_db() -> None:
    print("Starting database initialization...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    
    # Ensure new columns exist for development environments where the DB file already exists
    try:
        with engine.begin() as conn:
            print("Checking and adding missing columns...")
            # Check and add missing columns in users table
            res = conn.execute(text("PRAGMA table_info('users')"))
            user_cols = [row[1] for row in res]
            if 'password_hash' not in user_cols:
                print("Adding password_hash column to users table")
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''"))
            else:
                # Update any NULL password_hash values to empty string (from old database)
                print("Updating NULL password hashes to empty string...")
                conn.execute(text("UPDATE users SET password_hash = '' WHERE password_hash IS NULL"))
            
            # Check and add missing columns in use_cases table
            res = conn.execute(text("PRAGMA table_info('use_cases')"))
            cols = [row[1] for row in res]
            if 'strategic_details' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN strategic_details TEXT"))
            if 'capability_areas' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN capability_areas TEXT"))
            if 'target_year' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN target_year TEXT"))
            if 'technical_sponsor' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN technical_sponsor TEXT"))
            if 'executive_sponsor' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN executive_sponsor TEXT"))
            if 'use_case_number' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN use_case_number INTEGER"))
            if 'na_value' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_value BOOLEAN DEFAULT 0"))
            if 'na_feasibility' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_feasibility BOOLEAN DEFAULT 0"))
            if 'na_org_capability' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_org_capability BOOLEAN DEFAULT 0"))
            if 'na_strategic' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_strategic BOOLEAN DEFAULT 0"))
            if 'na_value_justification' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_value_justification TEXT"))
            if 'na_feasibility_justification' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_feasibility_justification TEXT"))
            if 'na_org_capability_justification' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_org_capability_justification TEXT"))
            if 'na_strategic_justification' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_strategic_justification TEXT"))
            if 'na_reviewer_approval' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_reviewer_approval BOOLEAN DEFAULT 0"))
            if 'na_technical_initiative' not in cols:
                conn.execute(text("ALTER TABLE use_cases ADD COLUMN na_technical_initiative BOOLEAN DEFAULT 0"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_use_cases_number ON use_cases(use_case_number)"))
            conn.execute(text("""
                WITH ordered AS (
                    SELECT use_case_id,
                           ROW_NUMBER() OVER (ORDER BY created_on) AS rn
                    FROM use_cases
                    WHERE use_case_number IS NULL
                )
                UPDATE use_cases
                SET use_case_number = (SELECT rn FROM ordered WHERE ordered.use_case_id = use_cases.use_case_id)
                WHERE use_case_id IN (SELECT use_case_id FROM ordered)
            """))

            # Check and add missing columns in scores table
            res = conn.execute(text("PRAGMA table_info('scores')"))
            score_info = {row[1]: row for row in res}
            score_cols = list(score_info.keys())
            if 'is_na' not in score_cols:
                conn.execute(text("ALTER TABLE scores ADD COLUMN is_na BOOLEAN DEFAULT 0"))
            if 'na_reason' not in score_cols:
                conn.execute(text("ALTER TABLE scores ADD COLUMN na_reason TEXT"))

            # Make raw_score nullable for N/A handling (SQLite requires table rebuild)
            raw_score_row = score_info.get('raw_score')
            raw_score_notnull = raw_score_row and raw_score_row[3] == 1
            if raw_score_notnull:
                conn.execute(text("ALTER TABLE scores RENAME TO scores_old"))
                conn.execute(text("""
                    CREATE TABLE scores (
                        score_id TEXT PRIMARY KEY,
                        use_case_id TEXT REFERENCES use_cases(use_case_id),
                        criterion_id TEXT REFERENCES criteria(criterion_id),
                        rater_user_id TEXT,
                        round TEXT DEFAULT 'Initial',
                        raw_score REAL,
                        is_na BOOLEAN DEFAULT 0,
                        na_reason TEXT,
                        notes TEXT,
                        created_on DATETIME
                    )
                """))
                conn.execute(text("""
                    INSERT INTO scores (score_id, use_case_id, criterion_id, rater_user_id, round, raw_score, is_na, na_reason, notes, created_on)
                    SELECT score_id, use_case_id, criterion_id, rater_user_id, round, raw_score, 0, NULL, notes, created_on
                    FROM scores_old
                """))
                conn.execute(text("DROP TABLE scores_old"))
            print("Database migration completed")
    except Exception as e:
        print(f"Database migration warning: {e}")
    
    # Now seed the database
    print("Starting database seeding...")
    seed()
    print("Database initialization completed")


def get_session():
    return SessionLocal()


def generate_token(session_id: str, use_case_id: str) -> tuple[str, datetime]:
    expires_on = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sid": session_id,
        "ucid": use_case_id,
        "scope": "score:readwrite",
        "exp": int(expires_on.timestamp()),
        "nonce": uuid.uuid4().hex,
        "iss": JWT_ISSUER,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token, expires_on


def verify_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"], issuer=JWT_ISSUER)


def hash_password(password: str) -> str:
    """Hash a password using werkzeug security"""
    return generate_password_hash(password, method='pbkdf2:sha256')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    return check_password_hash(password_hash, password)


def use_case_to_dict(use_case: UseCase) -> dict:
    return {
        "useCaseId": use_case.use_case_id,
        "useCaseNumber": use_case.use_case_number,
        "title": use_case.title,
        "description": use_case.description,
        "businessUnit": use_case.business_unit,
        "strategicTheme": use_case.strategic_theme,
        "strategicDetails": use_case.strategic_details,
        "capabilityAreas": use_case.capability_areas,
        "targetYear": use_case.target_year,
        "requestor": use_case.requestor,
        "sponsor": use_case.sponsor,
        "technicalSponsor": use_case.technical_sponsor,
        "executiveSponsor": use_case.executive_sponsor,
        "stakeholders": use_case.stakeholders,
        "status": use_case.status,
        "createdOn": use_case.created_on.isoformat(),
        "assignedCoEId": use_case.assigned_coe_id,
        "outcomesJson": use_case.outcomes_json,
        "naValue": use_case.na_value,
        "naFeasibility": use_case.na_feasibility,
        "naOrgCapability": use_case.na_org_capability,
        "naStrategic": use_case.na_strategic,
        "naValueJustification": use_case.na_value_justification,
        "naFeasibilityJustification": use_case.na_feasibility_justification,
        "naOrgCapabilityJustification": use_case.na_org_capability_justification,
        "naStrategicJustification": use_case.na_strategic_justification,
        "naReviewerApproval": use_case.na_reviewer_approval,
        "naTechnicalInitiative": use_case.na_technical_initiative,
    }


def totals_to_dict(totals: Totals | None) -> dict | None:
    if not totals:
        return None
    return {
        "sValue": totals.s_value,
        "sFeasibility": totals.s_feasibility,
        "sOrgCapability": totals.s_org_capability,
        "sStrategic": totals.s_strategic,
        "sComposite": totals.s_composite,
        "sFC": totals.s_fc,
        "priority": totals.priority,
        "quadrant": totals.quadrant,
        "lastComputedOn": totals.last_computed_on.isoformat() if totals.last_computed_on else None,
    }


# ==================== HEALTH CHECK ====================

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for Container Apps"""
    try:
        # Check database connectivity
        session = SessionLocal()
        session.execute(text("SELECT 1"))
        session.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 503


# ==================== AUTH ENDPOINTS ====================

@app.route("/auth/login", methods=["POST"])
def login():
    """Login with email and password - returns auth token for all users"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be valid JSON"}), 400
        
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        session = SessionLocal()
        user = session.query(User).filter_by(email=email).first()
        session.close()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Check if password_hash exists and is not empty
        if not user.password_hash:
            return jsonify({"error": "User account is not configured. Please contact administrator."}), 401
        
        if not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid email or password"}), 401

        # Allow all active users to log in (Admin, Reviewer, Read Only)
        if not user.is_active:
            return jsonify({"error": "User account is inactive"}), 403

        # Create an auth token
        payload = {
            "userId": user.user_id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "exp": int((datetime.utcnow() + timedelta(days=7)).timestamp()),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        return jsonify({
            "token": token,
            "user": {
                "userId": user.user_id,
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role,
            }
        }), 200
    except ValueError as ve:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/auth/verify", methods=["GET"])
def verify_auth():
    """Verify if the provided token is valid"""
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "No token provided"}), 401

        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return jsonify({
            "valid": True,
            "user": {
                "userId": payload.get("userId"),
                "email": payload.get("email"),
                "fullName": payload.get("fullName"),
                "role": payload.get("role"),
            }
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/usecases", methods=["POST"])
def create_use_case():
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Request body must be valid JSON"}), 400
        
        # Validate required fields
        title = payload.get("title", "").strip()
        requestor = payload.get("requestor", "").strip()
        business_unit = payload.get("businessUnit", "").strip()
        sponsor = payload.get("sponsor", "").strip()
        
        if not title:
            return jsonify({"error": "Title is required"}), 400
        if not requestor:
            return jsonify({"error": "Requestor is required"}), 400
        if not business_unit:
            return jsonify({"error": "Business Unit is required"}), 400
        if not sponsor:
            return jsonify({"error": "Sponsor is required"}), 400
        
        session = get_session()
        try:
            next_number = session.execute(select(func.max(UseCase.use_case_number))).scalar()
            next_number = (next_number or 0) + 1
            use_case = UseCase(
                use_case_id=str(uuid.uuid4()),
                use_case_number=next_number,
                title=title,
                description=payload.get("description", ""),
                business_unit=business_unit,
                strategic_theme=payload.get("strategicTheme"),
                strategic_details=payload.get("strategicDetails"),
                capability_areas=payload.get("capabilityAreas"),
                target_year=payload.get("targetYear"),
                requestor=requestor,
                sponsor=sponsor,
                technical_sponsor=payload.get("technicalSponsor"),
                executive_sponsor=payload.get("executiveSponsor"),
                stakeholders=payload.get("stakeholders"),
                outcomes_json=payload.get("outcomesJson"),
                status="Intake",
            )
            session.add(use_case)
            session.commit()
            return jsonify(use_case_to_dict(use_case)), 201
        finally:
            session.close()
    except ValueError:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/usecases/<use_case_id>/assign", methods=["PATCH"])
def assign_use_case(use_case_id: str):
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Request body must be valid JSON"}), 400
        
        session = get_session()
        try:
            use_case = session.get(UseCase, use_case_id)
            if not use_case:
                return jsonify({"error": "Use case not found"}), 404
            use_case.assigned_coe_id = payload.get("assignedCoEId")
            use_case.status = "In Review"
            session.commit()
            return jsonify(use_case_to_dict(use_case))
        finally:
            session.close()
    except ValueError:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/usecases/<use_case_id>/complete", methods=["PATCH"])
def complete_use_case(use_case_id: str):
    session = get_session()
    try:
        use_case = session.get(UseCase, use_case_id)
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404
        use_case.status = "Implemented"
        session.commit()
        return jsonify(use_case_to_dict(use_case))
    finally:
        session.close()


@app.route("/criteria", methods=["GET"])
def list_criteria():
    session = get_session()
    try:
        criteria = session.execute(select(Criterion).where(Criterion.is_active == True)).scalars().all()
        return jsonify(
            [
                {
                    "criterionId": c.criterion_id,
                    "name": c.name,
                    "dimension": c.dimension,
                    "polarity": c.polarity,
                    "guidanceText": c.guidance_text,
                    "displayOrder": c.display_order,
                }
                for c in criteria
            ]
        )
    finally:
        session.close()


@app.route("/reviewsessions", methods=["POST"])
def create_review_session():
    payload = request.get_json(force=True)
    session = get_session()
    try:
        review_session = ReviewSession(
            session_id=str(uuid.uuid4()),
            use_case_id=payload.get("useCaseId"),
            assigned_coe_id=payload.get("assignedCoEId", ""),
            status="In Review",
        )
        session.add(review_session)
        session.commit()
        return jsonify({"sessionId": review_session.session_id}), 201
    finally:
        session.close()


@app.route("/reviewinvites", methods=["POST"])
def create_review_invite():
    payload = request.get_json(force=True)
    session = get_session()
    try:
        review_session = session.get(ReviewSession, payload.get("sessionId"))
        if not review_session:
            return jsonify({"error": "Session not found"}), 404
        token, expires_on = generate_token(review_session.session_id, review_session.use_case_id)
        invite = ReviewInvite(
            invite_id=str(uuid.uuid4()),
            session_id=review_session.session_id,
            token=token,
            expires_on=expires_on,
            can_edit=payload.get("canEdit", True),
            role_hint=payload.get("roleHint"),
        )
        session.add(invite)
        session.commit()
        return jsonify({"token": token, "expiresOn": expires_on.isoformat()})
    finally:
        session.close()


@app.route("/statuses", methods=["GET"])
def get_statuses():
    """Get valid status values from Status table"""
    session = get_session()
    try:
        statuses = session.execute(
            select(FilterOption)
            .where(FilterOption.category == "Status")
            .where(FilterOption.is_active == True)
            .order_by(FilterOption.sort_order)
        ).scalars().all()
        return jsonify([{
            "value": s.value,
            "displayName": s.display_name,
            "sortOrder": s.sort_order
        } for s in statuses])
    finally:
        session.close()


@app.route("/review", methods=["GET"])
def get_review_context():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing token"}), 400
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        return jsonify({"error": "Invalid token"}), 401
    session = get_session()
    try:
        use_case = session.get(UseCase, payload["ucid"])
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404
        criteria = session.execute(select(Criterion).order_by(Criterion.display_order)).scalars().all()
        return jsonify(
            {
                "useCase": use_case_to_dict(use_case),
                "criteria": [
                    {
                        "criterionId": c.criterion_id,
                        "name": c.name,
                        "dimension": c.dimension,
                        "polarity": c.polarity,
                        "displayOrder": c.display_order,
                    }
                    for c in criteria
                ],
            }
        )
    finally:
        session.close()


@app.route("/review/na", methods=["POST"])
def update_review_na():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing token"}), 400
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        return jsonify({"error": "Invalid token"}), 401
    try:
        body = request.get_json()
        if not body:
            return jsonify({"error": "Request body must be valid JSON"}), 400
    except ValueError:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    session = get_session()
    try:
        use_case = session.get(UseCase, payload["ucid"])
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404

        use_case.na_value = bool(body.get("naValue"))
        use_case.na_feasibility = bool(body.get("naFeasibility"))
        use_case.na_org_capability = bool(body.get("naOrgCapability"))
        use_case.na_strategic = bool(body.get("naStrategic"))
        use_case.na_value_justification = body.get("naValueJustification")
        use_case.na_feasibility_justification = body.get("naFeasibilityJustification")
        use_case.na_org_capability_justification = body.get("naOrgCapabilityJustification")
        use_case.na_strategic_justification = body.get("naStrategicJustification")
        use_case.na_reviewer_approval = bool(body.get("naReviewerApproval"))
        use_case.na_technical_initiative = bool(body.get("naTechnicalInitiative"))

        session.commit()
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/scores", methods=["POST"])
def submit_score():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing token"}), 400
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        return jsonify({"error": "Invalid token"}), 401
    try:
        body = request.get_json()
        if not body:
            return jsonify({"error": "Request body must be valid JSON"}), 400
    except ValueError:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    session = get_session()
    try:
        # Validate required fields
        criterion_id = body.get("criterionId")
        if not criterion_id:
            return jsonify({"error": "criterionId is required"}), 400
        
        is_na = bool(body.get("isNA"))
        raw_score = body.get("rawScore")
        if not is_na and raw_score is None:
            return jsonify({"error": "rawScore is required unless N/A"}), 400
        
        # Validate score range if provided
        if raw_score is not None and not is_na:
            try:
                score_val = float(raw_score)
                if score_val < 1.0 or score_val > 3.0:
                    return jsonify({"error": "rawScore must be between 1.0 and 3.0"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "rawScore must be a valid number"}), 400
        
        score = Score(
            score_id=str(uuid.uuid4()),
            use_case_id=payload["ucid"],
            criterion_id=criterion_id,
            raw_score=None if is_na or raw_score is None else float(raw_score),
            is_na=is_na,
            na_reason=body.get("naReason"),
            notes=body.get("notes"),
            rater_user_id=body.get("raterUserId"),
        )
        session.add(score)
        session.commit()
        return jsonify({"scoreId": score.score_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/scores", methods=["GET"])
def list_scores():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing token"}), 400
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        return jsonify({"error": "Invalid token"}), 401
    session = get_session()
    try:
        rows = (
            session.execute(
                select(Score)
                .where(Score.use_case_id == payload["ucid"])
                .order_by(Score.created_on.desc())
            )
            .scalars()
            .all()
        )
        latest = {}
        for row in rows:
            if row.criterion_id not in latest:
                latest[row.criterion_id] = {
                    "criterionId": row.criterion_id,
                    "rawScore": row.raw_score,
                    "isNA": row.is_na,
                    "naReason": row.na_reason,
                }
        return jsonify(list(latest.values()))
    finally:
        session.close()


@app.route("/reviewcomments", methods=["POST"])
def submit_comment():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing token"}), 400
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        return jsonify({"error": "Invalid token"}), 401
    try:
        body = request.get_json()
        if not body:
            return jsonify({"error": "Request body must be valid JSON"}), 400
    except ValueError:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    # Validate required fields
    text = body.get("text", "").strip()
    if not text:
        return jsonify({"error": "Comment text is required"}), 400
    
    session = get_session()
    try:
        comment = ReviewComment(
            comment_id=str(uuid.uuid4()),
            session_id=payload["sid"],
            author_hint=body.get("authorHint"),
            text=text,
        )
        session.add(comment)
        session.commit()
        return jsonify({"commentId": comment.comment_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@app.route("/compute/<use_case_id>", methods=["POST"])
def compute(use_case_id: str):
    session = get_session()
    try:
        use_case = session.get(UseCase, use_case_id)
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404

        na_dimensions = set()
        if use_case.na_value:
            na_dimensions.add("Value")
        if use_case.na_feasibility:
            na_dimensions.add("Feasibility")
        if use_case.na_org_capability:
            na_dimensions.add("Organizational")
        if use_case.na_strategic:
            na_dimensions.add("Strategic")

        if len(na_dimensions) == 4:
            return jsonify({"error": "All dimensions are marked Not Applicable. Scoring is blocked."}), 400
        if len(na_dimensions) == 3:
            if not use_case.na_technical_initiative:
                return jsonify({"error": "Three dimensions are N/A. Mark as technical/infrastructure initiative to proceed."}), 400
            if not use_case.na_reviewer_approval:
                return jsonify({"error": "Reviewer approval is required when three dimensions are N/A."}), 400

        scores = (
            session.execute(
                select(Score, Criterion)
                .join(Criterion, Score.criterion_id == Criterion.criterion_id)
                .where(Score.use_case_id == use_case_id)
                .order_by(Score.created_on.desc())
            )
            .all()
        )
        latest = {}
        for row in scores:
            if row.Score.criterion_id in latest:
                continue
            if row.Score.is_na or row.Score.raw_score is None:
                continue
            latest[row.Score.criterion_id] = CriterionScore(
                dimension=row.Criterion.dimension,
                polarity=row.Criterion.polarity,
                raw_score=row.Score.raw_score,
            )

        totals_data = compute_totals(latest.values(), na_dimensions)
        totals = session.get(Totals, use_case_id) or Totals(use_case_id=use_case_id)
        totals.s_value = totals_data["s_value"]
        totals.s_feasibility = totals_data["s_feasibility"]
        totals.s_org_capability = totals_data["s_org"]
        totals.s_strategic = totals_data["s_strategic"]
        totals.s_composite = totals_data["s_composite"]
        totals.s_fc = totals_data["s_fc"]
        totals.priority = totals_data["priority"]
        totals.quadrant = totals_data["quadrant"]
        totals.last_computed_on = datetime.utcnow()
        session.add(totals)
        session.commit()
        return jsonify(totals_to_dict(totals))
    finally:
        session.close()


@app.route("/dashboard/kanban", methods=["GET"])
def dashboard_kanban():
    session = get_session()
    try:
        use_cases = session.execute(select(UseCase)).scalars().all()
        lanes = {"Intake": [], "Under Review": [], "Completed": []}
        for use_case in use_cases:
            lanes.setdefault(use_case.status, []).append(use_case_to_dict(use_case))
        return jsonify(lanes)
    finally:
        session.close()


@app.route("/dashboard/portfolio", methods=["GET"])
def dashboard_portfolio():
    session = get_session()
    try:
        use_cases = session.execute(select(UseCase)).scalars().all()
        data = []
        for use_case in use_cases:
            data.append(
                {
                    **use_case_to_dict(use_case),
                    "totals": totals_to_dict(use_case.totals),
                }
            )
        data.sort(
            key=lambda item: (item["totals"] or {}).get("sComposite") or 0,
            reverse=True,
        )
        return jsonify(data)
    finally:
        session.close()


@app.route("/dashboard/scatter", methods=["GET"])
def dashboard_scatter():
    session = get_session()
    try:
        use_cases = session.execute(select(UseCase)).scalars().all()
        points = []
        for use_case in use_cases:
            totals = use_case.totals
            if not totals:
                continue
            if totals.s_value is None or totals.s_fc is None:
                continue
            points.append(
                {
                    "useCaseId": use_case.use_case_id,
                    "title": use_case.title,
                    "sFC": totals.s_fc,
                    "sValue": totals.s_value,
                    "quadrant": totals.quadrant,
                }
            )
        return jsonify(points)
    finally:
        session.close()


@app.route("/usecases/<use_case_id>/detail", methods=["GET"])
def use_case_detail(use_case_id: str):
    session = get_session()
    try:
        use_case = session.get(UseCase, use_case_id)
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404
        comments = (
            session.execute(
                select(ReviewComment).join(ReviewSession).where(ReviewSession.use_case_id == use_case_id)
            )
            .scalars()
            .all()
        )
        return jsonify(
            {
                "useCase": use_case_to_dict(use_case),
                "totals": totals_to_dict(use_case.totals),
                "comments": [
                    {
                        "commentId": c.comment_id,
                        "text": c.text,
                        "authorHint": c.author_hint,
                        "createdOn": c.created_on.isoformat(),
                    }
                    for c in comments
                ],
            }
        )
    finally:
        session.close()


@app.route("/usecases/<use_case_id>", methods=["PATCH"]) 
def update_use_case(use_case_id: str):
    payload = request.get_json(force=True)
    session = get_session()
    try:
        use_case = session.get(UseCase, use_case_id)
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404

        # Allowed fields to update
        allowed = {
            'title': 'title',
            'description': 'description',
            'businessUnit': 'business_unit',
            'strategicTheme': 'strategic_theme',
            'strategicDetails': 'strategic_details',
            'capabilityAreas': 'capability_areas',
            'targetYear': 'target_year',
            'requestor': 'requestor',
            'sponsor': 'sponsor',
            'technicalSponsor': 'technical_sponsor',
            'executiveSponsor': 'executive_sponsor',
            'stakeholders': 'stakeholders',
            'status': 'status',
            'assignedCoEId': 'assigned_coe_id',
            'outcomesJson': 'outcomes_json'
        }

        for key, attr in allowed.items():
            if key in payload:
                value = payload.get(key)
                # Validate status values
                if attr == 'status' and value is not None and value not in VALID_STATUSES:
                    return jsonify({"error": f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}"}), 400
                setattr(use_case, attr, value)

        session.add(use_case)
        session.commit()
        return jsonify(use_case_to_dict(use_case))
    finally:
        session.close()


@app.route("/usecases/<use_case_id>", methods=["DELETE"])
def delete_use_case(use_case_id: str):
    session = get_session()
    try:
        use_case = session.get(UseCase, use_case_id)
        if not use_case:
            return jsonify({"error": "Use case not found"}), 404

        session.execute(
            text(
                "DELETE FROM review_comments WHERE session_id IN (SELECT session_id FROM review_sessions WHERE use_case_id = :id)"
            ),
            {"id": use_case_id},
        )
        session.execute(
            text(
                "DELETE FROM review_invites WHERE session_id IN (SELECT session_id FROM review_sessions WHERE use_case_id = :id)"
            ),
            {"id": use_case_id},
        )
        session.execute(text("DELETE FROM review_sessions WHERE use_case_id = :id"), {"id": use_case_id})
        session.execute(text("DELETE FROM scores WHERE use_case_id = :id"), {"id": use_case_id})
        session.execute(text("DELETE FROM totals WHERE use_case_id = :id"), {"id": use_case_id})
        session.execute(text("DELETE FROM use_cases WHERE use_case_id = :id"), {"id": use_case_id})

        session.commit()
        return ("", 204)
    finally:
        session.close()


# ==================== ADMIN ENDPOINTS: USER MANAGEMENT ====================

@app.route("/admin/users", methods=["GET"])
def get_users():
    """Get all users with their roles"""
    try:
        session = SessionLocal()
        users = session.query(User).all()
        result = [
            {
                "userId": u.user_id,
                "email": u.email,
                "fullName": u.full_name,
                "role": u.role,
                "isActive": u.is_active,
                "createdOn": u.created_on.isoformat(),
                "updatedOn": u.updated_on.isoformat(),
            }
            for u in users
        ]
        session.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/users", methods=["POST"])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        session = SessionLocal()

        # Check if email already exists
        existing = session.query(User).filter_by(email=data.get("email")).first()
        if existing:
            session.close()
            return jsonify({"error": "Email already exists"}), 409

        password = data.get("password")
        if not password:
            session.close()
            return jsonify({"error": "Password is required"}), 400

        user = User(
            user_id=str(uuid.uuid4()),
            email=data.get("email"),
            full_name=data.get("fullName"),
            password_hash=hash_password(password),
            role=data.get("role", "Read Only"),  # Default to Read Only
            is_active=True,
        )
        session.add(user)
        session.commit()

        result = {
            "userId": user.user_id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "isActive": user.is_active,
            "createdOn": user.created_on.isoformat(),
            "updatedOn": user.updated_on.isoformat(),
        }
        session.close()
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    """Update user role, active status, full name, or password"""
    try:
        data = request.get_json()
        session = SessionLocal()

        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            session.close()
            return jsonify({"error": "User not found"}), 404

        if "role" in data:
            user.role = data["role"]
        if "isActive" in data:
            user.is_active = data["isActive"]
        if "fullName" in data:
            user.full_name = data["fullName"]
        if "password" in data:
            user.password_hash = hash_password(data["password"])

        user.updated_on = datetime.utcnow()
        session.commit()

        result = {
            "userId": user.user_id,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
            "isActive": user.is_active,
            "createdOn": user.created_on.isoformat(),
            "updatedOn": user.updated_on.isoformat(),
        }
        session.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a user"""
    try:
        session = SessionLocal()

        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            session.close()
            return jsonify({"error": "User not found"}), 404

        session.delete(user)
        session.commit()
        session.close()
        return ("", 204)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== ADMIN ENDPOINTS: FILTER OPTIONS MANAGEMENT ====================

@app.route("/admin/filter-options", methods=["GET"])
def get_filter_options():
    """Get all filter options grouped by category"""
    try:
        session = SessionLocal()
        options = session.query(FilterOption).filter_by(is_active=True).order_by(FilterOption.category, FilterOption.sort_order).all()

        result = {}
        for opt in options:
            if opt.category not in result:
                result[opt.category] = []
            result[opt.category].append({
                "optionId": opt.option_id,
                "category": opt.category,
                "value": opt.value,
                "displayName": opt.display_name,
                "sortOrder": opt.sort_order,
                "isActive": opt.is_active,
            })

        session.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/filter-options/<category>", methods=["GET"])
def get_filter_options_by_category(category):
    """Get filter options for a specific category"""
    try:
        session = SessionLocal()
        options = session.query(FilterOption).filter_by(category=category, is_active=True).order_by(FilterOption.sort_order).all()

        result = [
            {
                "optionId": opt.option_id,
                "category": opt.category,
                "value": opt.value,
                "displayName": opt.display_name,
                "sortOrder": opt.sort_order,
                "isActive": opt.is_active,
            }
            for opt in options
        ]
        session.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/filter-options", methods=["POST"])
def create_filter_option():
    """Create a new filter option"""
    try:
        data = request.get_json()
        session = SessionLocal()

        option = FilterOption(
            option_id=str(uuid.uuid4()),
            category=data.get("category"),
            value=data.get("value"),
            display_name=data.get("displayName", data.get("value")),
            sort_order=data.get("sortOrder", 0),
            is_active=True,
        )
        session.add(option)
        session.commit()

        result = {
            "optionId": option.option_id,
            "category": option.category,
            "value": option.value,
            "displayName": option.display_name,
            "sortOrder": option.sort_order,
            "isActive": option.is_active,
        }
        session.close()
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/filter-options/<option_id>", methods=["PUT"])
def update_filter_option(option_id):
    """Update a filter option"""
    try:
        data = request.get_json()
        session = SessionLocal()

        option = session.query(FilterOption).filter_by(option_id=option_id).first()
        if not option:
            session.close()
            return jsonify({"error": "Filter option not found"}), 404

        if "displayName" in data:
            option.display_name = data["displayName"]
        if "sortOrder" in data:
            option.sort_order = data["sortOrder"]
        if "isActive" in data:
            option.is_active = data["isActive"]

        option.updated_on = datetime.utcnow()
        session.commit()

        result = {
            "optionId": option.option_id,
            "category": option.category,
            "value": option.value,
            "displayName": option.display_name,
            "sortOrder": option.sort_order,
            "isActive": option.is_active,
        }
        session.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/filter-options/<option_id>", methods=["DELETE"])
def delete_filter_option(option_id):
    """Delete a filter option (soft delete by marking inactive)"""
    try:
        session = SessionLocal()

        option = session.query(FilterOption).filter_by(option_id=option_id).first()
        if not option:
            session.close()
            return jsonify({"error": "Filter option not found"}), 404

        option.is_active = False
        option.updated_on = datetime.utcnow()
        session.commit()
        session.close()
        return ("", 204)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    init_db()
    # Use debug mode only in development
    debug_mode = os.getenv("FLASK_ENV", "production") == "development"
    app.run(debug=debug_mode, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))