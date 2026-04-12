#!/usr/bin/env python3
"""
Seed real Indian wedding vendors (Bangalore + Mumbai) into the running server via API.
Data sourced from WedMeGood and WeddingBazaar research.
Run: python scripts/seed_vendors.py
"""
import requests
import json

BASE = "http://localhost:8000"

VENDORS = [
    # ═══════════════════════════════════════════════════════════════
    # BANGALORE VENDORS
    # ═══════════════════════════════════════════════════════════════

    # ── BANGALORE PHOTOGRAPHY ──
    {
        "name": "ThyWed Stories",
        "category": "photography",
        "business_description": "Premium candid and cinematic wedding photography studio based in Bangalore. Known for emotional storytelling and beautifully composed frames that capture every nuance of your special day.",
        "operating_cities": ["Bangalore"],
        "years_experience": 7,
        "services_offered": [
            {"name": "Full Day Candid Coverage", "base_price": 65000, "price_unit": "per day"},
            {"name": "Cinematic Wedding Film", "base_price": 85000, "price_unit": "per day"},
            {"name": "Pre-wedding Shoot", "base_price": 35000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 67,
        "price_tier": "premium",
        "specialties": ["candid photography", "cinematic films", "destination weddings"]
    },
    {
        "name": "Pixel Chronicles",
        "category": "photography",
        "business_description": "Award-winning destination wedding photography team specializing in luxury weddings across India and abroad. Their signature style blends photojournalism with fine art portraiture for timeless wedding imagery.",
        "operating_cities": ["Bangalore", "Goa", "Udaipur"],
        "years_experience": 10,
        "services_offered": [
            {"name": "Full Day Coverage (2 Photographers)", "base_price": 95000, "price_unit": "per day"},
            {"name": "Destination Wedding Package", "base_price": 250000, "price_unit": "per wedding"},
            {"name": "Same Day Edit Video", "base_price": 45000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 72,
        "price_tier": "premium",
        "specialties": ["destination weddings", "fine art photography", "photojournalism"]
    },
    {
        "name": "WedNeo Photography",
        "category": "photography",
        "business_description": "Candid wedding photography specialists with a keen eye for natural moments and genuine emotions. WedNeo delivers beautifully edited albums with quick turnaround times at competitive mid-range pricing.",
        "operating_cities": ["Bangalore", "Mysore"],
        "years_experience": 6,
        "services_offered": [
            {"name": "Full Day Candid Coverage", "base_price": 50000, "price_unit": "per day"},
            {"name": "Photo + Video Combo", "base_price": 75000, "price_unit": "per day"},
            {"name": "Pre-wedding Shoot", "base_price": 25000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 86,
        "price_tier": "mid-range",
        "specialties": ["candid photography", "natural light", "quick delivery"]
    },
    {
        "name": "LightBucket Productions",
        "category": "photography",
        "business_description": "One of Bangalore's most reviewed premium wedding photography studios, LightBucket Productions is celebrated for their cinematic storytelling approach. Their team of experienced photographers and filmmakers create stunning visual narratives.",
        "operating_cities": ["Bangalore", "Chennai", "Hyderabad"],
        "years_experience": 9,
        "services_offered": [
            {"name": "Full Day Photo + Video", "base_price": 100000, "price_unit": "per day"},
            {"name": "Cinematic Highlight Film", "base_price": 60000, "price_unit": "per event"},
            {"name": "Drone Coverage", "base_price": 20000, "price_unit": "per day"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 180,
        "price_tier": "premium",
        "specialties": ["cinematic films", "drone coverage", "editorial photography"]
    },
    {
        "name": "WEDBONDS Photography",
        "category": "photography",
        "business_description": "Budget-friendly wedding photography that doesn't compromise on quality. WEDBONDS offers professional candid coverage, traditional photography, and video at affordable rates perfect for intimate weddings.",
        "operating_cities": ["Bangalore"],
        "years_experience": 4,
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 15000, "price_unit": "per day"},
            {"name": "Photo + Video Package", "base_price": 25000, "price_unit": "per day"},
            {"name": "Traditional Photography", "base_price": 10000, "price_unit": "per day"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 67,
        "price_tier": "budget",
        "specialties": ["budget weddings", "candid photography", "traditional coverage"]
    },
    {
        "name": "Artistic Pictures",
        "category": "photography",
        "business_description": "Affordable candid wedding photography with a creative edge. Artistic Pictures brings a fresh perspective to budget wedding photography, capturing real moments with artistic flair and vibrant editing styles.",
        "operating_cities": ["Bangalore"],
        "years_experience": 5,
        "services_offered": [
            {"name": "Full Day Candid Coverage", "base_price": 15000, "price_unit": "per day"},
            {"name": "Half Day Coverage", "base_price": 8000, "price_unit": "per event"},
            {"name": "Photo Album (30 pages)", "base_price": 8000, "price_unit": "per album"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 66,
        "price_tier": "budget",
        "specialties": ["candid photography", "creative editing", "budget-friendly"]
    },
    {
        "name": "Focus Wala",
        "category": "photography",
        "business_description": "Mid-range wedding photography studio offering a perfect blend of candid and traditional coverage. Focus Wala's team is known for their warm, vibrant editing style and efficient turnaround on deliverables.",
        "operating_cities": ["Bangalore", "Mangalore"],
        "years_experience": 6,
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 50000, "price_unit": "per day"},
            {"name": "Photo + Video Combo", "base_price": 70000, "price_unit": "per day"},
            {"name": "Pre-wedding Shoot", "base_price": 20000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 63,
        "price_tier": "mid-range",
        "specialties": ["candid photography", "traditional coverage", "vibrant editing"]
    },

    # ── BANGALORE VENUES ──
    {
        "name": "The Beginning",
        "category": "venue",
        "business_description": "Premium banquet and convention hall in Bangalore offering elegant indoor spaces for grand weddings. Known for impeccable service, modern amenities, and customizable decor packages for up to 1500 guests.",
        "operating_cities": ["Bangalore"],
        "years_experience": 12,
        "services_offered": [
            {"name": "Full Venue Rental", "base_price": 700000, "price_unit": "per function"},
            {"name": "Venue + Basic Decor", "base_price": 900000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 162,
        "price_tier": "premium",
        "specialties": ["grand weddings", "banquet hall", "customizable decor"]
    },
    {
        "name": "Aarambha",
        "category": "venue",
        "business_description": "Versatile mid-range wedding venue in Bangalore offering both indoor and outdoor spaces. Aarambha provides excellent per-plate catering with multi-cuisine menus and professional event coordination.",
        "operating_cities": ["Bangalore"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 800, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 1000, "price_unit": "per plate"},
            {"name": "Venue Only (Half Day)", "base_price": 200000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 49,
        "price_tier": "mid-range",
        "specialties": ["multi-cuisine catering", "indoor-outdoor spaces", "event coordination"]
    },
    {
        "name": "Valura",
        "category": "venue",
        "business_description": "A scenic resort-style wedding venue on the outskirts of Bangalore, Valura offers lush green lawns and elegant indoor halls. Perfect for couples wanting a destination-wedding feel without traveling far.",
        "operating_cities": ["Bangalore"],
        "years_experience": 6,
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 700, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 900, "price_unit": "per plate"},
            {"name": "Full Venue Rental", "base_price": 250000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 23,
        "price_tier": "mid-range",
        "specialties": ["resort venue", "outdoor lawns", "destination-feel weddings"]
    },
    {
        "name": "LaLiT Ashok Bangalore",
        "category": "venue",
        "business_description": "Iconic 5-star luxury hotel in the heart of Bangalore offering world-class wedding venues with grand ballrooms and manicured gardens. The LaLiT Ashok delivers an unmatched premium wedding experience with impeccable hospitality.",
        "operating_cities": ["Bangalore"],
        "years_experience": 30,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 3000, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 3500, "price_unit": "per plate"},
            {"name": "Grand Ballroom Rental", "base_price": 500000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.6,
        "reviews_count": 120,
        "price_tier": "premium",
        "specialties": ["5-star luxury", "grand ballroom", "heritage property"]
    },
    {
        "name": "Goldfinch Retreat",
        "category": "venue",
        "business_description": "A comfortable and affordable hotel wedding venue in Bangalore offering well-maintained banquet halls and reliable catering. Ideal for mid-sized weddings of 100-500 guests seeking good value.",
        "operating_cities": ["Bangalore"],
        "years_experience": 14,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 1000, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 1200, "price_unit": "per plate"},
            {"name": "Hall Rental", "base_price": 150000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 45,
        "price_tier": "budget",
        "specialties": ["affordable weddings", "hotel venue", "mid-sized events"]
    },
    {
        "name": "Panchavati Pavilion",
        "category": "venue",
        "business_description": "Premium outdoor wedding venue in Bangalore known for its beautiful open-air pavilion and lush garden setting. Panchavati offers a grand stage for traditional Indian wedding ceremonies with modern facilities.",
        "operating_cities": ["Bangalore"],
        "years_experience": 15,
        "services_offered": [
            {"name": "Full Venue Rental", "base_price": 725000, "price_unit": "per function"},
            {"name": "Venue + Catering Package", "base_price": 900000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 55,
        "price_tier": "premium",
        "specialties": ["outdoor venue", "garden weddings", "traditional ceremonies"]
    },

    # ── BANGALORE CATERING ──
    {
        "name": "Ashirwad Caterers Bangalore",
        "category": "catering",
        "business_description": "Well-established multi-cuisine wedding caterer in Bangalore with decades of experience. Ashirwad offers extensive North Indian, South Indian, and Continental menus with live counters and professional service staff.",
        "operating_cities": ["Bangalore"],
        "years_experience": 20,
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 800, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 1100, "price_unit": "per plate"},
            {"name": "Live Counter Setup", "base_price": 15000, "price_unit": "per counter"}
        ],
        "portfolio_images": [],
        "rating": 4.7,
        "reviews_count": 35,
        "price_tier": "mid-range",
        "specialties": ["multi-cuisine", "live counters", "large events"]
    },
    {
        "name": "Narmada Caterers",
        "category": "catering",
        "business_description": "Budget-friendly wedding caterers offering wholesome and delicious meals for wedding functions in Bangalore. Narmada specializes in traditional South Indian and North Indian vegetarian menus at affordable rates.",
        "operating_cities": ["Bangalore"],
        "years_experience": 10,
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 450, "price_unit": "per plate"},
            {"name": "Veg Buffet (15 items)", "base_price": 550, "price_unit": "per plate"},
            {"name": "Sweet Counter", "base_price": 8000, "price_unit": "per counter"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 8,
        "price_tier": "budget",
        "specialties": ["budget catering", "vegetarian", "South Indian cuisine"]
    },
    {
        "name": "Aahara by Siri Caterers",
        "category": "catering",
        "business_description": "Premium South Indian specialty caterer in Bangalore known for authentic Karnataka and Tamil Nadu wedding menus. Aahara brings traditional flavors with modern presentation, using fresh local ingredients and skilled chefs.",
        "operating_cities": ["Bangalore", "Mysore"],
        "years_experience": 12,
        "services_offered": [
            {"name": "Premium Veg Buffet", "base_price": 1200, "price_unit": "per plate"},
            {"name": "South Indian Feast", "base_price": 1000, "price_unit": "per plate"},
            {"name": "Dessert & Beverage Counter", "base_price": 20000, "price_unit": "per counter"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 11,
        "price_tier": "premium",
        "specialties": ["South Indian cuisine", "traditional Karnataka food", "premium presentation"]
    },
    {
        "name": "Prakash Caterers",
        "category": "catering",
        "business_description": "Reliable and affordable wedding caterer serving Bangalore for many years. Prakash Caterers offers both North Indian and South Indian menus with consistent quality, making them a popular choice for budget-conscious families.",
        "operating_cities": ["Bangalore"],
        "years_experience": 18,
        "services_offered": [
            {"name": "Veg Per Plate", "base_price": 500, "price_unit": "per plate"},
            {"name": "Non-Veg Per Plate", "base_price": 700, "price_unit": "per plate"},
            {"name": "Chaat & Snack Counter", "base_price": 10000, "price_unit": "per counter"}
        ],
        "portfolio_images": [],
        "rating": 4.5,
        "reviews_count": 22,
        "price_tier": "budget",
        "specialties": ["North Indian", "South Indian", "affordable menus"]
    },

    # ── BANGALORE MAKEUP ──
    {
        "name": "Parul Khattar Makeovers",
        "category": "makeup",
        "business_description": "Highly-rated bridal makeup artist in Bangalore with nearly 300 glowing reviews. Parul specializes in airbrush and HD bridal looks that photograph beautifully, blending contemporary techniques with traditional Indian bridal aesthetics.",
        "operating_cities": ["Bangalore", "Mysore"],
        "years_experience": 10,
        "services_offered": [
            {"name": "Bridal Makeup (HD)", "base_price": 18000, "price_unit": "per look"},
            {"name": "Reception Look", "base_price": 12000, "price_unit": "per look"},
            {"name": "Engagement Look", "base_price": 10000, "price_unit": "per look"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 296,
        "price_tier": "mid-range",
        "specialties": ["HD makeup", "airbrush", "South Indian bridal"]
    },
    {
        "name": "Makeup by Ragini Singh",
        "category": "makeup",
        "business_description": "Budget-friendly bridal makeup artist offering professional quality looks at accessible prices. Ragini brings warmth and skill to every bride, creating flawless looks for all skin tones and wedding styles.",
        "operating_cities": ["Bangalore"],
        "years_experience": 5,
        "services_offered": [
            {"name": "Bridal Makeup", "base_price": 8000, "price_unit": "per look"},
            {"name": "Party/Reception Look", "base_price": 5000, "price_unit": "per look"},
            {"name": "Saree Draping", "base_price": 1500, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 95,
        "price_tier": "budget",
        "specialties": ["budget bridal makeup", "all skin tones", "saree draping"]
    },
    {
        "name": "Makeup By Jyoti Sing",
        "category": "makeup",
        "business_description": "Popular bridal makeup artist in Bangalore offering a great balance of quality and affordability. Jyoti is known for her natural bridal looks, excellent skin prep, and expertise with both traditional and contemporary styles.",
        "operating_cities": ["Bangalore"],
        "years_experience": 7,
        "services_offered": [
            {"name": "Bridal Makeup", "base_price": 10000, "price_unit": "per look"},
            {"name": "Engagement Look", "base_price": 7000, "price_unit": "per look"},
            {"name": "Family Makeup", "base_price": 4000, "price_unit": "per person"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 142,
        "price_tier": "budget",
        "specialties": ["natural bridal looks", "skin prep", "traditional styles"]
    },
    {
        "name": "Face Sculptures",
        "category": "makeup",
        "business_description": "Mid-range bridal makeup studio in Bangalore known for sculpted, camera-ready bridal looks. Face Sculptures uses high-end products and modern contouring techniques to create stunning transformations for brides.",
        "operating_cities": ["Bangalore"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Bridal HD Makeup", "base_price": 15000, "price_unit": "per look"},
            {"name": "Reception Look", "base_price": 10000, "price_unit": "per look"},
            {"name": "Trial Session", "base_price": 3000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 50,
        "price_tier": "mid-range",
        "specialties": ["HD makeup", "contouring", "camera-ready looks"]
    },
    {
        "name": "Akshathaas Makeover",
        "category": "makeup",
        "business_description": "Skilled bridal makeup artist offering elegant and long-lasting bridal looks in the mid-range segment. Akshathaas specializes in South Indian bridal styles including traditional Kannadiga and Kerala looks.",
        "operating_cities": ["Bangalore"],
        "years_experience": 6,
        "services_offered": [
            {"name": "Bridal Makeup", "base_price": 12000, "price_unit": "per look"},
            {"name": "Mehendi/Haldi Look", "base_price": 6000, "price_unit": "per look"},
            {"name": "Hair Styling", "base_price": 3000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 32,
        "price_tier": "mid-range",
        "specialties": ["South Indian bridal", "Kannadiga bridal", "hair styling"]
    },

    # ── BANGALORE DECORATION ──
    {
        "name": "TaamJhaam Weddings",
        "category": "decoration",
        "business_description": "Creative mid-range wedding decoration company in Bangalore delivering stunning floral mandaps, stage setups, and entrance decor. TaamJhaam is loved for their attention to detail and ability to execute diverse themes on budget.",
        "operating_cities": ["Bangalore"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Full Wedding Decor", "base_price": 65000, "price_unit": "per function"},
            {"name": "Stage & Mandap Setup", "base_price": 40000, "price_unit": "per setup"},
            {"name": "Entrance & Pathway Decor", "base_price": 25000, "price_unit": "per setup"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 122,
        "price_tier": "mid-range",
        "specialties": ["floral mandaps", "theme decor", "budget-conscious design"]
    },
    {
        "name": "Glitttering Arc Events",
        "category": "decoration",
        "business_description": "Premium wedding decoration and event design studio in Bangalore known for lavish, Instagram-worthy setups. They specialize in grand floral installations, luxury draping, and bespoke lighting design for high-end weddings.",
        "operating_cities": ["Bangalore", "Mysore"],
        "years_experience": 10,
        "services_offered": [
            {"name": "Premium Wedding Decor", "base_price": 100000, "price_unit": "per function"},
            {"name": "Grand Floral Installation", "base_price": 150000, "price_unit": "per setup"},
            {"name": "Lighting Design", "base_price": 50000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 116,
        "price_tier": "premium",
        "specialties": ["luxury decor", "floral installations", "lighting design"]
    },
    {
        "name": "Panigrahana Decor",
        "category": "decoration",
        "business_description": "Popular mid-range wedding decorator in Bangalore with a strong portfolio of traditional and contemporary setups. Panigrahana excels at creating beautiful mandap designs and reception stage decor with fresh flowers.",
        "operating_cities": ["Bangalore"],
        "years_experience": 9,
        "services_offered": [
            {"name": "Full Wedding Decor", "base_price": 75000, "price_unit": "per function"},
            {"name": "Mandap Design", "base_price": 45000, "price_unit": "per setup"},
            {"name": "Reception Stage", "base_price": 35000, "price_unit": "per setup"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 141,
        "price_tier": "mid-range",
        "specialties": ["mandap design", "fresh flower decor", "traditional setups"]
    },
    {
        "name": "Unique Events Decor",
        "category": "decoration",
        "business_description": "Budget-friendly wedding decoration services in Bangalore offering clean, attractive setups at accessible prices. Unique Events uses a smart mix of fresh and artificial elements to deliver beautiful decor without breaking the bank.",
        "operating_cities": ["Bangalore"],
        "years_experience": 5,
        "services_offered": [
            {"name": "Basic Wedding Decor", "base_price": 20000, "price_unit": "per function"},
            {"name": "Stage Setup", "base_price": 12000, "price_unit": "per setup"},
            {"name": "Car Decoration", "base_price": 5000, "price_unit": "per car"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 61,
        "price_tier": "budget",
        "specialties": ["budget decor", "simple elegant setups", "car decoration"]
    },
    {
        "name": "Decor by Aditya",
        "category": "decoration",
        "business_description": "Mid-to-premium wedding decorator in Bangalore offering sophisticated, modern decor concepts. Aditya's team brings a design-forward approach with curated color palettes, statement pieces, and cohesive event styling.",
        "operating_cities": ["Bangalore"],
        "years_experience": 7,
        "services_offered": [
            {"name": "Full Event Decor", "base_price": 120000, "price_unit": "per function"},
            {"name": "Concept Design & Styling", "base_price": 80000, "price_unit": "per function"},
            {"name": "Mehendi / Haldi Decor", "base_price": 40000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 63,
        "price_tier": "mid-range",
        "specialties": ["modern design", "curated themes", "event styling"]
    },

    # ── BANGALORE ENTERTAINMENT ──
    {
        "name": "ChoreoFunk Entertainment Bangalore",
        "category": "entertainment",
        "business_description": "High-energy entertainment company offering professional sangeet choreography, DJ services, and emcee packages. ChoreoFunk brings the fun with custom Bollywood dance routines and seamless sangeet coordination.",
        "operating_cities": ["Bangalore"],
        "years_experience": 7,
        "services_offered": [
            {"name": "Sangeet Choreography (per couple)", "base_price": 15000, "price_unit": "per routine"},
            {"name": "DJ Night", "base_price": 50000, "price_unit": "per event"},
            {"name": "Choreography + DJ Combo", "base_price": 75000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 45,
        "price_tier": "mid-range",
        "specialties": ["sangeet choreography", "Bollywood dance", "DJ services"]
    },
    {
        "name": "Sound Nation Bangalore",
        "category": "entertainment",
        "business_description": "Budget-friendly DJ and sound system rental service for weddings in Bangalore. Sound Nation provides reliable equipment, experienced DJs, and a massive collection of Bollywood, Kannada, and international tracks.",
        "operating_cities": ["Bangalore"],
        "years_experience": 6,
        "services_offered": [
            {"name": "DJ Night (4 hours)", "base_price": 25000, "price_unit": "per event"},
            {"name": "DJ + Sound System (Full Day)", "base_price": 50000, "price_unit": "per event"},
            {"name": "Sound System Rental Only", "base_price": 12000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.7,
        "reviews_count": 38,
        "price_tier": "budget",
        "specialties": ["budget DJ", "sound rental", "Kannada music"]
    },
    {
        "name": "Rhythm & Blues Live Bangalore",
        "category": "entertainment",
        "business_description": "Live wedding band and entertainment troupe based in Bangalore performing Bollywood, Carnatic fusion, and Western music. Perfect for couples who want live instruments and soulful vocals at their reception or sangeet.",
        "operating_cities": ["Bangalore", "Chennai"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Live Band (3 hours)", "base_price": 80000, "price_unit": "per event"},
            {"name": "Acoustic Duo Set", "base_price": 35000, "price_unit": "per event"},
            {"name": "Full Band + DJ Combo", "base_price": 120000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 28,
        "price_tier": "mid-range",
        "specialties": ["live band", "Carnatic fusion", "acoustic sets"]
    },
    {
        "name": "Namma DJ Events",
        "category": "entertainment",
        "business_description": "Local Bangalore DJ and entertainment service known for blending Kannada folk music with Bollywood hits. Namma DJ offers LED dance floors, fog machines, and laser lights to create an electrifying party atmosphere.",
        "operating_cities": ["Bangalore"],
        "years_experience": 5,
        "services_offered": [
            {"name": "DJ Night with Lighting", "base_price": 35000, "price_unit": "per event"},
            {"name": "LED Dance Floor Setup", "base_price": 25000, "price_unit": "per setup"},
            {"name": "Dhol Players (2)", "base_price": 15000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 22,
        "price_tier": "budget",
        "specialties": ["Kannada folk", "LED dance floor", "dhol players"]
    },

    # ═══════════════════════════════════════════════════════════════
    # MUMBAI VENDORS
    # ═══════════════════════════════════════════════════════════════

    # ── MUMBAI PHOTOGRAPHY ──
    {
        "name": "That Big Day Photography",
        "category": "photography",
        "business_description": "Well-known Mumbai wedding photography studio delivering stunning candid and traditional coverage. That Big Day combines artistic vision with technical excellence, capturing the grandeur and intimacy of Indian weddings.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 9,
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 60000, "price_unit": "per day"},
            {"name": "Photo + Video Package", "base_price": 90000, "price_unit": "per day"},
            {"name": "Pre-wedding Shoot", "base_price": 30000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 110,
        "price_tier": "mid-range",
        "specialties": ["candid coverage", "traditional photography", "pre-wedding shoots"]
    },
    {
        "name": "That One Affair",
        "category": "photography",
        "business_description": "Premium boutique wedding photography studio in Mumbai known for their editorial and fashion-forward approach. That One Affair creates magazine-worthy wedding imagery with meticulous attention to lighting and composition.",
        "operating_cities": ["Mumbai", "Goa", "Udaipur"],
        "years_experience": 11,
        "services_offered": [
            {"name": "Full Day Coverage (2 Photographers)", "base_price": 90000, "price_unit": "per day"},
            {"name": "Cinematic Wedding Film", "base_price": 120000, "price_unit": "per day"},
            {"name": "Destination Wedding Package", "base_price": 300000, "price_unit": "per wedding"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 60,
        "price_tier": "premium",
        "specialties": ["editorial style", "fashion photography", "destination weddings"]
    },
    {
        "name": "Sam Jagdale Photography",
        "category": "photography",
        "business_description": "Premium cinematic wedding photographer and filmmaker based in Mumbai. Sam's work is celebrated for its emotional depth, cinematic framing, and ability to tell love stories through powerful visual narratives.",
        "operating_cities": ["Mumbai", "Pune", "Goa"],
        "years_experience": 12,
        "services_offered": [
            {"name": "Full Day Photo Coverage", "base_price": 75000, "price_unit": "per day"},
            {"name": "Cinematic Film", "base_price": 100000, "price_unit": "per day"},
            {"name": "Same Day Edit", "base_price": 40000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 54,
        "price_tier": "premium",
        "specialties": ["cinematic films", "emotional storytelling", "same day edits"]
    },
    {
        "name": "Eternity Wedding Films",
        "category": "photography",
        "business_description": "Mid-range wedding photography and film studio in Mumbai delivering high-quality coverage at competitive prices. Eternity Wedding Films is appreciated for their warm editing style, reliable service, and comprehensive packages.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 55000, "price_unit": "per day"},
            {"name": "Photo + Video Combo", "base_price": 80000, "price_unit": "per day"},
            {"name": "Photo Album (40 pages)", "base_price": 12000, "price_unit": "per album"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 58,
        "price_tier": "mid-range",
        "specialties": ["wedding films", "warm editing", "comprehensive packages"]
    },
    {
        "name": "Wedding Art Photography",
        "category": "photography",
        "business_description": "Affordable wedding photography service in Mumbai offering professional-quality candid and traditional coverage. Wedding Art is a great choice for budget-conscious couples who still want beautiful, well-edited wedding photos.",
        "operating_cities": ["Mumbai", "Navi Mumbai"],
        "years_experience": 5,
        "services_offered": [
            {"name": "Full Day Coverage", "base_price": 25000, "price_unit": "per day"},
            {"name": "Half Day Coverage", "base_price": 15000, "price_unit": "per event"},
            {"name": "Photo + Video Package", "base_price": 40000, "price_unit": "per day"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 42,
        "price_tier": "budget",
        "specialties": ["budget photography", "candid coverage", "traditional shots"]
    },

    # ── MUMBAI VENUES ──
    {
        "name": "Fairmont Mumbai",
        "category": "venue",
        "business_description": "Ultra-luxury 5-star hotel venue in Mumbai offering opulent ballrooms and sophisticated outdoor spaces for grand weddings. Fairmont delivers world-class hospitality with bespoke wedding packages for 200 to 800 guests.",
        "operating_cities": ["Mumbai"],
        "years_experience": 15,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 7000, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 8000, "price_unit": "per plate"},
            {"name": "Grand Ballroom Rental", "base_price": 800000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 85,
        "price_tier": "premium",
        "specialties": ["5-star luxury", "grand ballroom", "bespoke packages"]
    },
    {
        "name": "Taj Lands End Mumbai",
        "category": "venue",
        "business_description": "Iconic Taj property offering breathtaking sea views and legendary hospitality for dream weddings. Taj Lands End combines heritage grandeur with modern elegance, providing multiple indoor and outdoor wedding spaces.",
        "operating_cities": ["Mumbai"],
        "years_experience": 25,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 3250, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 4000, "price_unit": "per plate"},
            {"name": "Venue Rental", "base_price": 600000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 150,
        "price_tier": "premium",
        "specialties": ["sea-view venue", "heritage property", "Taj hospitality"]
    },
    {
        "name": "The Leela Mumbai",
        "category": "venue",
        "business_description": "Premium 5-star luxury hotel near Mumbai airport offering grand wedding celebrations with impeccable service. The Leela features stunning chandeliered ballrooms, manicured lawns, and award-winning culinary teams.",
        "operating_cities": ["Mumbai"],
        "years_experience": 20,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 4000, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 4500, "price_unit": "per plate"},
            {"name": "Ballroom + Lawn Package", "base_price": 700000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 110,
        "price_tier": "premium",
        "specialties": ["5-star luxury", "airport proximity", "award-winning cuisine"]
    },
    {
        "name": "Hotel Parle International",
        "category": "venue",
        "business_description": "Mid-range hotel wedding venue in Vile Parle, Mumbai, offering well-appointed banquet halls for 100 to 400 guests. Known for reliable service, good food, and central location making it convenient for guests.",
        "operating_cities": ["Mumbai"],
        "years_experience": 18,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 1600, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 1900, "price_unit": "per plate"},
            {"name": "Hall Rental", "base_price": 200000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 65,
        "price_tier": "mid-range",
        "specialties": ["central location", "mid-sized weddings", "reliable service"]
    },
    {
        "name": "Jade Luxury Banquets",
        "category": "venue",
        "business_description": "Elegant mid-premium banquet venue in Mumbai featuring contemporary interiors and versatile event spaces. Jade offers customizable decor options, in-house catering with diverse menus, and dedicated wedding coordinators.",
        "operating_cities": ["Mumbai"],
        "years_experience": 10,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 3200, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 3800, "price_unit": "per plate"},
            {"name": "Full Venue Rental", "base_price": 400000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 12,
        "price_tier": "mid-range",
        "specialties": ["contemporary interiors", "customizable decor", "wedding coordination"]
    },
    {
        "name": "Royal Garden Lawns Virar",
        "category": "venue",
        "business_description": "Affordable outdoor wedding venue in Virar, on the outskirts of Mumbai, offering spacious green lawns for large gatherings. Royal Garden provides budget-friendly packages with basic amenities and ample parking.",
        "operating_cities": ["Mumbai"],
        "years_experience": 12,
        "services_offered": [
            {"name": "Per Plate (Veg)", "base_price": 499, "price_unit": "per plate"},
            {"name": "Per Plate (Non-Veg)", "base_price": 650, "price_unit": "per plate"},
            {"name": "Lawn Rental", "base_price": 80000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 4.5,
        "reviews_count": 30,
        "price_tier": "budget",
        "specialties": ["outdoor lawns", "budget weddings", "large gatherings"]
    },

    # ── MUMBAI CATERING ──
    {
        "name": "Annapurna Caterers Mumbai",
        "category": "catering",
        "business_description": "One of Mumbai's most established wedding caterers since 1985, Annapurna handles large-scale events for up to 3000 guests with ease. Their premium multi-cuisine menus, live counters, and impeccable service have made them the caterer of choice for grand Mumbai weddings.",
        "operating_cities": ["Mumbai", "Thane", "Navi Mumbai"],
        "years_experience": 40,
        "services_offered": [
            {"name": "Premium Veg Buffet", "base_price": 1500, "price_unit": "per plate"},
            {"name": "Premium Non-Veg Buffet", "base_price": 2000, "price_unit": "per plate"},
            {"name": "Live Counter Package (5 counters)", "base_price": 50000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 95,
        "price_tier": "premium",
        "specialties": ["large-scale events", "multi-cuisine", "established since 1985"]
    },
    {
        "name": "Copper Catering",
        "category": "catering",
        "business_description": "Modern mid-range wedding caterer in Mumbai known for innovative food presentation and contemporary plating. Copper Catering brings a fresh approach to wedding food with fusion menus and Instagram-worthy live stations.",
        "operating_cities": ["Mumbai"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Veg Buffet", "base_price": 1695, "price_unit": "per plate"},
            {"name": "Non-Veg Buffet", "base_price": 2100, "price_unit": "per plate"},
            {"name": "Live Station Setup", "base_price": 18000, "price_unit": "per counter"}
        ],
        "portfolio_images": [],
        "rating": 4.7,
        "reviews_count": 40,
        "price_tier": "mid-range",
        "specialties": ["modern presentation", "fusion menus", "live stations"]
    },
    {
        "name": "Kamath Gourmet",
        "category": "catering",
        "business_description": "Budget-friendly South Indian specialty caterer in Mumbai offering authentic Karnataka and coastal cuisine. Kamath Gourmet is a popular choice for Mangalorean, Udupi, and South Canara wedding menus at affordable rates.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 15,
        "services_offered": [
            {"name": "South Indian Veg Buffet", "base_price": 500, "price_unit": "per plate"},
            {"name": "Coastal Non-Veg Buffet", "base_price": 750, "price_unit": "per plate"},
            {"name": "Dosa & Idli Counter", "base_price": 8000, "price_unit": "per counter"}
        ],
        "portfolio_images": [],
        "rating": 4.6,
        "reviews_count": 28,
        "price_tier": "budget",
        "specialties": ["South Indian cuisine", "coastal food", "Mangalorean menu"]
    },
    {
        "name": "Green Leaf Foods",
        "category": "catering",
        "business_description": "Vegetarian wedding caterer in Mumbai specializing in pure-veg, Jain, and Sattvic menus. Green Leaf uses fresh, locally-sourced ingredients and offers a wide variety of regional Indian vegetarian cuisines for wedding celebrations.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 12,
        "services_offered": [
            {"name": "Veg Buffet", "base_price": 700, "price_unit": "per plate"},
            {"name": "Jain Special Buffet", "base_price": 800, "price_unit": "per plate"},
            {"name": "Gujarati Thali", "base_price": 650, "price_unit": "per plate"}
        ],
        "portfolio_images": [],
        "rating": 4.7,
        "reviews_count": 35,
        "price_tier": "budget",
        "specialties": ["pure vegetarian", "Jain food", "Gujarati cuisine"]
    },

    # ── MUMBAI MAKEUP ──
    {
        "name": "Kavitaseth Artistry",
        "category": "makeup",
        "business_description": "Premium celebrity bridal makeup artist in Mumbai with a loyal following of over 130 reviews. Kavita creates flawless, high-definition bridal looks using luxury products, with expertise in airbrush, editorial, and contemporary Indian bridal styles.",
        "operating_cities": ["Mumbai", "Pune", "Goa"],
        "years_experience": 14,
        "services_offered": [
            {"name": "Bridal Airbrush Makeup", "base_price": 40000, "price_unit": "per look"},
            {"name": "Reception Look", "base_price": 25000, "price_unit": "per look"},
            {"name": "Trial Session", "base_price": 8000, "price_unit": "per session"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 132,
        "price_tier": "premium",
        "specialties": ["airbrush makeup", "celebrity MUA", "editorial bridal"]
    },
    {
        "name": "Varsha Thapa Makeup",
        "category": "makeup",
        "business_description": "Mid-premium bridal makeup artist in Mumbai blending contemporary trends with classic Indian bridal beauty. Varsha is known for her dewy, glowing bridal looks and expert color-matching for all Indian skin tones.",
        "operating_cities": ["Mumbai"],
        "years_experience": 9,
        "services_offered": [
            {"name": "Bridal HD Makeup", "base_price": 25000, "price_unit": "per look"},
            {"name": "Engagement Look", "base_price": 15000, "price_unit": "per look"},
            {"name": "Family Package (5 persons)", "base_price": 40000, "price_unit": "per package"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 74,
        "price_tier": "mid-range",
        "specialties": ["dewy looks", "HD makeup", "color matching"]
    },
    {
        "name": "Makeup by Jacqueline",
        "category": "makeup",
        "business_description": "Versatile mid-range bridal makeup artist in Mumbai known for creating both glamorous and natural bridal looks. Jacqueline works with diverse skin types and excels at creating long-lasting looks that survive Mumbai's humidity.",
        "operating_cities": ["Mumbai"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Bridal Makeup", "base_price": 18000, "price_unit": "per look"},
            {"name": "Reception Look", "base_price": 12000, "price_unit": "per look"},
            {"name": "Mehendi/Haldi Look", "base_price": 8000, "price_unit": "per look"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 85,
        "price_tier": "mid-range",
        "specialties": ["humidity-proof makeup", "versatile styles", "diverse skin types"]
    },
    {
        "name": "Yashika Panchal Makeup",
        "category": "makeup",
        "business_description": "Budget-friendly bridal makeup artist in Mumbai delivering polished, professional looks at accessible prices. Yashika has built a strong reputation with over 100 reviews for her consistency, warmth, and skill with Indian bridal aesthetics.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 6,
        "services_offered": [
            {"name": "Bridal Makeup", "base_price": 14000, "price_unit": "per look"},
            {"name": "Party Look", "base_price": 8000, "price_unit": "per look"},
            {"name": "Saree Draping + Makeup", "base_price": 10000, "price_unit": "per look"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 104,
        "price_tier": "budget",
        "specialties": ["budget bridal", "Indian aesthetics", "saree draping"]
    },
    {
        "name": "Gurpreet Raina Makeup",
        "category": "makeup",
        "business_description": "Affordable bridal makeup artist in Mumbai offering professional quality bridal, engagement, and party looks. Gurpreet is popular among budget-conscious brides for delivering elegant, long-lasting makeup at great value.",
        "operating_cities": ["Mumbai"],
        "years_experience": 5,
        "services_offered": [
            {"name": "Bridal Makeup", "base_price": 12000, "price_unit": "per look"},
            {"name": "Engagement Look", "base_price": 7000, "price_unit": "per look"},
            {"name": "Family Makeup", "base_price": 3500, "price_unit": "per person"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 66,
        "price_tier": "budget",
        "specialties": ["budget bridal", "long-lasting makeup", "family makeup"]
    },

    # ── MUMBAI DECORATION ──
    {
        "name": "DG Wedding Decor",
        "category": "decoration",
        "business_description": "Mid-premium wedding decorator in Mumbai offering sophisticated and elegant wedding setups. DG specializes in modern mandap designs, luxurious stage backdrops, and cohesive event styling across all wedding functions.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 10,
        "services_offered": [
            {"name": "Full Wedding Decor", "base_price": 200000, "price_unit": "per function"},
            {"name": "Stage & Mandap Setup", "base_price": 120000, "price_unit": "per setup"},
            {"name": "Mehendi Decor", "base_price": 60000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 48,
        "price_tier": "mid-range",
        "specialties": ["modern mandaps", "luxury backdrops", "cohesive styling"]
    },
    {
        "name": "Fleuron India",
        "category": "decoration",
        "business_description": "Premium luxury floral wedding decorator in Mumbai creating breathtaking installations with thousands of fresh flowers. Fleuron is the go-to for couples wanting opulent, magazine-worthy floral mandaps, ceiling installations, and pathway decor.",
        "operating_cities": ["Mumbai", "Goa"],
        "years_experience": 12,
        "services_offered": [
            {"name": "Luxury Floral Decor", "base_price": 400000, "price_unit": "per function"},
            {"name": "Grand Floral Mandap", "base_price": 250000, "price_unit": "per setup"},
            {"name": "Ceiling Floral Installation", "base_price": 150000, "price_unit": "per setup"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 35,
        "price_tier": "premium",
        "specialties": ["luxury florals", "grand installations", "ceiling decor"]
    },
    {
        "name": "To The Aisle Decor",
        "category": "decoration",
        "business_description": "Premium bespoke wedding design and decor studio in Mumbai creating one-of-a-kind wedding experiences. Each project is custom designed from concept to execution, with a focus on unique themes and artistic expression.",
        "operating_cities": ["Mumbai"],
        "years_experience": 8,
        "services_offered": [
            {"name": "Full Bespoke Wedding Decor", "base_price": 500000, "price_unit": "per function"},
            {"name": "Concept Design + Execution", "base_price": 350000, "price_unit": "per function"},
            {"name": "Reception Decor", "base_price": 200000, "price_unit": "per function"}
        ],
        "portfolio_images": [],
        "rating": 5.0,
        "reviews_count": 9,
        "price_tier": "premium",
        "specialties": ["bespoke design", "custom themes", "artistic expression"]
    },
    {
        "name": "Uours Decorator",
        "category": "decoration",
        "business_description": "Budget-friendly wedding decorator in Mumbai delivering attractive and well-executed setups at competitive prices. Uours handles everything from simple mandaps to full venue decoration, making beautiful weddings accessible to all budgets.",
        "operating_cities": ["Mumbai", "Navi Mumbai"],
        "years_experience": 7,
        "services_offered": [
            {"name": "Full Wedding Decor", "base_price": 80000, "price_unit": "per function"},
            {"name": "Stage Setup", "base_price": 40000, "price_unit": "per setup"},
            {"name": "Entrance & Pathway", "base_price": 25000, "price_unit": "per setup"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 20,
        "price_tier": "budget",
        "specialties": ["budget decor", "value packages", "simple mandaps"]
    },
    {
        "name": "ShubhMangal Events",
        "category": "decoration",
        "business_description": "Affordable wedding event decorator in Mumbai offering complete decor solutions for all wedding functions. ShubhMangal combines traditional elements with modern touches, providing good quality setups at budget-friendly prices.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 6,
        "services_offered": [
            {"name": "Full Wedding Decor", "base_price": 80000, "price_unit": "per function"},
            {"name": "Mandap + Stage Combo", "base_price": 50000, "price_unit": "per setup"},
            {"name": "Car Decoration", "base_price": 5000, "price_unit": "per car"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 25,
        "price_tier": "budget",
        "specialties": ["budget decor", "traditional elements", "complete solutions"]
    },

    # ── MUMBAI ENTERTAINMENT ──
    {
        "name": "DJ Lemon Mumbai",
        "category": "entertainment",
        "business_description": "Celebrity DJ and Bollywood remix artist known across India for high-energy performances. DJ Lemon brings star power to wedding sangeets and receptions with custom mixes, professional sound systems, and electrifying stage presence.",
        "operating_cities": ["Mumbai", "Delhi", "Goa"],
        "years_experience": 15,
        "services_offered": [
            {"name": "DJ Performance (3 hours)", "base_price": 200000, "price_unit": "per event"},
            {"name": "DJ + Full Sound & Lighting", "base_price": 300000, "price_unit": "per event"},
            {"name": "Extended Set (per hour)", "base_price": 50000, "price_unit": "per hour"}
        ],
        "portfolio_images": [],
        "rating": 4.9,
        "reviews_count": 75,
        "price_tier": "premium",
        "specialties": ["celebrity DJ", "Bollywood remixes", "high-energy performances"]
    },
    {
        "name": "ChoreoFunk Mumbai",
        "category": "entertainment",
        "business_description": "Professional sangeet choreography and dance entertainment service in Mumbai. ChoreoFunk creates memorable choreographed performances for couples, families, and friends, blending Bollywood, folk, and contemporary dance styles.",
        "operating_cities": ["Mumbai", "Pune"],
        "years_experience": 7,
        "services_offered": [
            {"name": "Couple Choreography", "base_price": 20000, "price_unit": "per routine"},
            {"name": "Group Choreography (up to 10)", "base_price": 35000, "price_unit": "per routine"},
            {"name": "Full Sangeet Coordination", "base_price": 80000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.8,
        "reviews_count": 52,
        "price_tier": "mid-range",
        "specialties": ["sangeet choreography", "Bollywood dance", "group performances"]
    },
    {
        "name": "Mashup Minati Mumbai",
        "category": "entertainment",
        "business_description": "Popular DJ and dhol combo entertainment service for Mumbai weddings. Mashup Minati delivers an unbeatable energy with professional DJs, live dhol players, and LED dance floor setups that keep guests dancing all night.",
        "operating_cities": ["Mumbai", "Thane"],
        "years_experience": 8,
        "services_offered": [
            {"name": "DJ + Dhol Combo", "base_price": 60000, "price_unit": "per event"},
            {"name": "Full Entertainment Package", "base_price": 100000, "price_unit": "per event"},
            {"name": "LED Dance Floor", "base_price": 40000, "price_unit": "per setup"}
        ],
        "portfolio_images": [],
        "rating": 4.7,
        "reviews_count": 40,
        "price_tier": "mid-range",
        "specialties": ["DJ + dhol", "LED dance floor", "high-energy events"]
    },
    {
        "name": "Sound & Beats Mumbai",
        "category": "entertainment",
        "business_description": "Budget-friendly DJ and sound rental service in Mumbai perfect for intimate weddings and smaller functions. Sound & Beats offers professional equipment, experienced DJs, and a vast music library at affordable prices.",
        "operating_cities": ["Mumbai", "Navi Mumbai"],
        "years_experience": 5,
        "services_offered": [
            {"name": "DJ Night (4 hours)", "base_price": 25000, "price_unit": "per event"},
            {"name": "DJ + Basic Lighting", "base_price": 40000, "price_unit": "per event"},
            {"name": "Sound System Rental", "base_price": 10000, "price_unit": "per event"}
        ],
        "portfolio_images": [],
        "rating": 4.6,
        "reviews_count": 32,
        "price_tier": "budget",
        "specialties": ["budget DJ", "sound rental", "intimate weddings"]
    },
]


def seed():
    print(f"Seeding {len(VENDORS)} vendors into {BASE}...")
    success = 0
    fail = 0
    for v in VENDORS:
        try:
            r = requests.post(f"{BASE}/api/vendors/register", json=v, timeout=5)
            data = r.json()
            vid = data.get("data", {}).get("id", "?")
            # Auto-approve for testing
            requests.patch(f"{BASE}/api/admin/vendors/{vid}/approve", timeout=5)
            print(f"  ✅ {v['name']} (id={vid}, {v['category']}, {v['price_tier']})")
            success += 1
        except Exception as e:
            print(f"  ❌ {v['name']}: {e}")
            fail += 1

    print(f"\nDone! {success} succeeded, {fail} failed out of {len(VENDORS)} vendors.")
    print(f"\nBreakdown by category:")
    from collections import Counter
    cats = Counter(v["category"] for v in VENDORS)
    for cat, count in sorted(cats.items()):
        print(f"  {cat}: {count}")
    print(f"\nBreakdown by city:")
    cities = Counter()
    for v in VENDORS:
        for city in v["operating_cities"]:
            cities[city] += 1
    for city, count in sorted(cities.items(), key=lambda x: -x[1]):
        print(f"  {city}: {count}")


if __name__ == "__main__":
    seed()
