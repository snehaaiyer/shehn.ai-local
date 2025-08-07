#!/usr/bin/env python3
"""
Comprehensive Test for Individual Vendor Contact Details
Verifies that the API returns individual vendor contact details rather than generic page listings
"""

import requests
import json
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_individual_vendor_contacts():
    """Test that we get individual vendor contact details"""
    
    print("🧪 Testing Individual Vendor Contact Details")
    print("=" * 60)
    
    # Test URL
    base_url = "http://localhost:8000"
    
    # Test parameters
    categories = ['venues', 'photography', 'catering', 'decoration']
    location = 'mumbai'  # Use Mumbai for fresh results
    
    total_vendors = 0
    individual_vendors = 0
    vendors_with_contacts = 0
    
    for category in categories:
        print(f"\n📋 Testing {category.upper()} vendors in {location.upper()}")
        print("-" * 50)
        
        try:
            # Test the vendor data endpoint with fresh search
            url = f"{base_url}/api/vendor-data/{category}"
            payload = {
                'city': location,
                'use_serper': 'true',
                'force_refresh': 'true'  # Force fresh search
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    vendors = data.get('vendors', [])
                    total_vendors += len(vendors)
                    
                    print(f"✅ Found {len(vendors)} vendors")
                    print(f"📊 Source: {data.get('source', 'unknown')}")
                    print(f"🔍 Individual contacts verified: {data.get('individual_contacts_verified', False)}")
                    
                    # Analyze each vendor
                    for i, vendor in enumerate(vendors, 1):
                        name = vendor.get('name', 'Unknown')
                        phone = vendor.get('phone', 'N/A')
                        email = vendor.get('email', 'N/A')
                        website = vendor.get('website', 'N/A')
                        whatsapp = vendor.get('whatsapp', 'N/A')
                        contact_score = vendor.get('contact_score', 0)
                        
                        print(f"\n  {i}. {name}")
                        print(f"     📞 Phone: {phone}")
                        print(f"     📧 Email: {email}")
                        print(f"     🌐 Website: {website}")
                        print(f"     📱 WhatsApp: {whatsapp}")
                        print(f"     📊 Contact Score: {contact_score}/100")
                        
                        # Check if it's an individual vendor (not a collection page)
                        is_individual = check_if_individual_vendor(vendor)
                        print(f"     ✅ Individual Vendor: {is_individual}")
                        
                        # Check if it has valid contact information
                        has_contacts = check_has_valid_contacts(vendor)
                        print(f"     📞 Has Valid Contacts: {has_contacts}")
                        
                        if is_individual:
                            individual_vendors += 1
                        if has_contacts:
                            vendors_with_contacts += 1
                        
                        # Detailed analysis
                        if not is_individual:
                            print(f"     ⚠️  WARNING: This appears to be a collection/directory page!")
                        if not has_contacts:
                            print(f"     ⚠️  WARNING: No valid contact information found!")
                        if contact_score >= 50:
                            print(f"     🎉 EXCELLENT: High contact score!")
                        elif contact_score >= 30:
                            print(f"     👍 GOOD: Reasonable contact score")
                        else:
                            print(f"     ⚠️  LOW: Poor contact score")
                            
                else:
                    print(f"❌ API returned error: {data.get('error', 'Unknown error')}")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing {category}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"Total vendors found: {total_vendors}")
    print(f"Individual vendors: {individual_vendors}")
    print(f"Vendors with contacts: {vendors_with_contacts}")
    
    if total_vendors > 0:
        individual_percentage = (individual_vendors / total_vendors) * 100
        contact_percentage = (vendors_with_contacts / total_vendors) * 100
        
        print(f"Individual vendor rate: {individual_percentage:.1f}%")
        print(f"Contact information rate: {contact_percentage:.1f}%")
        
        if individual_percentage >= 80:
            print("✅ EXCELLENT: High rate of individual vendors!")
        elif individual_percentage >= 60:
            print("👍 GOOD: Reasonable rate of individual vendors")
        else:
            print("⚠️  NEEDS IMPROVEMENT: Too many collection pages")
            
        if contact_percentage >= 80:
            print("✅ EXCELLENT: High rate of contact information!")
        elif contact_percentage >= 60:
            print("👍 GOOD: Reasonable rate of contact information")
        else:
            print("⚠️  NEEDS IMPROVEMENT: Too many vendors without contacts")

