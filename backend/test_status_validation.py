#!/usr/bin/env python3
"""Test status validation"""
import requests
import json

BASE_URL = "http://localhost:5001"

# First, get a use case ID
print("Fetching use cases...")
response = requests.get(f"{BASE_URL}/usecases")
use_cases = response.json()

if not use_cases:
    print("No use cases found to test with")
    exit(1)

use_case_id = use_cases[0]["useCaseId"]
print(f"Testing with use case: {use_case_id}")

# Test 1: Valid status update
print("\n--- Test 1: Valid status (Approved) ---")
response = requests.patch(
    f"{BASE_URL}/usecases/{use_case_id}",
    json={"status": "Approved"}
)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print(f"Success! New status: {response.json()['status']}")
else:
    print(f"Response: {response.text}")

# Test 2: Invalid status update
print("\n--- Test 2: Invalid status (Completed - old value) ---")
response = requests.patch(
    f"{BASE_URL}/usecases/{use_case_id}",
    json={"status": "Completed"}
)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")

# Test 3: Another invalid status
print("\n--- Test 3: Invalid status (Random) ---")
response = requests.patch(
    f"{BASE_URL}/usecases/{use_case_id}",
    json={"status": "Random"}
)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")

# Test 4: Valid status list
print("\n--- Test 4: Get valid statuses ---")
response = requests.get(f"{BASE_URL}/statuses")
print("Valid statuses:")
for status in response.json():
    print(f"  - {status['displayName']} ({status['value']})")
