"""
Gmail Integration Service — disabled stub.

The real Gmail integration was removed in an earlier commit
("Strip external APIs — clean slate for self-contained platform"),
but unified_wedding_server.py still imports it. This stub lets the
server start without a Gmail dependency. All email operations return
a disabled response.
"""

import logging

logger = logging.getLogger(__name__)


class GmailIntegrationService:
    """No-op stub: Gmail integration is disabled."""

    def __init__(self, *args, **kwargs):
        logger.info("GmailIntegrationService disabled (stub).")
        self.enabled = False

    def send_email(self, *args, **kwargs):
        return {
            "success": False,
            "disabled": True,
            "message": "Gmail integration is disabled in this build.",
        }

    def __getattr__(self, name):
        # Any other method called becomes a no-op that returns disabled.
        def _noop(*args, **kwargs):
            return {"success": False, "disabled": True, "method": name}
        return _noop
