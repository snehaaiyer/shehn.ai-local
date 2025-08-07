#!/usr/bin/env python3
"""
Communications Agent Service
Handles formal message generation for vendor communications
"""

import json
from datetime import datetime
from typing import Dict, List, Optional

class CommunicationsAgent:
    def __init__(self):
        self.message_templates = {
            'inquiry': self._get_inquiry_template(),
            'quote': self._get_quote_template(),
            'follow_up': self._get_follow_up_template(),
            'booking': self._get_booking_template()
        }
        
        self.category_requirements = {
            'venues': {
                'icon': '🏛️',
                'requirements': [
                    'Preferred venue type: [Indoor/Outdoor/Both]',
                    'Required amenities: [Parking, AC, Stage, etc.]',
                    'Decorations allowed: [Yes/No/Restrictions]',
                    'Catering arrangements: [In-house/External allowed]',
                    'Sound system: [Required/Not required]',
                    'Additional facilities: [Bridal room, guest rooms, etc.]'
                ]
            },
            'decoration': {
                'icon': '🎨',
                'requirements': [
                    'Decoration theme: [Traditional/Modern/Contemporary]',
                    'Color scheme: [Please specify preferred colors]',
                    'Floral arrangements: [Fresh flowers/Artificial/Both]',
                    'Stage decoration: [Required/Not required]',
                    'Entrance decoration: [Required/Not required]',
                    'Additional props: [Mandap, photo booth, etc.]'
                ]
            },
            'catering': {
                'icon': '🍽️',
                'requirements': [
                    'Cuisine type: [North Indian/South Indian/Multi-cuisine]',
                    'Meal type: [Breakfast/Lunch/Dinner/All]',
                    'Service style: [Buffet/Plated/Both]',
                    'Dietary restrictions: [Vegetarian/Non-vegetarian/Jain/Other]',
                    'Special requirements: [Live counters/Beverages/Desserts]',
                    'Service staff: [Required/Not required]'
                ]
            },
            'makeup': {
                'icon': '💄',
                'requirements': [
                    'Makeup type: [Bridal/Party/Both]',
                    'Hair styling: [Required/Not required]',
                    'Makeup style: [Traditional/Contemporary/HD]',
                    'Duration: [Half day/Full day/Multiple days]',
                    'Additional services: [Mehendi/Draping/Accessories]',
                    'Location: [Salon/Home/Venue]'
                ]
            },
            'photography': {
                'icon': '📸',
                'requirements': [
                    'Photography style: [Traditional/Candid/Cinematic]',
                    'Coverage duration: [Half day/Full day/Multiple days]',
                    'Video services: [Required/Not required]',
                    'Drone coverage: [Required/Not required]',
                    'Album and prints: [Required/Not required]',
                    'Additional services: [Pre-wedding/Post-wedding shoots]'
                ]
            }
        }

    def generate_message(self, message_type: str, vendor_info: Dict, 
                        wedding_info: Dict, additional_info: Optional[Dict] = None) -> str:
        """
        Generate formal message for vendor communication
        
        Args:
            message_type: Type of message ('inquiry', 'quote', 'follow_up', 'booking')
            vendor_info: Vendor details
            wedding_info: Wedding event details
            additional_info: Any additional information
            
        Returns:
            Formatted message string
        """
        template = self.message_templates.get(message_type, self.message_templates['inquiry'])
        
        # Format the message with provided information
        formatted_message = self._format_message(template, vendor_info, wedding_info, additional_info)
        
        return formatted_message

    def _format_message(self, template: str, vendor_info: Dict, 
                       wedding_info: Dict, additional_info: Optional[Dict] = None) -> str:
        """Format message template with actual data"""
        
        current_date = datetime.now().strftime("%B %d, %Y")
        category = vendor_info.get('category', 'services')
        category_icon = self.category_requirements.get(category, {}).get('icon', '🎉')
        
        # Get category-specific requirements
        requirements = self._get_category_requirements(category)
        
        # Format template with actual data
        formatted_message = template.format(
            vendor_name=vendor_info.get('name', 'Vendor Team'),
            category=category,
            category_icon=category_icon,
            location=vendor_info.get('location', 'TBD'),
            price_range=vendor_info.get('price', 'To be discussed'),
            wedding_date=wedding_info.get('date', '[Please specify your wedding date]'),
            guest_count=wedding_info.get('guest_count', '[Please specify expected guest count]'),
            venue=wedding_info.get('venue', '[Please specify venue name and location]'),
            duration=wedding_info.get('duration', '[Please specify event duration]'),
            requirements=requirements,
            current_date=current_date,
            customer_name=wedding_info.get('customer_name', '[Your Name]'),
            customer_phone=wedding_info.get('customer_phone', '[Your Phone Number]'),
            customer_email=wedding_info.get('customer_email', '[Your Email]'),
            special_notes=additional_info.get('special_notes', '') if additional_info else ''
        )
        
        return formatted_message

    def _get_category_requirements(self, category: str) -> str:
        """Get formatted requirements for specific category"""
        requirements = self.category_requirements.get(category, {}).get('requirements', [])
        return '\n'.join(f'• {req}' for req in requirements)

    def _get_inquiry_template(self) -> str:
        """Template for general inquiry messages"""
        return """Dear {vendor_name},

Greetings! I hope this message finds you well.

I am writing to inquire about your {category} services for an upcoming wedding celebration. I came across your profile and was impressed by your work and reputation in the industry.

{category_icon} EVENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Wedding Date: {wedding_date}
📍 Location: {location}
👥 Guest Count: {guest_count}
💰 Budget Range: {price_range}
🎯 Service Category: {category}

INITIAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{requirements}

I would be grateful if you could provide the following information:
• Availability for our proposed date
• Service packages and pricing overview
• Portfolio/previous work samples
• Initial consultation availability
• Any special offers or packages

We are looking for a reliable and professional partner to make our special day memorable. Your expertise in {category} services aligns perfectly with our vision.

Please let me know a convenient time for a detailed discussion. I look forward to hearing from you soon.

{special_notes}

Best regards,
{customer_name}
{customer_phone}
{customer_email}

Date: {current_date}"""

    def _get_quote_template(self) -> str:
        """Template for quote request messages"""
        return """Dear {vendor_name},

Warm greetings! I hope you are doing well.

I am writing to request a formal quotation for your {category} services for our upcoming wedding celebration. After reviewing your profile and services, I believe you would be the perfect fit for our special day.

{category_icon} WEDDING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Wedding Date: {wedding_date}
📍 Venue: {venue}
⏰ Event Duration: {duration}
👥 Guest Count: {guest_count}
🎯 Service Required: {category}

SPECIFIC REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{requirements}

QUOTATION REQUEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide a detailed quotation including:
• Complete service package details
• Itemized pricing breakdown
• Available packages/options
• Terms and conditions
• Payment schedule
• Cancellation policy
• Additional charges (if any)

We would also appreciate if you could include:
• Your portfolio/previous work samples
• Client testimonials
• Any special offers or seasonal discounts
• Availability confirmation for our date

CONTACT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: {customer_name}
Phone: {customer_phone}
Email: {customer_email}
Preferred Communication: [WhatsApp/Email/Phone]

We are excited about the possibility of working with you and would appreciate receiving your quotation at your earliest convenience. Please feel free to contact us if you need any additional information.

{special_notes}

Thank you for your time and consideration.

Best regards,
{customer_name}

Date: {current_date}"""

    def _get_follow_up_template(self) -> str:
        """Template for follow-up messages"""
        return """Dear {vendor_name},

I hope this message finds you well.

I am writing to follow up on my previous inquiry regarding your {category} services for our upcoming wedding celebration on {wedding_date}.

I wanted to check if you had an opportunity to review our requirements and would appreciate any updates on:
• Availability for our proposed date
• Service packages and pricing
• Next steps in the process

We are in the process of finalizing our vendors and would love to include you in our wedding planning journey. Your expertise in {category} services would be invaluable for our special day.

Please let me know if you need any additional information or if we can schedule a call to discuss further.

{special_notes}

Looking forward to your response.

Best regards,
{customer_name}
{customer_phone}
{customer_email}

Date: {current_date}"""

    def _get_booking_template(self) -> str:
        """Template for booking confirmation messages"""
        return """Dear {vendor_name},

Greetings!

After careful consideration and review of your services, we are pleased to move forward with booking your {category} services for our wedding celebration.

{category_icon} CONFIRMED DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Wedding Date: {wedding_date}
📍 Venue: {venue}
⏰ Event Duration: {duration}
👥 Guest Count: {guest_count}
🎯 Service: {category}

NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide:
• Formal contract/agreement
• Payment schedule and terms
• Detailed service timeline
• Contact person for coordination
• Any preparation requirements

We are excited to work with you and look forward to creating magical memories together.

{special_notes}

Thank you for your professionalism and service.

Best regards,
{customer_name}
{customer_phone}
{customer_email}

Date: {current_date}"""

    def generate_whatsapp_message(self, vendor_info: Dict, wedding_info: Dict) -> str:
        """Generate shorter WhatsApp-friendly message"""
        category = vendor_info.get('category', 'services')
        category_icon = self.category_requirements.get(category, {}).get('icon', '🎉')
        
        return f"""Hello {vendor_info.get('name', 'there')}! {category_icon}

I'm interested in your {category} services for my wedding.

📅 Date: {wedding_info.get('date', 'TBD')}
📍 Location: {vendor_info.get('location', 'TBD')}
👥 Guests: {wedding_info.get('guest_count', 'TBD')}

Could you please share:
• Availability for our date
• Package details & pricing
• Portfolio samples

Looking forward to hearing from you!

Best regards,
{wedding_info.get('customer_name', 'Wedding Couple')}"""

# Usage example and API endpoint
if __name__ == "__main__":
    # Example usage
    agent = CommunicationsAgent()
    
    vendor_info = {
        'name': 'Royal Garden Palace',
        'category': 'venues',
        'location': 'Mumbai',
        'price': '₹2,00,000 - ₹5,00,000'
    }
    
    wedding_info = {
        'date': 'December 15, 2024',
        'guest_count': '500',
        'venue': 'Royal Garden Palace, Mumbai',
        'duration': '6 hours',
        'customer_name': 'John & Jane',
        'customer_phone': '+91 98765 43210',
        'customer_email': 'john.jane@email.com'
    }
    
    # Generate different types of messages
    inquiry_message = agent.generate_message('inquiry', vendor_info, wedding_info)
    quote_message = agent.generate_message('quote', vendor_info, wedding_info)
    whatsapp_message = agent.generate_whatsapp_message(vendor_info, wedding_info)
    
    print("=== INQUIRY MESSAGE ===")
    print(inquiry_message)
    print("\n=== QUOTE MESSAGE ===")
    print(quote_message)
    print("\n=== WHATSAPP MESSAGE ===")
    print(whatsapp_message) 