#!/usr/bin/env python3
"""
Debug script to trace vendor duplicates through the entire pipeline
"""

import json
import logging
from typing import Dict, List
from difflib import SequenceMatcher

# Import the modules we need to test
from serper_images import search_vendors
from simple_unified_server import VendorDataValidator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_vendor_pipeline():
    """Debug the entire vendor pipeline to find duplicates"""
    
    print("🔍 DEBUGGING VENDOR DUPLICATES")
    print("=" * 60)
    
    # Test categories
    categories = ['venues', 'decoration', 'catering', 'makeup', 'photography']
    location = 'Mumbai'
    
    for category in categories:
        print(f"\n📋 TESTING CATEGORY: {category.upper()}")
        print("-" * 40)
        
        # Step 1: Get raw Serper results
        print("1️⃣ Getting raw Serper results...")
        try:
            serper_result = search_vendors(category, location, 8)
            
            if not serper_result.get('success'):
                print(f"   ❌ Serper failed for {category}")
                continue
                
            raw_vendors = serper_result.get('vendors', [])
            print(f"   📊 Raw vendors: {len(raw_vendors)}")
            
            # Show raw vendor names
            for i, vendor in enumerate(raw_vendors):
                name = vendor.get('name', 'N/A')
                phone = vendor.get('phone', 'N/A')
                print(f"      {i+1}. '{name}' | Phone: {phone}")
            
        except Exception as e:
            print(f"   ❌ Error getting Serper results: {e}")
            continue
        
        # Step 2: Check for duplicates in raw results
        print("\n2️⃣ Checking for duplicates in raw results...")
        raw_duplicates = find_duplicates_in_list(raw_vendors)
        if raw_duplicates:
            print(f"   ⚠️ Found {len(raw_duplicates)} duplicate groups in raw results:")
            for group in raw_duplicates:
                print(f"      Group: {[v.get('name', 'N/A') for v in group]}")
        else:
            print("   ✅ No duplicates in raw results")
        
        # Step 3: Test vendor validation
        print("\n3️⃣ Testing vendor validation...")
        validator = VendorDataValidator()
        
        # Convert to the format expected by validator
        serper_vendors = []
        for vendor in raw_vendors:
            serper_vendors.append({
                'id': vendor.get('id'),
                'name': vendor.get('name'),
                'description': vendor.get('description'),
                'location': vendor.get('location'),
                'rating': vendor.get('rating', 4.2),
                'price': vendor.get('price_range', '₹50,000 - ₹2,00,000'),
                'phone': vendor.get('phone'),
                'email': vendor.get('email'),
                'website': vendor.get('website'),
                'google_maps': vendor.get('google_maps'),
                'instagram': vendor.get('instagram'),
                'whatsapp': vendor.get('whatsapp'),
                'specialties': vendor.get('specialties', []),
                'verified': vendor.get('verified', False),
                'category': category,
                'source': 'serper_ai',
                'primary_image': vendor.get('primary_image', ''),
                'thumbnail_image': vendor.get('thumbnail_image', ''),
                'images': vendor.get('images', []),
                'justifications': vendor.get('justifications', []),
                'highlights': vendor.get('highlights', []),
                'sentiment_analysis': vendor.get('sentiment_analysis', {}),
                'match_score': vendor.get('match_score', 85),
                'recommendation_tier': vendor.get('recommendation_tier', 'Good Match')
            })
        
        validated_vendors = validator.validate_vendor_list(serper_vendors)
        print(f"   📊 Validated vendors: {len(validated_vendors)}")
        
        # Show validated vendor names
        for i, vendor in enumerate(validated_vendors):
            name = vendor.get('name', 'N/A')
            phone = vendor.get('phone', 'N/A')
            print(f"      {i+1}. '{name}' | Phone: {phone}")
        
        # Step 4: Check for duplicates in validated results
        print("\n4️⃣ Checking for duplicates in validated results...")
        validated_duplicates = find_duplicates_in_list(validated_vendors)
        if validated_duplicates:
            print(f"   ❌ Found {len(validated_duplicates)} duplicate groups in validated results:")
            for group in validated_duplicates:
                print(f"      Group: {[v.get('name', 'N/A') for v in group]}")
        else:
            print("   ✅ No duplicates in validated results")
        
        # Step 5: Compare raw vs validated
        print("\n5️⃣ Comparing raw vs validated...")
        raw_names = [v.get('name', '').lower().strip() for v in raw_vendors]
        validated_names = [v.get('name', '').lower().strip() for v in validated_vendors]
        
        print(f"   Raw names: {raw_names}")
        print(f"   Validated names: {validated_names}")
        
        # Check if any names were changed during validation
        name_changes = []
        for i, (raw_name, validated_name) in enumerate(zip(raw_names, validated_names)):
            if raw_name != validated_name:
                name_changes.append((raw_name, validated_name))
        
        if name_changes:
            print(f"   ⚠️ Name changes during validation:")
            for raw, validated in name_changes:
                print(f"      '{raw}' -> '{validated}'")
        else:
            print("   ✅ No name changes during validation")

