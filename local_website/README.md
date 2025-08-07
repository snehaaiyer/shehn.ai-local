# 🌸 BID AI - Smart Sanskari Wedding Assistant

A beautiful, locally-hosted Indian wedding planning application with AI-powered features and cultural intelligence.

## ✨ Features

- **📊 Smart Dashboard** - Track wedding progress, budget, and tasks
- **📝 Enhanced Wedding Form** - Culturally-aware form with regional customization
- **🎨 Visual Preferences** - Style selection for themes, cuisine, photography, and venues
- **💾 Local Storage** - All data saved securely in your browser
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🎯 Progress Tracking** - Real-time completion percentage
- **🤖 AI Recommendations** - Smart suggestions based on your preferences
- **🌍 Multi-Regional Support** - North Indian, South Indian, Bengali, Gujarati, Punjabi, Marathi

## 🎨 Design Theme

Beautiful BID AI color scheme:
- **Soft Pink/Blush**: `#E8C5A0`
- **Sage Green**: `#A8C5A3`
- **Gold Accents**: `#B8860B` and `#DAA520`

## 🚀 Quick Start

### Method 1: Python Server (Recommended)

1. **Navigate to the app directory:**
   ```bash
   cd /path/to/your/bidai-wedding-app
   ```

2. **Start the server:**
   ```bash
   python server.py
   ```
   Or specify a custom port:
   ```bash
   python server.py 8080
   ```

3. **Open your browser:**
   - The app will automatically open at `http://localhost:8000`
   - Or manually visit the URL shown in the terminal

### Method 2: Simple HTTP Server

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Method 3: Node.js (if you have it installed)

```bash
npx serve .
```

## 📁 Project Structure

```
bidai-wedding-app/
├── index.html              # Main application file
├── css/
│   └── styles.css          # Complete styling with BID AI theme
├── js/
│   ├── storage.js          # Local storage management
│   ├── navigation.js       # Screen navigation system
│   ├── dashboard.js        # Dashboard functionality
│   ├── wedding-form.js     # Wedding form management
│   ├── visual-preferences.js # Visual preferences selector
│   └── app.js              # Main application coordinator
├── server.py               # Local development server
└── README.md               # This file
```

## 💻 System Requirements

- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)
- **Python 3.x** (for running the local server)
- **No internet required** (runs completely offline)

## 🎯 Usage Guide

### 1. Dashboard Screen
- View wedding progress and statistics
- Quick action cards for easy navigation
- Recent activity and upcoming tasks
- Budget tracking

### 2. Wedding Form Screen
- Complete couple and wedding details
- Regional and cultural customization
- Ceremony selection with duration estimates
- Priority areas and dietary requirements
- Progress tracking with auto-save

### 3. Visual Preferences Screen
- Choose decoration themes (Traditional, Modern, Rustic, etc.)
- Select cuisine styles (North Indian, South Indian, Multi-regional, etc.)
- Pick photography styles (Traditional, Candid, Cinematic, etc.)
- Choose venue types (Palace, Resort, Hotel, Farmhouse, etc.)
- AI recommendations based on your selections

## 📱 Features in Detail

### 🏠 Smart Dashboard
- **Real-time Progress**: Automatically calculated based on form completion
- **Wedding Countdown**: Days until your special day
- **Budget Overview**: Track allocated vs. used amounts
- **Quick Actions**: One-click navigation to incomplete sections
- **Recent Activity**: Keep track of your planning journey
- **Task Management**: Interactive checklist with completion tracking

### 📝 Cultural Wedding Form
- **Multi-Regional Support**: Specialized options for different Indian regions
- **Wedding Type Selection**: Hindu, Sikh, Muslim, Christian, Inter-faith
- **Ceremony Planning**: Select from traditional ceremonies with time estimates
- **Priority Areas**: Venue, Catering, Decoration, Photography, Music, Outfits
- **Dietary Requirements**: Vegetarian, Jain, Vegan, Non-veg, Mixed, Regional
- **Smart Validation**: Ensure all required fields are completed

### 🎨 Visual Style Selector
- **Theme Categories**: Traditional Royal, Modern Elegant, Rustic Charm, Vintage Romance, Bollywood Glam, Indo-Western
- **Cuisine Matching**: Automatically suggest menu styles based on region
- **Photography Styles**: Professional options with detailed descriptions
- **Venue Recommendations**: From heritage palaces to luxury resorts
- **AI Suggestions**: Intelligent recommendations based on your preferences

## 💾 Data Management

### Local Storage
- All data is stored securely in your browser's local storage
- No data is sent to external servers
- Automatic saving every 30 seconds
- Manual save with Ctrl+S (Cmd+S on Mac)

### Data Export/Import
```javascript
// Export your wedding data
window.bidaiApp.exportData();

// Import previously saved data
// Use the file input or drag-and-drop feature
```

### Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save all data
- **Ctrl/Cmd + 1**: Go to Dashboard
- **Ctrl/Cmd + 2**: Go to Wedding Form
- **Ctrl/Cmd + 3**: Go to Visual Preferences

## 🔧 Customization

### Color Scheme
The app uses CSS custom properties that can be easily modified in `css/styles.css`:

```css
:root {
    --primary-pink: #E8C5A0;    /* Soft pink/blush */
    --primary-green: #A8C5A3;   /* Sage green */
    --primary-gold: #B8860B;    /* Gold accent */
    --gold-light: #DAA520;      /* Light gold */
    --gold-bg: #FEF7E0;         /* Gold background */
}
```

### Adding New Features
1. **New Form Fields**: Add to the appropriate manager class
2. **Storage**: Update the storage.js file
3. **Styling**: Add CSS to styles.css
4. **Navigation**: Update navigation.js if adding new screens

## 🌐 Network Access

To access the app from other devices on your network:

1. **Find your IP address:**
   ```bash
   # On Mac/Linux
   ifconfig | grep inet
   
   # On Windows
   ipconfig
   ```

2. **Access from other devices:**
   ```
   http://YOUR_IP_ADDRESS:8000
   ```

## 🐛 Troubleshooting

### Common Issues

**App won't start:**
- Ensure you're in the correct directory
- Check that `index.html` exists
- Try a different port: `python server.py 8080`

**Data not saving:**
- Check browser console for errors
- Ensure local storage is enabled
- Try clearing browser cache and refreshing

**Styles not loading:**
- Verify all CSS/JS files are in the correct directories
- Check browser console for 404 errors
- Ensure server is serving files with correct MIME types

**Mobile responsiveness issues:**
- The app is designed to be mobile-friendly
- If issues persist, try refreshing or clearing cache

### Browser Compatibility
- **Chrome**: ✅ Fully supported
- **Firefox**: ✅ Fully supported  
- **Safari**: ✅ Fully supported
- **Edge**: ✅ Fully supported
- **Internet Explorer**: ❌ Not supported

## 🔮 Future Enhancements

- Vendor recommendation system
- Budget breakdown calculator
- Timeline and milestone planning
- Guest list management
- Invitation designer
- Venue booking integration
- Photography portfolio matching

## 📞 Support

For any issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure all files are present and accessible
4. Try running on a different port or browser

## 📜 License

This project is open source and available for personal use. Perfect for planning your dream Indian wedding! 💒✨

## 🙏 Acknowledgments

- Designed with love for Indian wedding traditions
- Built with modern web technologies
- Inspired by the beauty and complexity of Indian wedding planning

---

**Made with ❤️ for Beautiful Indian Weddings**

🌸 **BID AI - Where tradition meets technology** 🌸 