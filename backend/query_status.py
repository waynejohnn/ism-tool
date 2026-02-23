#!/usr/bin/env python3
from db import SessionLocal
from sqlalchemy import text

session = SessionLocal()
result = session.execute(text("SELECT display_name, value, sort_order FROM filter_options WHERE category = 'Status' ORDER BY sort_order"))
rows = result.fetchall()
print(f"Found {len(rows)} status values:")
for row in rows:
    print(f"  - {row[0]} (value={row[1]}, sort_order={row[2]})")
session.close()