def find_duplicates_in_list(vendors: List[Dict]) -> List[List[Dict]]:
    """Find duplicate vendors in a list using fuzzy matching"""
    duplicates = []
    seen = []
    
    for vendor in vendors:
        vendor_name = vendor.get('name', '').lower().strip()
        vendor_phone = vendor.get('phone', '').strip()
        
        # Skip empty names
        if not vendor_name:
            continue
        
        # Check for exact matches
        exact_match = None
        for seen_vendor in seen:
            seen_name = seen_vendor.get('name', '').lower().strip()
            seen_phone = seen_vendor.get('phone', '').strip()
            
            if vendor_name == seen_name or (vendor_phone and vendor_phone == seen_phone):
                exact_match = seen_vendor
                break
        
        # Check for fuzzy matches
        fuzzy_match = None
        if not exact_match:
            for seen_vendor in seen:
                seen_name = seen_vendor.get('name', '').lower().strip()
                similarity = SequenceMatcher(None, vendor_name, seen_name).ratio()
                if similarity > 0.8:  # 80% similarity threshold
                    fuzzy_match = seen_vendor
                    break
        
        if exact_match or fuzzy_match:
            # Add to existing duplicate group
            found_group = False
            for group in duplicates:
                if exact_match in group or fuzzy_match in group:
                    group.append(vendor)
                    found_group = True
                    break
            
            if not found_group:
                # Create new duplicate group
                duplicates.append([exact_match or fuzzy_match, vendor])
        else:
            seen.append(vendor)
    
    return duplicates

def test_specific_duplicate():
    """Test a specific duplicate case"""
    print("\n🎯 TESTING SPECIFIC DUPLICATE CASE")
    print("=" * 40)
    
    # Test with decoration category which showed duplicates
    category = 'decoration'
    location = 'Mumbai'
    
    print(f"Testing {category} in {location}...")
    
    try:
        serper_result = search_vendors(category, location, 8)
        
        if serper_result.get('success'):
            vendors = serper_result.get('vendors', [])
            print(f"Found {len(vendors)} vendors")
            
            # Show all vendor details
            for i, vendor in enumerate(vendors):
                print(f"\nVendor {i+1}:")
                print(f"  Name: '{vendor.get('name', 'N/A')}'")
                print(f"  Phone: '{vendor.get('phone', 'N/A')}'")
                print(f"  Website: '{vendor.get('website', 'N/A')}'")
                print(f"  Description: '{vendor.get('description', 'N/A')[:100]}...'")
            
            # Check for duplicates
            duplicates = find_duplicates_in_list(vendors)
            if duplicates:
                print(f"\n❌ Found {len(duplicates)} duplicate groups:")
                for i, group in enumerate(duplicates):
                    print(f"  Group {i+1}:")
                    for vendor in group:
                        print(f"    - '{vendor.get('name', 'N/A')}'")
            else:
                print("\n✅ No duplicates found")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_vendor_pipeline()
    test_specific_duplicate() 