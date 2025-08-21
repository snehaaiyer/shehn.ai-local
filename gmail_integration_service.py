
#!/usr/bin/env python3
"""
Gmail Integration Service
Handles real Gmail API integration for sending vendor communications
"""

import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GMAIL_AVAILABLE = True
except ImportError:
    logger.warning("Gmail API libraries not available. Install with: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    GMAIL_AVAILABLE = False

class GmailIntegrationService:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/gmail.send']
        self.credentials = None
        self.service = None
        
        if GMAIL_AVAILABLE:
            self.initialize_gmail_api()
    
    def initialize_gmail_api(self):
        """Initialize Gmail API with OAuth2 credentials"""
        try:
            # Check for existing credentials
            if os.path.exists('token.json'):
                self.credentials = Credentials.from_authorized_user_file('token.json', self.SCOPES)
            
            # If credentials are not available or invalid, get new ones
            if not self.credentials or not self.credentials.valid:
                if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                    self.credentials.refresh(Request())
                else:
                    # Check for credentials file from environment or default location
                    credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
                    if os.path.exists(credentials_file):
                        flow = InstalledAppFlow.from_client_secrets_file(credentials_file, self.SCOPES)
                        self.credentials = flow.run_local_server(port=0)
                    else:
                        logger.error("Gmail credentials file not found. Please set up OAuth2 credentials.")
                        return False
                
                # Save credentials for next run
                with open('token.json', 'w') as token:
                    token.write(self.credentials.to_json())
            
            self.service = build('gmail', 'v1', credentials=self.credentials)
            logger.info("Gmail API initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing Gmail API: {e}")
            return False
    
    def create_email_message(self, to_email: str, subject: str, body: str, 
                           from_email: Optional[str] = None) -> Dict:
        """Create email message in Gmail API format"""
        try:
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            if from_email:
                message['from'] = from_email
            
            # Add body
            message.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            return {'raw': raw_message}
            
        except Exception as e:
            logger.error(f"Error creating email message: {e}")
            return {}
    
    def send_email(self, to_email: str, subject: str, body: str, 
                   from_email: Optional[str] = None) -> Dict:
        """Send email using Gmail API"""
        try:
            if not GMAIL_AVAILABLE:
                return {
                    'success': False,
                    'error': 'Gmail API libraries not available',
                    'simulation': True
                }
            
            if not self.service:
                if not self.initialize_gmail_api():
                    return {
                        'success': False,
                        'error': 'Gmail API not initialized',
                        'simulation': True
                    }
            
            # Create email message
            message = self.create_email_message(to_email, subject, body, from_email)
            if not message:
                return {
                    'success': False,
                    'error': 'Failed to create email message'
                }
            
            # Send email
            result = self.service.users().messages().send(
                userId='me', 
                body=message
            ).execute()
            
            logger.info(f"Email sent successfully to {to_email}. Message ID: {result['id']}")
            
            return {
                'success': True,
                'message_id': result['id'],
                'to_email': to_email,
                'subject': subject,
                'timestamp': datetime.now().isoformat()
            }
            
        except HttpError as e:
            logger.error(f"Gmail API error: {e}")
            return {
                'success': False,
                'error': f'Gmail API error: {e}',
                'simulation': False
            }
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return {
                'success': False,
                'error': str(e),
                'simulation': False
            }
    
    def send_vendor_email(self, vendor_info: Dict, wedding_info: Dict, 
                         message: str, subject: str) -> Dict:
        """Send email to wedding vendor"""
        try:
            vendor_email = vendor_info.get('email')
            if not vendor_email:
                return {
                    'success': False,
                    'error': 'Vendor email not provided'
                }
            
            # Send email
            result = self.send_email(
                to_email=vendor_email,
                subject=subject,
                body=message,
                from_email=wedding_info.get('contactEmail')
            )
            
            # Log vendor communication
            if result.get('success'):
                self.log_vendor_communication(vendor_info, 'email', subject, message, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending vendor email: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def log_vendor_communication(self, vendor_info: Dict, comm_type: str, 
                               subject: str, message: str, result: Dict):
        """Log vendor communication for tracking"""
        try:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'vendor_name': vendor_info.get('name', 'Unknown'),
                'vendor_email': vendor_info.get('email', 'No email'),
                'vendor_category': vendor_info.get('category', 'Unknown'),
                'communication_type': comm_type,
                'subject': subject,
                'message_id': result.get('message_id'),
                'success': result.get('success', False)
            }
            
            # In a real application, save to database
            # For now, just log to console and file
            logger.info(f"Vendor communication logged: {log_entry}")
            
            # Save to file for persistence
            log_file = 'vendor_communications.json'
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            else:
                logs = []
            
            logs.append(log_entry)
            
            with open(log_file, 'w') as f:
                json.dump(logs, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error logging vendor communication: {e}")
    
    def get_communication_history(self, vendor_email: str) -> List[Dict]:
        """Get communication history for a vendor"""
        try:
            log_file = 'vendor_communications.json'
            if not os.path.exists(log_file):
                return []
            
            with open(log_file, 'r') as f:
                logs = json.load(f)
            
            # Filter logs for this vendor
            vendor_logs = [
                log for log in logs 
                if log.get('vendor_email') == vendor_email
            ]
            
            return vendor_logs
            
        except Exception as e:
            logger.error(f"Error getting communication history: {e}")
            return []

# Usage example and testing
if __name__ == "__main__":
    gmail_service = GmailIntegrationService()
    
    # Test vendor info
    vendor_info = {
        'name': 'Test Venue',
        'email': 'test@example.com',
        'category': 'venues'
    }
    
    wedding_info = {
        'date': '2024-12-15',
        'location': 'Mumbai',
        'guestCount': 300,
        'coupleNames': 'John & Jane',
        'contactEmail': 'john.jane@email.com'
    }
    
    # Test email
    test_subject = 'Wedding Venue Inquiry - December 15, 2024'
    test_message = f"""Dear {vendor_info['name']},

We are planning our wedding for {wedding_info['date']} and are interested in your venue services.

Event Details:
• Wedding Date: {wedding_info['date']}
• Guest Count: {wedding_info['guestCount']}
• Location: {wedding_info['location']}

Please let us know about availability and pricing.

Best regards,
{wedding_info['coupleNames']}"""
    
    result = gmail_service.send_vendor_email(vendor_info, wedding_info, test_message, test_subject)
    print("Email result:", json.dumps(result, indent=2))