def check_if_individual_vendor(vendor):
    """Check if vendor is an individual business, not a collection page"""
    name = vendor.get('name', '').lower()
    description = vendor.get('description', '').lower()
    
    # Collection indicators
    collection_indicators = [
        'top', 'best', 'list of', 'find', 'search', 'compare', 'reviews',
        'ratings', 'recommended', 'popular', 'famous', 'leading', 'directory',
        'photographers in', 'caterers in', 'venues in', 'decorators in',
        'banquet halls in', 'services in', 'companies in', 'agents',
        'booking agents', 'venue booking', 'wedding vendors',
        'wedding planner', 'event planner', 'wedding coordinator'
    ]
    
    # Check if name or description contains collection indicators
    return not any(indicator in name or indicator in description for indicator in collection_indicators)

def check_has_valid_contacts(vendor):
    """Check if vendor has valid contact information"""
    phone = vendor.get('phone', '')
    email = vendor.get('email', '')
    website = vendor.get('website', '')
    whatsapp = vendor.get('whatsapp', '')
    
    # Check if any contact method is valid (not N/A or empty)
    valid_contacts = []
    if phone and phone != 'N/A' and len(phone.strip()) > 5:
        valid_contacts.append('phone')
    if email and email != 'N/A' and '@' in email:
        valid_contacts.append('email')
    if website and website != 'N/A' and website.startswith('http'):
        valid_contacts.append('website')
    if whatsapp and whatsapp != 'N/A' and ('wa.me' in whatsapp or 'whatsapp' in whatsapp):
        valid_contacts.append('whatsapp')
    
    return len(valid_contacts) > 0

def test_serper_enhancement():
    """Test the enhanced Serper search directly"""
    print("\n🔍 Testing Enhanced Serper Search")
    print("=" * 60)
    
    try:
        from serper_images import search_vendors
        
        category = 'venues'
        location = 'mumbai'
        
        print(f"Searching for {category} vendors in {location}...")
        
        result = search_vendors(category, location, 5)
        
        if result.get('success'):
            vendors = result.get('vendors', [])
            print(f"✅ Found {len(vendors)} vendors via Serper")
            print(f"📊 Filtered: {result.get('filtered_count', 0)} from {result.get('original_count', 0)}")
            
            individual_count = 0
            contact_count = 0
            
            for i, vendor in enumerate(vendors, 1):
                name = vendor.get('name', 'Unknown')
                phone = vendor.get('phone', 'N/A')
                email = vendor.get('email', 'N/A')
                website = vendor.get('website', 'N/A')
                whatsapp = vendor.get('whatsapp', 'N/A')
                
                print(f"\n  {i}. {name}")
                print(f"     📞 Phone: {phone}")
                print(f"     📧 Email: {email}")
                print(f"     🌐 Website: {website}")
                print(f"     📱 WhatsApp: {whatsapp}")
                
                # Check if it's individual
                is_individual = check_if_individual_vendor(vendor)
                has_contacts = check_has_valid_contacts(vendor)
                
                print(f"     ✅ Individual: {is_individual}")
                print(f"     📞 Has Contacts: {has_contacts}")
                
                if is_individual:
                    individual_count += 1
                if has_contacts:
                    contact_count += 1
            
            print(f"\n📊 Serper Results Summary:")
            print(f"Individual vendors: {individual_count}/{len(vendors)} ({individual_count/len(vendors)*100:.1f}%)")
            print(f"Vendors with contacts: {contact_count}/{len(vendors)} ({contact_count/len(vendors)*100:.1f}%)")
            
        else:
            print(f"❌ Serper search failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Error testing Serper directly: {e}")

if __name__ == "__main__":
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    # Test both API endpoint and direct Serper search
    test_individual_vendor_contacts()
    test_serper_enhancement() 