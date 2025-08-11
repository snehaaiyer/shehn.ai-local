// Google API Configuration for Wedding Planning App

export const GOOGLE_CONFIG = {
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || '',
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  DISCOVERY_DOCS: [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
  ],
  SCOPES: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ')
};

// Sandbox configuration for testing
export const SANDBOX_CONFIG = {
  TEST_EMAIL: process.env.REACT_APP_TEST_EMAIL || '',
  TEST_PHONE: process.env.REACT_APP_TEST_PHONE || '',
  SANDBOX_MODE: process.env.REACT_APP_SANDBOX_MODE === 'true'
};

// Google API endpoints
export const GOOGLE_ENDPOINTS = {
  CALENDAR: {
    EVENTS: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    CALENDARS: 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
  },
  GMAIL: {
    MESSAGES: 'https://www.googleapis.com/gmail/v1/users/me/messages',
    SEND: 'https://www.googleapis.com/gmail/v1/users/me/messages/send',
    THREADS: 'https://www.googleapis.com/gmail/v1/users/me/threads'
  }
};

// Email templates for wedding planning
export const EMAIL_TEMPLATES = {
  WEDDING_INVITATION: {
    subject: "You're Invited to Our Wedding!",
    body: `
Dear {guestName},

You are cordially invited to celebrate our wedding!

📅 Date: {date}
🕐 Time: {time}
📍 Venue: {venue}
📍 Address: {address}

Please RSVP by {rsvpDate}.

We look forward to celebrating this special day with you!

Best regards,
{coupleNames}
    `.trim()
  },

  VENDOR_INQUIRY: {
    subject: "Wedding Vendor Inquiry - {serviceType}",
    body: `
Dear {vendorName},

We are planning our wedding and would like to inquire about your {serviceType} services.

📅 Wedding Date: {weddingDate}
👥 Guest Count: {guestCount}
📍 Location: {location}
💰 Budget Range: {budgetRange}

{additionalDetails}

Please let us know your availability and pricing for our special day.

Thank you for your time!

Best regards,
{coupleNames}
    `.trim()
  },

  VENDOR_CONFIRMATION: {
    subject: "Wedding Vendor Confirmation - {serviceType}",
    body: `
Dear {vendorName},

Thank you for confirming your services for our wedding!

📅 Wedding Date: {weddingDate}
🕐 Service Time: {serviceTime}
📍 Venue: {venue}
💰 Agreed Price: {price}

Please arrive 30 minutes before the scheduled time for setup.

We look forward to working with you!

Best regards,
{coupleNames}
    `.trim()
  },

  GUEST_RSVP_REMINDER: {
    subject: "RSVP Reminder - Our Wedding",
    body: `
Dear {guestName},

We hope this email finds you well! We're excited about our upcoming wedding and would love to have you join us.

📅 Date: {date}
🕐 Time: {time}
📍 Venue: {venue}

If you haven't already, please RSVP by {rsvpDate} so we can make proper arrangements.

You can RSVP by:
- Replying to this email
- Calling us at {phoneNumber}
- Visiting our wedding website: {website}

We can't wait to celebrate with you!

Best regards,
{coupleNames}
    `.trim()
  }
};

// Calendar event templates
export const CALENDAR_TEMPLATES = {
  WEDDING_CEREMONY: {
    title: "Wedding Ceremony",
    description: "Our wedding ceremony",
    eventType: "ceremony" as const,
    duration: 60, // minutes
    reminders: {
      email: true,
      popup: true,
      minutes: 60
    }
  },

  WEDDING_RECEPTION: {
    title: "Wedding Reception",
    description: "Wedding reception and celebration",
    eventType: "reception" as const,
    duration: 240, // 4 hours
    reminders: {
      email: true,
      popup: true,
      minutes: 60
    }
  },

  REHEARSAL_DINNER: {
    title: "Rehearsal Dinner",
    description: "Wedding rehearsal and dinner",
    eventType: "rehearsal" as const,
    duration: 180, // 3 hours
    reminders: {
      email: true,
      popup: true,
      minutes: 60
    }
  },

  VENDOR_MEETING: {
    title: "Vendor Meeting - {vendorName}",
    description: "Meeting with {vendorName} to discuss {serviceType}",
    eventType: "vendor-meeting" as const,
    duration: 60, // minutes
    reminders: {
      email: true,
      popup: true,
      minutes: 30
    }
  }
};

// Default settings
export const DEFAULT_SETTINGS = {
  // Calendar settings
  CALENDAR: {
    DEFAULT_REMINDER_MINUTES: 60,
    AUTO_ADD_GUESTS: true,
    SEND_UPDATES: true,
    TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone
  },

  // Email settings
  EMAIL: {
    AUTO_SAVE_DRAFTS: true,
    SEND_CONFIRMATIONS: true,
    BCC_COUPLE: true,
    DEFAULT_SIGNATURE: true
  },

  // Notification settings
  NOTIFICATIONS: {
    EMAIL_REMINDERS: true,
    CALENDAR_REMINDERS: true,
    VENDOR_UPDATES: true,
    GUEST_RSVPS: true
  }
};

// Error messages
export const ERROR_MESSAGES = {
  AUTHENTICATION_FAILED: "Failed to authenticate with Google. Please try again.",
  CALENDAR_ACCESS_DENIED: "Calendar access denied. Please check your permissions.",
  GMAIL_ACCESS_DENIED: "Gmail access denied. Please check your permissions.",
  EVENT_CREATION_FAILED: "Failed to create calendar event. Please try again.",
  EMAIL_SEND_FAILED: "Failed to send email. Please try again.",
  API_QUOTA_EXCEEDED: "API quota exceeded. Please try again later.",
  NETWORK_ERROR: "Network error. Please check your connection and try again."
};

// Success messages
export const SUCCESS_MESSAGES = {
  EVENT_CREATED: "Calendar event created successfully!",
  EVENT_UPDATED: "Calendar event updated successfully!",
  EVENT_DELETED: "Calendar event deleted successfully!",
  EMAIL_SENT: "Email sent successfully!",
  BULK_INVITATIONS_SENT: "Bulk invitations sent successfully!",
  VENDOR_EMAIL_SENT: "Vendor inquiry sent successfully!"
};