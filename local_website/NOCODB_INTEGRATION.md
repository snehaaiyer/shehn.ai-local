# BID AI Wedding App - NocoDB Integration

## Overview
Your BID AI Wedding App now integrates with your NocoDB database running on port 8080! This provides:

- **Database persistence**: Wedding data saved to your NocoDB tables
- **Offline fallback**: Automatic localStorage backup when database is unavailable  
- **Real-time sync**: Connection status indicators and automatic data synchronization
- **Hybrid storage**: Best of both worlds - database reliability + offline capability

## Setup Instructions

### 1. Make sure NocoDB is running
Your NocoDB should be accessible at `http://localhost:8080`

```bash
# If using Docker (example):
docker run -d --name nocodb -p 8080:8080 nocodb/nocodb:latest
```

### 2. Start the integrated app
```bash
# Option 1: Use the integrated startup script
./start_with_database.sh

# Option 2: Manual startup (run in separate terminals)
python3 api_service.py          # API service on port 5000
python3 -m http.server 8003     # Web server on port 8003
```

### 3. Access your app
- **Wedding App**: http://localhost:8003
- **API Service**: http://localhost:5000  
- **NocoDB**: http://localhost:8080

## Features

### 🟢 Database Connected Mode
When NocoDB is available:
- All wedding form data automatically saved to database
- Visual preferences saved to preferences table
- Real-time connection status indicator
- Data persistence across sessions

### 🔴 Offline Mode  
When NocoDB is unavailable:
- Automatic fallback to localStorage
- All functionality continues to work
- Data saved locally with sync capabilities
- Warning indicators show offline status

### 🔄 Automatic Sync
- Connection monitoring every 30 seconds
- Automatic sync when database comes back online
- Seamless transition between online/offline modes
- No data loss with hybrid storage approach

## Database Schema

The integration uses your existing NocoDB tables:

### Couples Table (`couples`)
- Partner1 Name, Partner2 Name
- Wedding Date, Contact Email, Contact Phone
- Wedding Type, Region, Budget Range
- Guest Count, Venue Type
- Dietary Requirements, Priority Areas, Ceremonies
- Special Requests

### Preferences Table (`preferences`)  
- Wedding Style, Cuisine Style
- Photography Style, Venue Type
- Color Scheme, Additional Preferences

## API Endpoints

The API service provides these endpoints:

- `GET /api/health` - Connection status
- `POST /api/wedding-data` - Save wedding form
- `POST /api/visual-preferences` - Save visual preferences  
- `GET /api/wedding-data` - Retrieve all data
- `GET /api/couples` - Get couples data
- `GET /api/venues` - Get venues data
- `GET /api/vendors` - Get vendors data

## Configuration

Update the NocoDB configuration in `api_service.py`:

```python
NOCODB_CONFIG = {
    "BASE_URL": "http://localhost:8080",
    "PROJECT_ID": "your_project_id",
    "API_TOKEN": "your_api_token", 
    "TABLE_IDS": {
        "couples": "your_couples_table_id",
        "preferences": "your_preferences_table_id",
        # ... other table IDs
    }
}
```

## Troubleshooting

### Database Connection Issues
1. Check if NocoDB is running: `curl http://localhost:8080`
2. Verify API token and table IDs in `api_service.py`
3. Check browser console for connection errors
4. API service logs show detailed error information

### Port Conflicts
- API service: Default port 5000, automatically finds next available
- Web server: Default port 8003, automatically finds next available  
- NocoDB: Expected on port 8080

### Data Sync Issues
- Check browser localStorage for backup data
- API service provides detailed logging
- Connection status indicator shows real-time status
- Manual refresh reconnects to database

## Benefits

✅ **No Internet Required**: Fully local setup
✅ **Database Reliability**: Professional data storage  
✅ **Offline Capability**: Works without database
✅ **Automatic Backups**: Dual storage approach
✅ **Real-time Status**: Always know connection state
✅ **Easy Migration**: Existing localStorage data preserved
✅ **Scalable**: Ready for multi-user scenarios

Your wedding planning data is now safely stored in your NocoDB database while maintaining all the flexibility and offline capabilities of the original app! 