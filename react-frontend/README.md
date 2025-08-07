# BID AI Wedding Planner - React Frontend

A modern, beautiful React-based frontend for the BID AI Wedding Planner application. This frontend provides an enhanced user experience with modern UI components, smooth animations, and responsive design.

## Features

### Dashboard (Overview)
- Modern hero section with wedding progress tracking
- Couple information display with edit functionality
- Budget overview with visual progress indicators
- Wedding preferences summary
- Quick action cards for common tasks
- Vendor tracking by category
- AI-powered insights and recommendations
- Wedding timeline with milestone tracking

### Vendor Discovery
- Advanced search and filtering by location and category
- Beautiful vendor cards with contact information
- Contact score validation for quality assurance
- Favorite vendors functionality
- Category-based browsing (Venues, Photography, Catering, etc.)
- Real-time vendor data from Serper AI integration
- Responsive grid layout for optimal viewing

### Budget Management
- Comprehensive budget tracking and visualization
- Category-wise budget allocation and spending
- Interactive progress rings and charts
- Transaction history with detailed records
- Add/edit transactions with modal interface
- Budget alerts and over-budget warnings
- Visual progress indicators for each category

### Wedding Preferences
- Multi-section preference configuration
- Interactive theme selection with visual previews
- Photography style preferences
- Venue type and decoration style selection
- Cuisine and entertainment preferences
- Couple details management
- Real-time preference saving

### AI Assistant Chat
- Natural language conversation interface
- Quick prompt suggestions for common questions
- Real-time AI responses with loading states
- Message history and conversation management
- Copy message functionality
- Feedback system (thumbs up/down)
- Mobile-responsive chat interface

## Getting Started

### Prerequisites

1. **Node.js** (v16 or higher)
   ```bash
   # Install via Homebrew (macOS)
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. **npm** (comes with Node.js)

### Installation

1. **Navigate to the React frontend directory:**
   ```bash
   cd react-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
react-frontend/
├── public/
│   └── index.html              # Main HTML template
├── src/
│   ├── components/             # Reusable React components
│   │   ├── ProgressRing.tsx    # Circular progress indicator
│   │   ├── SectionCard.tsx     # Card wrapper component
│   │   └── StatsCard.tsx       # Statistics display component
│   ├── pages/                  # Main page components
│   │   ├── Index.tsx           # Dashboard/Overview page
│   │   ├── VendorDiscovery.tsx # Vendor search and discovery
│   │   ├── BudgetManagement.tsx # Budget tracking and management
│   │   ├── WeddingPreferences.tsx # Wedding preferences configuration
│   │   └── AIChat.tsx          # AI assistant chat interface
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Shared interfaces and types
│   ├── lib/                    # Utility functions
│   │   └── utils.ts            # Helper functions and utilities
│   ├── App.tsx                 # Main app component with routing
│   ├── App.css                 # Global styles
│   └── index.tsx               # App entry point
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── postcss.config.js           # PostCSS configuration
```

## Design System

### Color Palette
- **Primary**: Purple (#8B5CF6) to Pink (#EC4899) gradient
- **Secondary**: Blue (#3B82F6), Green (#10B981), Orange (#F59E0B)
- **Neutral**: Gray scale for text and backgrounds
- **Accent**: Red (#EF4444) for warnings, Green (#10B981) for success

### Typography
- **Font Family**: Inter (via Tailwind CSS)
- **Headings**: Bold weights with proper hierarchy
- **Body Text**: Regular weight with good readability

### Components
- **Cards**: Rounded corners (2xl), subtle shadows, white backgrounds
- **Buttons**: Gradient backgrounds, hover effects, smooth transitions
- **Forms**: Clean inputs with focus states and validation
- **Navigation**: Sidebar with active states and hover effects

## Technology Stack

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Router** - Client-side routing
- **PostCSS** - CSS processing and optimization

## Responsive Design

The application is fully responsive and works seamlessly on:
- **Desktop** (1024px+) - Full sidebar navigation
- **Tablet** (768px - 1023px) - Adaptive layouts
- **Mobile** (< 768px) - Mobile-optimized interfaces

## API Integration

The React frontend integrates with the Python FastAPI backend:

- **Base URL**: `http://localhost:8000`
- **Endpoints**:
  - `/api/vendor-data/{category}` - Vendor discovery
  - `/api/visual-preferences` - Wedding preferences
  - `/api/ai/chat` - AI assistant
  - `/api/wedding-data` - Wedding information

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Key Features

### Modern UI/UX
- Glassmorphism effects and modern gradients
- Smooth animations and transitions
- Intuitive navigation and user flows
- Consistent design language throughout

### Performance
- Optimized bundle size
- Lazy loading for better performance
- Efficient state management
- Responsive image handling

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios

## Future Enhancements

- [ ] Dark mode support
- [ ] Offline functionality with service workers
- [ ] Push notifications for important updates
- [ ] Advanced analytics and insights
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Real-time collaboration features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the BID AI Wedding Planner application.

---

**Happy Wedding Planning!** 