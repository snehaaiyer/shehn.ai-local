"""
Gmail Integration Service - Stub implementation
Provides email sending interface for the unified wedding server.
"""
import logging

logger = logging.getLogger(__name__)


class GmailIntegrationService:
    """Gmail integration service for sending vendor communications."""

    def __init__(self):
        logger.info("GmailIntegrationService initialized (stub mode)")

    def send_email(self, to_email: str, subject: str, body: str, from_email: str = None) -> dict:
        """
        Send an email to a vendor or contact.
        Returns a result dict with 'success' and optionally 'message_id'.
        """
        logger.info(f"Email send requested: to={to_email}, subject={subject}")
        # Stub: log the email without actually sending
        return {
            "success": False,
            "error": "Gmail integration not configured. Please set up Google OAuth credentials.",
            "message_id": None,
        }

    def get_inbox_messages(self, max_results: int = 10) -> list:
        """Fetch recent inbox messages."""
        return []

    def is_configured(self) -> bool:
        """Check if Gmail credentials are configured."""
        return False
