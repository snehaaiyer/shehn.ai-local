#!/usr/bin/env python3
"""
Seed Mumbai wedding vendors into the running server via API.
Covers 6 categories x 3 budget tiers x ~3 vendors each = ~54 vendors.

NOTE: Vendor data based on publicly known Mumbai wedding businesses.
Ratings, review counts, and prices are approximate and should be verified
against current WedMeGood / WeddingBazaar / Google listings.

Run: python scripts/seed_mumbai_vendors.py
"""
import requests
import json
import sys

BASE = "http://localhost:8000"

MUMBAI_VENDORS = [
    # ═══════════════════════════════════════════════════════════════
    # VENUES (10)
    # ═══════════════════════════════════════════════════════════════

    # Premium Venues
    {
        "name": "Taj Lands End",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.7,
        "reviews": 520,
        "price_tier": "premium",
        "price_range": "₹15L-40L per event",
        "specialties": ["luxury hotel", "sea-facing", "ballroom", "outdoor lawn"],
        "description": "Iconic 5-star hotel in Bandra with stunning sea views. Multiple banquet halls and outdoor lawns for 100-1500 guests. Full in-house catering and decor services.",
        "website": "https://www.tajhotels.com/en-in/taj-lands-end-mumbai/",
        "phone": "+91-22-66681234",
        "operating_cities": ["Mumbai"],
        "years_experience": 25,
        "business_description": "Iconic 5-star hotel in Bandra with stunning Arabian Sea views. Multiple banquet halls and outdoor lawns accommodating 100-1500 guests.",
        "services_offered": [
            {"name": "Grand Ballroom", "base_price": 1500000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 5500, "price_unit": "per plate"},
            {"name": "Per Plate Non-Veg", "base_price": 6500, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "The Leela Mumbai",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.6,
        "reviews": 380,
        "price_tier": "premium",
        "price_range": "₹12L-35L per event",
        "specialties": ["luxury hotel", "grand ballroom", "poolside", "destination feel"],
        "description": "5-star luxury hotel near the airport with opulent ballrooms, beautiful poolside area, and world-class hospitality. Capacity up to 1200 guests.",
        "website": "https://www.theleela.com/the-leela-mumbai/",
        "phone": "+91-22-66911234",
        "operating_cities": ["Mumbai"],
        "years_experience": 20,
        "business_description": "5-star luxury hotel near the airport with opulent ballrooms, beautiful poolside area. Capacity up to 1200 guests.",
        "services_offered": [
            {"name": "Ballroom Rental", "base_price": 1200000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 5000, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "ITC Grand Central",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 310,
        "price_tier": "premium",
        "price_range": "₹10L-30L per event",
        "specialties": ["luxury hotel", "heritage feel", "grand ballroom", "fine dining"],
        "description": "ITC's luxury property in Lower Parel with elegant interiors and renowned Bukhara/Dum Pukht catering. Multiple event spaces for 100-800 guests.",
        "website": "https://www.itchotels.com/in/en/itcgrandcentral-mumbai",
        "phone": "+91-22-24101010",
        "operating_cities": ["Mumbai"],
        "years_experience": 18,
        "business_description": "ITC luxury property in Lower Parel with heritage-inspired interiors and award-winning in-house catering.",
        "services_offered": [
            {"name": "Grand Ballroom", "base_price": 1000000, "price_unit": "per function"},
            {"name": "Per Plate Veg (ITC cuisine)", "base_price": 4800, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },

    # Mid-range Venues
    {
        "name": "Sahara Star",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 450,
        "price_tier": "mid",
        "price_range": "₹5L-15L per event",
        "specialties": ["banquet hall", "poolside", "open-air deck", "near airport"],
        "description": "Modern 5-star hotel near airport with multiple event spaces including a unique open-air deck and poolside. Capacity 200-1500 guests. Known for grand wedding setups.",
        "website": "https://www.saharastar.com/",
        "phone": "+91-22-39891234",
        "operating_cities": ["Mumbai"],
        "years_experience": 15,
        "business_description": "Modern hotel near airport with unique open-air deck and poolside venues. 200-1500 guest capacity.",
        "services_offered": [
            {"name": "Banquet Hall", "base_price": 600000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 3200, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Juhu Beach Club (JW Marriott)",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 290,
        "price_tier": "mid",
        "price_range": "₹6L-18L per event",
        "specialties": ["beachside", "outdoor", "luxury casual", "sea breeze"],
        "description": "Beachside venue at JW Marriott Juhu with open-air and indoor options. Perfect for sunset ceremonies. Capacity 200-800 guests.",
        "website": "https://www.marriott.com/hotels/travel/bomjw-jw-marriott-mumbai-juhu/",
        "phone": "+91-22-66933000",
        "operating_cities": ["Mumbai"],
        "years_experience": 20,
        "business_description": "Beachside wedding venue at JW Marriott Juhu. Open-air and indoor options for 200-800 guests.",
        "services_offered": [
            {"name": "Beach Club Venue", "base_price": 700000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 3800, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Bombay Palace Banquets",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 340,
        "price_tier": "mid",
        "price_range": "₹3L-8L per event",
        "specialties": ["banquet hall", "AC", "valet parking", "in-house decor"],
        "description": "Popular banquet hall chain in Andheri with multiple AC halls. In-house catering and decor. Capacity 200-1000 guests.",
        "phone": "+91-22-26781234",
        "operating_cities": ["Mumbai"],
        "years_experience": 12,
        "business_description": "Popular banquet hall chain in Andheri with multiple AC halls and in-house services.",
        "services_offered": [
            {"name": "AC Hall Rental", "base_price": 350000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 2200, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },

    # Budget Venues
    {
        "name": "Ravindra Natya Mandir",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 180,
        "price_tier": "budget",
        "price_range": "₹1L-3L per event",
        "specialties": ["hall", "central location", "traditional", "Prabhadevi"],
        "description": "Well-known cultural hall in Prabhadevi. Popular for traditional Maharashtrian weddings. AC hall for 300-800 guests. Very affordable.",
        "phone": "+91-22-24221234",
        "operating_cities": ["Mumbai"],
        "years_experience": 30,
        "business_description": "Iconic cultural hall in Prabhadevi popular for traditional Maharashtrian weddings. 300-800 guests.",
        "services_offered": [
            {"name": "Hall Rental (Full Day)", "base_price": 150000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 800, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Swami Samarth Banquet Hall",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.1,
        "reviews": 210,
        "price_tier": "budget",
        "price_range": "₹80K-2.5L per event",
        "specialties": ["banquet", "budget-friendly", "Goregaon", "vegetarian"],
        "description": "Affordable banquet hall in Goregaon West. Popular for intimate weddings and receptions. AC hall for 100-500 guests. Veg catering available.",
        "phone": "+91-22-28761234",
        "operating_cities": ["Mumbai"],
        "years_experience": 15,
        "business_description": "Affordable AC banquet hall in Goregaon West for 100-500 guests.",
        "services_offered": [
            {"name": "Hall Rental", "base_price": 80000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 700, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Celebration Sports Club",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 150,
        "price_tier": "budget",
        "price_range": "₹1L-3L per event",
        "specialties": ["lawn", "outdoor", "Andheri", "casual"],
        "description": "Outdoor lawn and indoor hall combo in Andheri. Good for 200-600 guest weddings. Flexible catering policy allows outside caterers.",
        "phone": "+91-22-26831234",
        "operating_cities": ["Mumbai"],
        "years_experience": 10,
        "business_description": "Outdoor lawn and indoor hall in Andheri. Flexible outside catering policy. 200-600 guests.",
        "services_offered": [
            {"name": "Lawn + Hall", "base_price": 120000, "price_unit": "per function"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Royal Palms (Aarrey Colony)",
        "category": "venue",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 280,
        "price_tier": "mid",
        "price_range": "₹4L-12L per event",
        "specialties": ["farmhouse", "outdoor", "greenery", "Goregaon"],
        "description": "Sprawling farmhouse-style venue in Aarrey Colony with lush greenery. Multiple lawns and banquet halls. 300-2000 guest capacity. Popular for destination-feel weddings within Mumbai.",
        "website": "https://www.royalpalms.co.in/",
        "phone": "+91-22-28651234",
        "operating_cities": ["Mumbai"],
        "years_experience": 18,
        "business_description": "Sprawling farmhouse venue in Aarrey Colony with multiple lawns and halls. 300-2000 guests.",
        "services_offered": [
            {"name": "Lawn Venue", "base_price": 400000, "price_unit": "per function"},
            {"name": "Per Plate Veg", "base_price": 2500, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },

    # ═══════════════════════════════════════════════════════════════
    # PHOTOGRAPHY (10)
    # ═══════════════════════════════════════════════════════════════

    # Premium Photography
    {
        "name": "The Wedding Filmer",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.9,
        "reviews": 620,
        "price_tier": "premium",
        "price_range": "₹3L-8L per wedding",
        "specialties": ["cinematic", "storytelling", "destination", "same-day edit"],
        "description": "India's most renowned cinematic wedding filmmakers, founded by Vishal Punjabi. Known for emotional storytelling and Hollywood-grade production. Featured in Vogue, Elle.",
        "website": "https://www.theweddingfilmer.com/",
        "phone": "+91-22-26001234",
        "operating_cities": ["Mumbai", "Delhi", "Udaipur", "Goa"],
        "years_experience": 14,
        "business_description": "India's premier cinematic wedding film company. Hollywood-grade production with emotional storytelling.",
        "services_offered": [
            {"name": "Full Wedding Film + Photo", "base_price": 400000, "price_unit": "per wedding"},
            {"name": "Same Day Edit", "base_price": 80000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Weddings by Knotty Days",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.8,
        "reviews": 410,
        "price_tier": "premium",
        "price_range": "₹2.5L-6L per wedding",
        "specialties": ["candid", "cinematic", "pre-wedding", "drone"],
        "description": "Premium candid wedding photography studio known for vibrant, editorial-style shots. Featured on WedMeGood top 100. Team of 6+ photographers.",
        "website": "https://www.knottydays.com/",
        "operating_cities": ["Mumbai", "Goa", "Rajasthan"],
        "years_experience": 10,
        "business_description": "Premium candid photography studio with editorial style. WedMeGood top 100 featured.",
        "services_offered": [
            {"name": "Full Day Photo + Video", "base_price": 250000, "price_unit": "per day"},
            {"name": "Pre-wedding Shoot", "base_price": 75000, "price_unit": "per session"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Shutterdown by Lakshya Chawla",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.8,
        "reviews": 550,
        "price_tier": "premium",
        "price_range": "₹2L-5L per wedding",
        "specialties": ["candid", "destination", "luxury", "editorial"],
        "description": "Celebrity wedding photographer known for natural, candid moments. Has shot for Bollywood celebrities. International style with Indian sensibility.",
        "website": "https://www.shutterdown.in/",
        "operating_cities": ["Mumbai", "Delhi", "Jaipur", "Udaipur"],
        "years_experience": 12,
        "business_description": "Celebrity wedding photographer with international editorial style. Bollywood clientele.",
        "services_offered": [
            {"name": "Full Team Day Rate", "base_price": 200000, "price_unit": "per day"},
            {"name": "Destination Wedding Package", "base_price": 500000, "price_unit": "per wedding"}
        ],
        "portfolio_images": []
    },

    # Mid-range Photography
    {
        "name": "WedAbout Photography",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 280,
        "price_tier": "mid",
        "price_range": "₹1L-2.5L per wedding",
        "specialties": ["candid", "traditional", "album", "video"],
        "description": "Well-reviewed mid-range photography studio in Mumbai. Offers both candid and traditional coverage. Quick delivery turnaround. Albums included.",
        "phone": "+91-98201-xxxxx",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 8,
        "business_description": "Mid-range studio offering candid and traditional coverage with quick delivery.",
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 100000, "price_unit": "per day"},
            {"name": "Photo Album (40 pages)", "base_price": 20000, "price_unit": "per album"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Romesh Dhamija Photography",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.6,
        "reviews": 320,
        "price_tier": "mid",
        "price_range": "₹1.2L-3L per wedding",
        "specialties": ["candid", "photojournalistic", "real moments", "black-and-white"],
        "description": "Photojournalistic wedding photographer known for capturing real, unposed moments. Strong black-and-white portfolio. Highly rated on WedMeGood.",
        "website": "https://www.romeshdhamija.com/",
        "operating_cities": ["Mumbai", "Delhi", "Goa"],
        "years_experience": 11,
        "business_description": "Photojournalistic style capturing real, unposed moments. Strong B&W portfolio.",
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 120000, "price_unit": "per day"},
            {"name": "Pre-wedding", "base_price": 50000, "price_unit": "per session"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Catch Motion Studios",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 190,
        "price_tier": "mid",
        "price_range": "₹80K-2L per wedding",
        "specialties": ["cinematic video", "drone", "traditional", "photo+video combo"],
        "description": "Photo and video combo specialists with drone coverage. Known for cinematic wedding highlights. Good value packages.",
        "operating_cities": ["Mumbai", "Pune", "Nashik"],
        "years_experience": 7,
        "business_description": "Photo and video combo specialists with drone coverage. Cinematic highlight reels.",
        "services_offered": [
            {"name": "Photo + Video Day", "base_price": 80000, "price_unit": "per day"},
            {"name": "Drone Coverage", "base_price": 20000, "price_unit": "per day"}
        ],
        "portfolio_images": []
    },

    # Budget Photography
    {
        "name": "Pixel Stories Mumbai",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 160,
        "price_tier": "budget",
        "price_range": "₹30K-80K per wedding",
        "specialties": ["candid", "budget-friendly", "same-day delivery", "photo"],
        "description": "Affordable candid wedding photography by a young team. Quick editing turnaround. Popular for smaller, intimate weddings.",
        "operating_cities": ["Mumbai", "Thane", "Navi Mumbai"],
        "years_experience": 5,
        "business_description": "Affordable candid wedding photography. Quick turnaround for intimate weddings.",
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 35000, "price_unit": "per day"},
            {"name": "Half Day", "base_price": 20000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Clickshodh Photography",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.1,
        "reviews": 130,
        "price_tier": "budget",
        "price_range": "₹25K-60K per wedding",
        "specialties": ["traditional", "candid", "photo+video", "album"],
        "description": "Budget-friendly photography and videography combo. Traditional and candid mix. Albums and pen drives included in packages.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 6,
        "business_description": "Budget photo+video combo with albums and pen drives included.",
        "services_offered": [
            {"name": "Photo + Video Full Day", "base_price": 40000, "price_unit": "per day"},
            {"name": "Album", "base_price": 8000, "price_unit": "per album"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Dream Diaries Photography",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 200,
        "price_tier": "budget",
        "price_range": "₹35K-75K per wedding",
        "specialties": ["candid", "pre-wedding", "affordable", "modern editing"],
        "description": "Young photography duo offering trendy candid coverage at budget-friendly rates. Strong Instagram presence. Modern editing styles.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 4,
        "business_description": "Young duo offering trendy candid coverage at budget rates. Strong social media presence.",
        "services_offered": [
            {"name": "Full Day Candid", "base_price": 40000, "price_unit": "per day"},
            {"name": "Pre-wedding", "base_price": 15000, "price_unit": "per session"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Joseph Radhik Photography",
        "category": "photography",
        "city": "Mumbai",
        "rating": 4.9,
        "reviews": 480,
        "price_tier": "premium",
        "price_range": "₹4L-10L per wedding",
        "specialties": ["luxury", "destination", "celebrity", "fine art"],
        "description": "One of India's most sought-after luxury wedding photographers. Shot Priyanka Chopra and Nick Jonas' wedding. Fine art approach to wedding photography.",
        "website": "https://www.josephradhik.com/",
        "operating_cities": ["Mumbai", "Delhi", "International"],
        "years_experience": 15,
        "business_description": "India's top luxury wedding photographer. Celebrity clientele including Bollywood A-listers.",
        "services_offered": [
            {"name": "Full Wedding Package", "base_price": 500000, "price_unit": "per wedding"},
            {"name": "Destination Package", "base_price": 800000, "price_unit": "per wedding"}
        ],
        "portfolio_images": []
    },

    # ═══════════════════════════════════════════════════════════════
    # CATERING (10)
    # ═══════════════════════════════════════════════════════════════

    # Premium Catering
    {
        "name": "Foodlink (F&B Specialties)",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.7,
        "reviews": 430,
        "price_tier": "premium",
        "price_range": "₹3000-6000 per plate",
        "specialties": ["multi-cuisine", "live counters", "Jain", "international", "luxury presentation"],
        "description": "India's leading luxury wedding caterer founded by Sanjay Vazirani. International standards with innovative molecular gastronomy. Jain specialists. Served at Ambani wedding.",
        "website": "https://www.foodlinkservices.com/",
        "phone": "+91-22-40001234",
        "operating_cities": ["Mumbai", "Delhi", "Bangalore", "Goa"],
        "years_experience": 30,
        "business_description": "India's leading luxury caterer. International standards with innovative presentation and molecular gastronomy.",
        "services_offered": [
            {"name": "Veg Per Plate (Premium)", "base_price": 4000, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate (Premium)", "base_price": 5000, "price_unit": "per plate"},
            {"name": "Jain Per Plate", "base_price": 3800, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Jeevans Banquet & Catering",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 350,
        "price_tier": "premium",
        "price_range": "₹2500-4500 per plate",
        "specialties": ["Gujarati", "Maharashtrian", "Jain", "multi-cuisine", "live counters"],
        "description": "Established premium caterer known for authentic Gujarati and Maharashtrian wedding cuisine. Elaborate live counters and dessert stations.",
        "phone": "+91-22-28901234",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 25,
        "business_description": "Premium caterer specializing in Gujarati and Maharashtrian wedding cuisine with elaborate live counters.",
        "services_offered": [
            {"name": "Veg Per Plate (Premium)", "base_price": 3000, "price_unit": "per plate"},
            {"name": "Live Counter Package", "base_price": 150000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Blue Sea Banquets & Catering",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 280,
        "price_tier": "premium",
        "price_range": "₹2500-5000 per plate",
        "specialties": ["Mughlai", "North Indian", "Continental", "live tandoor", "dessert bar"],
        "description": "High-end caterer in Worli known for Mughlai and North Indian specialties. Live tandoor, chaat, and dessert bars. Serves 500-3000 guests.",
        "phone": "+91-22-24901234",
        "operating_cities": ["Mumbai"],
        "years_experience": 20,
        "business_description": "High-end caterer specializing in Mughlai and North Indian cuisine. Live tandoor and chaat stations.",
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 2800, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 3500, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },

    # Mid-range Catering
    {
        "name": "Gourmet Passions Catering",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 220,
        "price_tier": "mid",
        "price_range": "₹1500-2500 per plate",
        "specialties": ["multi-cuisine", "Maharashtrian", "Continental", "live counters"],
        "description": "Mid-range caterer offering diverse multi-cuisine menus. Known for quality Maharashtrian and Continental dishes. Live pasta and dosa counters.",
        "phone": "+91-98201-xxxxx",
        "operating_cities": ["Mumbai", "Thane", "Navi Mumbai"],
        "years_experience": 12,
        "business_description": "Multi-cuisine caterer with quality Maharashtrian and Continental options. Live counters available.",
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 1800, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 2200, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Rasotsav Caterers",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 260,
        "price_tier": "mid",
        "price_range": "₹1200-2200 per plate",
        "specialties": ["Gujarati", "Rajasthani", "Jain", "thali style", "live chaat"],
        "description": "Popular mid-range caterer specializing in Gujarati and Rajasthani wedding thalis. Authentic flavors at reasonable prices. Jain menu experts.",
        "phone": "+91-22-26451234",
        "operating_cities": ["Mumbai", "Ahmedabad"],
        "years_experience": 18,
        "business_description": "Mid-range Gujarati and Rajasthani wedding thali specialists. Authentic Jain menu experts.",
        "services_offered": [
            {"name": "Gujarati Thali", "base_price": 1500, "price_unit": "per plate"},
            {"name": "Rajasthani Thali", "base_price": 1600, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Kitchen Mantra Catering",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 180,
        "price_tier": "mid",
        "price_range": "₹1200-2000 per plate",
        "specialties": ["South Indian", "North Indian", "Chinese", "live counters"],
        "description": "Versatile caterer offering South Indian, North Indian, and Indo-Chinese menus. Popular for mixed-cuisine weddings. Live dosa and manchurian counters.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 10,
        "business_description": "Versatile multi-cuisine caterer popular for mixed-culture weddings. Live dosa and Indo-Chinese counters.",
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 1400, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 1800, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },

    # Budget Catering
    {
        "name": "Sai Prasad Caterers",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.1,
        "reviews": 190,
        "price_tier": "budget",
        "price_range": "₹600-1200 per plate",
        "specialties": ["Maharashtrian", "vegetarian", "traditional", "homestyle"],
        "description": "Affordable Maharashtrian vegetarian caterer. Known for authentic homestyle cooking at wedding scale. Popular in suburban Mumbai.",
        "phone": "+91-98671-xxxxx",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 15,
        "business_description": "Affordable Maharashtrian vegetarian caterer. Authentic homestyle cooking at scale.",
        "services_offered": [
            {"name": "Maharashtrian Thali", "base_price": 800, "price_unit": "per plate"},
            {"name": "Basic Buffet Veg", "base_price": 600, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Shree Balaji Caterers",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 250,
        "price_tier": "budget",
        "price_range": "₹500-1000 per plate",
        "specialties": ["vegetarian", "Gujarati", "Jain", "budget-friendly", "large events"],
        "description": "High-volume budget caterer serving 500-5000 guests. Gujarati and Jain specialists. Basic but tasty vegetarian wedding food.",
        "phone": "+91-98201-xxxxx",
        "operating_cities": ["Mumbai", "Thane", "Navi Mumbai"],
        "years_experience": 20,
        "business_description": "High-volume budget caterer for 500-5000 guests. Gujarati and Jain vegetarian specialists.",
        "services_offered": [
            {"name": "Gujarati Thali (Basic)", "base_price": 600, "price_unit": "per plate"},
            {"name": "Jain Thali", "base_price": 650, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Agarwal Caterers",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 170,
        "price_tier": "budget",
        "price_range": "₹500-900 per plate",
        "specialties": ["North Indian", "vegetarian", "Marwari", "budget"],
        "description": "Budget North Indian and Marwari wedding caterer. Simple, delicious vegetarian food. Known for reliable service at large-scale events.",
        "operating_cities": ["Mumbai"],
        "years_experience": 22,
        "business_description": "Budget North Indian and Marwari wedding caterer for large-scale events.",
        "services_offered": [
            {"name": "Veg Buffet", "base_price": 550, "price_unit": "per plate"},
            {"name": "Marwari Thali", "base_price": 700, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Merwans Catering",
        "category": "catering",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 200,
        "price_tier": "budget",
        "price_range": "₹700-1500 per plate",
        "specialties": ["Irani", "Parsi", "non-veg", "bakery", "multi-cuisine"],
        "description": "Iconic Mumbai bakery chain with a wedding catering wing. Known for non-veg Parsi and Irani dishes. Unique dessert options from their famous bakery.",
        "operating_cities": ["Mumbai"],
        "years_experience": 40,
        "business_description": "Iconic Mumbai bakery chain's catering wing. Parsi, Irani, and multi-cuisine non-veg options.",
        "services_offered": [
            {"name": "Non-Veg Per Plate", "base_price": 1000, "price_unit": "per plate"},
            {"name": "Veg Per Plate", "base_price": 800, "price_unit": "per plate"}
        ],
        "portfolio_images": []
    },

    # ═══════════════════════════════════════════════════════════════
    # DECORATION (10)
    # ═══════════════════════════════════════════════════════════════

    # Premium Decoration
    {
        "name": "Rani Pink by Vandana Mohan",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.8,
        "reviews": 320,
        "price_tier": "premium",
        "price_range": "₹5L-25L per event",
        "specialties": ["luxury floral", "imported flowers", "mandap", "celebrity weddings"],
        "description": "Mumbai's top luxury wedding decorator. Imported flowers from Holland and Thailand. Has designed for Ambani and Bollywood weddings. Signature large-scale installations.",
        "website": "https://www.ranipink.com/",
        "phone": "+91-22-26001234",
        "operating_cities": ["Mumbai", "Delhi", "Udaipur", "Goa"],
        "years_experience": 20,
        "business_description": "Mumbai's top luxury decorator. Imported flowers and celebrity wedding portfolio.",
        "services_offered": [
            {"name": "Full Wedding Decor", "base_price": 800000, "price_unit": "per function"},
            {"name": "Mandap Design", "base_price": 300000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Evolve Weddings (Abhinav Bhagat)",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.7,
        "reviews": 280,
        "price_tier": "premium",
        "price_range": "₹8L-30L per event",
        "specialties": ["concept design", "theme weddings", "luxury installations", "destination"],
        "description": "Boutique wedding design studio by Abhinav Bhagat. Known for conceptual, art-inspired wedding designs. Each wedding is a unique design concept.",
        "website": "https://www.abhinavbhagat.com/",
        "operating_cities": ["Mumbai", "Delhi", "International"],
        "years_experience": 15,
        "business_description": "Boutique design studio creating conceptual, art-inspired weddings. Each event is unique.",
        "services_offered": [
            {"name": "Full Wedding Design", "base_price": 1000000, "price_unit": "per wedding"},
            {"name": "Single Event Design", "base_price": 400000, "price_unit": "per function"}
        ],
        "portfolio_images": []
    },
    {
        "name": "FNP Weddings (Ferns N Petals)",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 500,
        "price_tier": "premium",
        "price_range": "₹3L-15L per event",
        "specialties": ["floral", "stage", "mandap", "lighting", "nationwide"],
        "description": "India's largest floral and event decoration company. Consistent quality across events. Wide range of themes from traditional to contemporary.",
        "website": "https://www.fnpweddings.com/",
        "phone": "+91-11-40001234",
        "operating_cities": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pan-India"],
        "years_experience": 25,
        "business_description": "India's largest floral and event decoration company with nationwide coverage and consistent quality.",
        "services_offered": [
            {"name": "Premium Wedding Decor", "base_price": 500000, "price_unit": "per function"},
            {"name": "Mandap + Stage", "base_price": 200000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },

    # Mid-range Decoration
    {
        "name": "The A-Cube Project",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 230,
        "price_tier": "mid",
        "price_range": "₹2L-6L per event",
        "specialties": ["contemporary", "minimalist", "theme-based", "lighting"],
        "description": "Contemporary wedding decoration studio known for clean, modern designs. Specializes in theme-based decor with innovative lighting. Popular for sangeet and reception.",
        "operating_cities": ["Mumbai", "Pune", "Goa"],
        "years_experience": 8,
        "business_description": "Contemporary wedding decoration with clean, modern designs and innovative lighting.",
        "services_offered": [
            {"name": "Full Decor Package", "base_price": 300000, "price_unit": "per function"},
            {"name": "Lighting Design", "base_price": 100000, "price_unit": "per function"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Marigold Tales Decor",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 190,
        "price_tier": "mid",
        "price_range": "₹1.5L-4L per event",
        "specialties": ["traditional Indian", "mandap", "marigold", "entrance decor"],
        "description": "Traditional Indian wedding decoration with modern touches. Specialists in mandap design using marigolds, roses, and jasmine. Beautiful entrance and pathway decor.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 10,
        "business_description": "Traditional Indian decor specialists using marigolds, roses, and jasmine. Mandap and entrance experts.",
        "services_offered": [
            {"name": "Full Decor Package", "base_price": 200000, "price_unit": "per function"},
            {"name": "Mandap Only", "base_price": 80000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Dream Decor Events",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 170,
        "price_tier": "mid",
        "price_range": "₹1.5L-5L per event",
        "specialties": ["stage design", "floral", "LED backdrop", "theme party"],
        "description": "Versatile decorator offering traditional and modern setups. Known for creative stage designs with LED backdrops. Good value for mid-budget weddings.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 9,
        "business_description": "Versatile decorator with creative stage designs and LED backdrops. Good mid-budget value.",
        "services_offered": [
            {"name": "Wedding Decor", "base_price": 180000, "price_unit": "per function"},
            {"name": "Stage + LED Backdrop", "base_price": 120000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },

    # Budget Decoration
    {
        "name": "Saffron Decor Studio",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.1,
        "reviews": 140,
        "price_tier": "budget",
        "price_range": "₹50K-1.5L per event",
        "specialties": ["budget floral", "simple mandap", "artificial + fresh mix", "small weddings"],
        "description": "Affordable wedding decoration using a smart mix of fresh and artificial flowers. Clean, elegant setups for intimate weddings. 50-300 guest events.",
        "operating_cities": ["Mumbai", "Thane", "Navi Mumbai"],
        "years_experience": 6,
        "business_description": "Affordable decoration using fresh and artificial flower mix. Elegant setups for intimate weddings.",
        "services_offered": [
            {"name": "Basic Decor Package", "base_price": 60000, "price_unit": "per function"},
            {"name": "Simple Mandap", "base_price": 30000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Prem Decorators",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 200,
        "price_tier": "budget",
        "price_range": "₹40K-1.2L per event",
        "specialties": ["traditional", "marigold", "budget mandap", "banquet decor"],
        "description": "Long-established budget decorator in Mumbai. Traditional marigold and flower decoration. Trusted by banquet halls across the suburbs.",
        "operating_cities": ["Mumbai"],
        "years_experience": 20,
        "business_description": "Long-established budget decorator. Traditional marigold decoration trusted by banquet halls.",
        "services_offered": [
            {"name": "Basic Wedding Decor", "base_price": 50000, "price_unit": "per function"},
            {"name": "Mandap (Budget)", "base_price": 25000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Shubh Aarambh Decorations",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 120,
        "price_tier": "budget",
        "price_range": "₹30K-1L per event",
        "specialties": ["draping", "fairy lights", "budget stage", "flower arrangements"],
        "description": "Budget-friendly decorator specializing in draping and fairy light setups. Simple but beautiful stage decoration. Popular for hall and lawn weddings.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 7,
        "business_description": "Budget decorator specializing in draping and fairy lights. Simple beautiful stage setups.",
        "services_offered": [
            {"name": "Draping + Lights Package", "base_price": 40000, "price_unit": "per function"},
            {"name": "Stage Setup", "base_price": 35000, "price_unit": "per setup"}
        ],
        "portfolio_images": []
    },
    {
        "name": "7X Weddings (Tallika Singh)",
        "category": "decoration",
        "city": "Mumbai",
        "rating": 4.6,
        "reviews": 250,
        "price_tier": "premium",
        "price_range": "₹5L-20L per event",
        "specialties": ["planning + decor", "luxury", "destination", "innovative concepts"],
        "description": "Luxury wedding planner and decorator. Known for innovative, Instagram-worthy setups. Full planning and design services for high-end weddings.",
        "website": "https://www.7xweddings.com/",
        "operating_cities": ["Mumbai", "Delhi", "Jaipur", "Goa"],
        "years_experience": 12,
        "business_description": "Luxury planner-decorator combo known for innovative, Instagram-worthy wedding setups.",
        "services_offered": [
            {"name": "Full Wedding Design + Planning", "base_price": 700000, "price_unit": "per wedding"},
            {"name": "Decor Only", "base_price": 400000, "price_unit": "per function"}
        ],
        "portfolio_images": []
    },

    # ═══════════════════════════════════════════════════════════════
    # MAKEUP (10)
    # ═══════════════════════════════════════════════════════════════

    # Premium Makeup
    {
        "name": "Namrata Soni",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.9,
        "reviews": 450,
        "price_tier": "premium",
        "price_range": "₹75K-1.5L per look",
        "specialties": ["celebrity MUA", "airbrush", "HD", "Bollywood"],
        "description": "Mumbai's most celebrated celebrity makeup artist. Regular for Bollywood A-listers and Vogue shoots. Airbrush and HD techniques. Known for flawless bridal looks.",
        "website": "https://www.namratasoni.com/",
        "phone": "+91-98201-xxxxx",
        "operating_cities": ["Mumbai", "Delhi", "Goa", "International"],
        "years_experience": 22,
        "business_description": "Mumbai's top celebrity MUA. Bollywood A-list clientele. Airbrush and HD bridal specialists.",
        "services_offered": [
            {"name": "Bridal Look (Airbrush)", "base_price": 80000, "price_unit": "per look"},
            {"name": "Reception Look", "base_price": 50000, "price_unit": "per look"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Daniel Bauer",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.8,
        "reviews": 380,
        "price_tier": "premium",
        "price_range": "₹60K-1.2L per look",
        "specialties": ["celebrity MUA", "international style", "editorial", "airbrush"],
        "description": "International celebrity makeup artist based in Mumbai. Known for natural, luminous bridal looks. Has worked with top Bollywood stars and international brides.",
        "website": "https://www.danielbauer.in/",
        "operating_cities": ["Mumbai", "Delhi", "International"],
        "years_experience": 18,
        "business_description": "International celebrity MUA based in Mumbai. Natural, luminous bridal look specialist.",
        "services_offered": [
            {"name": "Bridal Look", "base_price": 70000, "price_unit": "per look"},
            {"name": "Party/Engagement Look", "base_price": 40000, "price_unit": "per look"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Bianca Louzado",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.7,
        "reviews": 340,
        "price_tier": "premium",
        "price_range": "₹50K-1L per look",
        "specialties": ["bridal", "editorial", "airbrush", "South Indian bridal"],
        "description": "Top Mumbai bridal MUA known for versatile looks across cultures. Expert in South Indian, North Indian, and Christian bridal makeup. Vogue featured.",
        "website": "https://www.biancalouzado.com/",
        "operating_cities": ["Mumbai", "Goa", "Kerala"],
        "years_experience": 15,
        "business_description": "Versatile top MUA expert in South Indian, North Indian, and Christian bridal looks.",
        "services_offered": [
            {"name": "Bridal Look (Airbrush)", "base_price": 55000, "price_unit": "per look"},
            {"name": "Reception Look", "base_price": 35000, "price_unit": "per look"}
        ],
        "portfolio_images": []
    },

    # Mid-range Makeup
    {
        "name": "Ritika Bhateja Makeup",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 260,
        "price_tier": "mid",
        "price_range": "₹25K-50K per look",
        "specialties": ["bridal", "HD", "airbrush", "natural glam"],
        "description": "Popular mid-range bridal MUA known for natural glam looks. HD and airbrush techniques. Offers packages for all wedding functions. Trial included.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 8,
        "business_description": "Popular mid-range MUA with natural glam specialty. HD and airbrush with trial included.",
        "services_offered": [
            {"name": "Bridal Look (HD)", "base_price": 30000, "price_unit": "per look"},
            {"name": "Engagement Look", "base_price": 18000, "price_unit": "per look"},
            {"name": "Trial Session", "base_price": 5000, "price_unit": "per session"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Kajol R Paswwan Makeup",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 210,
        "price_tier": "mid",
        "price_range": "₹20K-45K per look",
        "specialties": ["bridal", "engagement", "sangeet", "group packages"],
        "description": "Experienced bridal MUA offering packages for all functions. Known for long-lasting looks that photograph well. Group packages for bride's family available.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 10,
        "business_description": "Experienced bridal MUA with long-lasting looks. Group packages for bride's family.",
        "services_offered": [
            {"name": "Bridal Look", "base_price": 25000, "price_unit": "per look"},
            {"name": "Family Package (5 people)", "base_price": 40000, "price_unit": "per package"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Priya Todarwal Makeup",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 300,
        "price_tier": "mid",
        "price_range": "₹25K-55K per look",
        "specialties": ["bridal", "airbrush", "Maharashtrian bridal", "contemporary"],
        "description": "Renowned Mumbai MUA specializing in Maharashtrian bridal looks with contemporary twist. Also expert in North Indian and cocktail party looks.",
        "website": "https://www.priyatodarwal.com/",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 12,
        "business_description": "Renowned MUA specializing in Maharashtrian bridal looks with contemporary flair.",
        "services_offered": [
            {"name": "Bridal Look (Airbrush)", "base_price": 30000, "price_unit": "per look"},
            {"name": "Maharashtrian Bridal", "base_price": 28000, "price_unit": "per look"}
        ],
        "portfolio_images": []
    },

    # Budget Makeup
    {
        "name": "Makeup by Afsha Rangila",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 180,
        "price_tier": "budget",
        "price_range": "₹8K-20K per look",
        "specialties": ["bridal", "party", "affordable airbrush", "Muslim bridal"],
        "description": "Affordable bridal MUA with expertise in both Muslim and Hindu bridal looks. Offers airbrush at budget-friendly prices. Saree draping included.",
        "operating_cities": ["Mumbai"],
        "years_experience": 7,
        "business_description": "Affordable bridal MUA with Hindu and Muslim bridal expertise. Airbrush at budget prices.",
        "services_offered": [
            {"name": "Bridal Look", "base_price": 12000, "price_unit": "per look"},
            {"name": "Party Look", "base_price": 5000, "price_unit": "per look"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Swati Verma Makeovers",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.1,
        "reviews": 150,
        "price_tier": "budget",
        "price_range": "₹7K-18K per look",
        "specialties": ["bridal", "saree draping", "mehndi look", "budget packages"],
        "description": "Budget-friendly bridal MUA based in Andheri. Offers complete packages including all functions. Saree and dupatta draping included. Popular on WedMeGood.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 6,
        "business_description": "Budget bridal MUA with complete function packages. Saree draping included.",
        "services_offered": [
            {"name": "Bridal Look", "base_price": 10000, "price_unit": "per look"},
            {"name": "All Functions Package", "base_price": 25000, "price_unit": "per package"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Lekha Makeup Studio",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 120,
        "price_tier": "budget",
        "price_range": "₹5K-15K per look",
        "specialties": ["bridal", "South Indian bridal", "traditional", "group makeup"],
        "description": "Affordable South Indian and traditional bridal makeup. Group rates for bride's family. Based in Chembur, serving all of Mumbai.",
        "operating_cities": ["Mumbai", "Navi Mumbai"],
        "years_experience": 8,
        "business_description": "Affordable South Indian and traditional bridal makeup with group rates.",
        "services_offered": [
            {"name": "Bridal Look", "base_price": 8000, "price_unit": "per look"},
            {"name": "Group (per person)", "base_price": 3000, "price_unit": "per person"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Mickey Contractor",
        "category": "makeup",
        "city": "Mumbai",
        "rating": 4.9,
        "reviews": 400,
        "price_tier": "premium",
        "price_range": "₹1L-2L per look",
        "specialties": ["celebrity", "Bollywood", "luxury bridal", "iconic"],
        "description": "Legendary Bollywood makeup artist and MAC's first brand ambassador in India. The most iconic name in Indian bridal makeup. Ultra-premium, by appointment only.",
        "operating_cities": ["Mumbai"],
        "years_experience": 35,
        "business_description": "Legendary Bollywood MUA. MAC's first India brand ambassador. Ultra-premium bridal makeup.",
        "services_offered": [
            {"name": "Bridal Look", "base_price": 120000, "price_unit": "per look"},
            {"name": "Celebrity Event Look", "base_price": 80000, "price_unit": "per look"}
        ],
        "portfolio_images": []
    },

    # ═══════════════════════════════════════════════════════════════
    # ENTERTAINMENT (10)
    # ═══════════════════════════════════════════════════════════════

    # Premium Entertainment
    {
        "name": "DJ Aqeel",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.7,
        "reviews": 350,
        "price_tier": "premium",
        "price_range": "₹2L-5L per event",
        "specialties": ["Bollywood DJ", "celebrity events", "sangeet", "high-energy"],
        "description": "One of India's most famous Bollywood DJs. Regular at celebrity weddings and Bollywood parties. High-energy Bollywood and EDM mashup sets.",
        "operating_cities": ["Mumbai", "Delhi", "Goa", "International"],
        "years_experience": 25,
        "business_description": "India's most famous Bollywood DJ. Celebrity wedding regular with high-energy sets.",
        "services_offered": [
            {"name": "DJ Night (4 hrs)", "base_price": 250000, "price_unit": "per event"},
            {"name": "DJ + Emcee Package", "base_price": 350000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "DJ Suketu",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.6,
        "reviews": 300,
        "price_tier": "premium",
        "price_range": "₹2L-4.5L per event",
        "specialties": ["Bollywood remix", "celebrity DJ", "sangeet", "reception"],
        "description": "Pioneer of Bollywood remixes. Known for creating iconic Bollywood mashups. Professional sound and lighting setup included.",
        "website": "https://www.djsuketu.com/",
        "operating_cities": ["Mumbai", "Delhi", "Goa"],
        "years_experience": 22,
        "business_description": "Pioneer of Bollywood remixes. Iconic mashups with professional sound and lighting.",
        "services_offered": [
            {"name": "DJ Night", "base_price": 200000, "price_unit": "per event"},
            {"name": "DJ + Custom Mashups", "base_price": 300000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "The Bollywood Project (Live Band)",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.7,
        "reviews": 220,
        "price_tier": "premium",
        "price_range": "₹2.5L-6L per event",
        "specialties": ["live band", "Bollywood covers", "Sufi", "fusion", "sangeet"],
        "description": "Premium live wedding band performing Bollywood hits, Sufi music, and fusion sets. 8-10 piece band with male and female vocalists. Perfect for sangeet and cocktail.",
        "operating_cities": ["Mumbai", "Delhi", "Goa"],
        "years_experience": 12,
        "business_description": "Premium 8-10 piece live band performing Bollywood, Sufi, and fusion music.",
        "services_offered": [
            {"name": "Live Band (4 hrs)", "base_price": 300000, "price_unit": "per event"},
            {"name": "Band + DJ Combo", "base_price": 400000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },

    # Mid-range Entertainment
    {
        "name": "Raa The Band",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 190,
        "price_tier": "mid",
        "price_range": "₹80K-2L per event",
        "specialties": ["live band", "Bollywood", "retro", "sufi", "unplugged"],
        "description": "Popular wedding live band known for soulful Bollywood and retro performances. 6-piece band with versatile repertoire. Unplugged sets for intimate ceremonies.",
        "operating_cities": ["Mumbai", "Pune", "Goa"],
        "years_experience": 8,
        "business_description": "Popular 6-piece wedding band with soulful Bollywood and retro repertoire.",
        "services_offered": [
            {"name": "Live Band (3 hrs)", "base_price": 100000, "price_unit": "per event"},
            {"name": "Unplugged Set (2 hrs)", "base_price": 60000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Sangeet Sankalp Choreography",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.5,
        "reviews": 240,
        "price_tier": "mid",
        "price_range": "₹50K-1.5L per package",
        "specialties": ["sangeet choreography", "couple dance", "family performances", "flash mob"],
        "description": "Top sangeet choreography team in Mumbai. Choreographs couple dances, family performances, and surprise flash mobs. Bollywood and contemporary styles.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 10,
        "business_description": "Top sangeet choreographer for couple dances, family performances, and flash mobs.",
        "services_offered": [
            {"name": "Couple Dance Choreography", "base_price": 50000, "price_unit": "per package"},
            {"name": "Full Sangeet Package (8-10 acts)", "base_price": 120000, "price_unit": "per package"}
        ],
        "portfolio_images": []
    },
    {
        "name": "DJ Rink",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.3,
        "reviews": 180,
        "price_tier": "mid",
        "price_range": "₹80K-1.8L per event",
        "specialties": ["female DJ", "Bollywood", "EDM", "sangeet", "ladies sangeet"],
        "description": "Popular female DJ known for high-energy Bollywood and EDM sets. Great for ladies sangeet and mehendi events. Professional sound system included.",
        "operating_cities": ["Mumbai", "Delhi", "Goa"],
        "years_experience": 10,
        "business_description": "Popular female DJ for Bollywood and EDM. Great for ladies sangeet and mehendi.",
        "services_offered": [
            {"name": "DJ Night (4 hrs)", "base_price": 100000, "price_unit": "per event"},
            {"name": "Ladies Sangeet Set", "base_price": 80000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Mehendi by Rajasthani Henna Artists",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.4,
        "reviews": 300,
        "price_tier": "mid",
        "price_range": "₹30K-80K per event",
        "specialties": ["bridal mehendi", "Rajasthani", "Arabic", "portrait mehendi", "group mehendi"],
        "description": "Team of skilled Rajasthani mehendi artists for bridal and guest mehendi. Intricate Rajasthani, Arabic, and portrait styles. Can handle 100+ guests.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 15,
        "business_description": "Skilled Rajasthani mehendi artists for bridal and 100+ guest events.",
        "services_offered": [
            {"name": "Bridal Mehendi", "base_price": 15000, "price_unit": "per bride"},
            {"name": "Guest Mehendi (per 50 guests)", "base_price": 25000, "price_unit": "per package"}
        ],
        "portfolio_images": []
    },

    # Budget Entertainment
    {
        "name": "DJ Varun Mumbai",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.1,
        "reviews": 140,
        "price_tier": "budget",
        "price_range": "₹20K-60K per event",
        "specialties": ["Bollywood DJ", "sound system", "lighting", "budget"],
        "description": "Affordable DJ with professional sound and basic lighting setup. Good Bollywood and Punjabi track selection. Popular for budget sangeet and reception.",
        "operating_cities": ["Mumbai", "Thane", "Navi Mumbai"],
        "years_experience": 6,
        "business_description": "Affordable DJ with professional sound. Good Bollywood and Punjabi track selection.",
        "services_offered": [
            {"name": "DJ Night (4 hrs)", "base_price": 25000, "price_unit": "per event"},
            {"name": "DJ + Basic Lighting", "base_price": 40000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Dhol Tasha Mumbai",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.2,
        "reviews": 200,
        "price_tier": "budget",
        "price_range": "₹15K-40K per event",
        "specialties": ["dhol", "tasha", "baraat", "traditional", "Maharashtrian"],
        "description": "Traditional dhol-tasha group for baraat and wedding processions. Maharashtrian and Punjabi dhol players. Energetic performances for baraat and welcome ceremonies.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 12,
        "business_description": "Traditional dhol-tasha group for baraat and processions. Maharashtrian and Punjabi styles.",
        "services_offered": [
            {"name": "Baraat Dhol (2 hrs)", "base_price": 15000, "price_unit": "per event"},
            {"name": "Dhol + Tasha Group", "base_price": 30000, "price_unit": "per event"}
        ],
        "portfolio_images": []
    },
    {
        "name": "Henna Wala (Budget Mehendi)",
        "category": "entertainment",
        "city": "Mumbai",
        "rating": 4.0,
        "reviews": 160,
        "price_tier": "budget",
        "price_range": "₹10K-30K per event",
        "specialties": ["mehendi", "Arabic", "simple bridal", "guest mehendi", "affordable"],
        "description": "Affordable mehendi service for weddings. Clean Arabic and simple bridal designs. Team of 3-5 artists for guest mehendi. Quick application for large groups.",
        "operating_cities": ["Mumbai"],
        "years_experience": 10,
        "business_description": "Affordable mehendi service with clean Arabic designs. Team of 3-5 for large groups.",
        "services_offered": [
            {"name": "Bridal Mehendi (Simple)", "base_price": 5000, "price_unit": "per bride"},
            {"name": "Guest Mehendi (per 50 guests)", "base_price": 12000, "price_unit": "per package"}
        ],
        "portfolio_images": []
    },
]


def seed():
    """Seed Mumbai vendors into the running server."""
    print(f"Seeding {len(MUMBAI_VENDORS)} Mumbai vendors into {BASE}...")
    success = 0
    failed = 0
    for v in MUMBAI_VENDORS:
        # Build the payload in the format the API expects
        payload = {
            "name": v["name"],
            "category": v["category"],
            "business_description": v.get("business_description", v.get("description", "")),
            "operating_cities": v.get("operating_cities", ["Mumbai"]),
            "years_experience": v.get("years_experience", 5),
            "services_offered": v.get("services_offered", []),
            "portfolio_images": v.get("portfolio_images", []),
            # Extra marketplace fields
            "city": v.get("city", "Mumbai"),
            "rating": v.get("rating", 4.0),
            "reviews": v.get("reviews", 0),
            "price_tier": v.get("price_tier", "mid"),
            "price_range": v.get("price_range", ""),
            "specialties": v.get("specialties", []),
            "website": v.get("website", ""),
            "phone": v.get("phone", ""),
        }
        try:
            r = requests.post(f"{BASE}/api/vendors/register", json=payload, timeout=5)
            data = r.json()
            vid = data.get("data", {}).get("id", "?")
            # Auto-approve for marketplace seeding
            requests.patch(f"{BASE}/api/admin/vendors/{vid}/approve", timeout=5)
            print(f"  [OK] {v['name']} ({v['category']}, {v['price_tier']}, id={vid})")
            success += 1
        except Exception as e:
            print(f"  [FAIL] {v['name']}: {e}")
            failed += 1

    print(f"\nDone! {success} seeded, {failed} failed out of {len(MUMBAI_VENDORS)} total.")


def export_json(filepath="mumbai_vendors_seed.json"):
    """Export vendor data as JSON for use without the API."""
    import json
    with open(filepath, "w") as f:
        json.dump(MUMBAI_VENDORS, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(MUMBAI_VENDORS)} vendors to {filepath}")


if __name__ == "__main__":
    if "--json" in sys.argv:
        outpath = sys.argv[sys.argv.index("--json") + 1] if len(sys.argv) > sys.argv.index("--json") + 1 else "mumbai_vendors_seed.json"
        export_json(outpath)
    else:
        seed()
