#!/usr/bin/env python3
"""
Test script to verify saving user inputs to NocoDB via the backend
"""
import requests
import json

BASE_URL = "http://localhost:8000"

sample_user_input = {
    "yourName": "Sneha",
    "partnerName": "Arjun",
    "weddingDate": "2024-12-25",
    "city": "Mumbai",
    "guestCount": 250,
    "budgetRange": "₹30-50 Lakhs",
    "weddingType": "Hindu",
    "duration": "3 Days",
    "weddingStyle": "Traditional",
    "events": ["Engagement", "Sangeet", "Wedding Ceremony"],
    "priorities": ["Venue", "Catering", "Photography"],
    "specialRequirements": "Vegetarian catering only, no alcohol",
    "contact_email": "sneha@example.com",
    "contact_phone": "+91-9876543210"
}

def test_save_user_inputs():
    url = f"{BASE_URL}/api/save-user-inputs"
    print(f"POST {url}")
    response = requests.post(url, json=sample_user_input)
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(response.text)

if __name__ == "__main__":
    test_save_user_inputs() 