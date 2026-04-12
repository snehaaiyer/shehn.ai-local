import requests
import json

print("\n🔫 Triggering search...")
try:
    r = requests.get('http://localhost:8000/api/vendor-data/venues?city=Mumbai&use_serper=true', timeout=30)
    print(f"Status: {r.status_code}")
    data = r.json()
    
    if data.get('vendors'):
        v1 = data['vendors'][0]
        print(f"Name: {v1.get('name')}")
        print(f"Source: {data.get('source')}") # I verify 'source' field in response
    else:
        print("No vendors returned")

except Exception as e:
    print(f"Error: {e}")
