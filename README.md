# BidAI - Wedding Planning AI Assistant

A comprehensive wedding planning application powered by AI that helps couples plan their perfect wedding with intelligent vendor discovery, budget management, and AI-powered assistance.

## 🎉 Features

- **AI-Powered Chat Assistant**: Intelligent wedding planning guidance
- **Vendor Discovery**: Find and connect with wedding vendors
- **Budget Management**: Track and manage wedding expenses
- **Wedding Preferences**: Store and manage wedding details
- **Google Integration**: Calendar and email integration
- **Modern UI**: Beautiful, responsive design with dark/light themes

## 🚀 Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **AI Services**: 
  - Cloudflare AI
  - Google Gemini API
  - Custom AI Assistant
- **Backend**: Python Flask (local services)
- **Database**: NocoDB (NoSQL)
- **Deployment**: Cloudflare Workers

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/snehaaiyer/bidai.git
   cd bidai
   ```

2. **Install React Frontend Dependencies**
   ```bash
   cd react-frontend
   npm install
   ```

3. **Install Python Dependencies**
   ```bash
   cd ..
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r ai_requirements.txt
   ```

4. **Environment Setup**
   Create `.env` files in the appropriate directories with your API keys:
   ```bash
   # react-frontend/.env
   REACT_APP_GOOGLE_API_KEY=your_google_api_key
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   REACT_APP_CLOUDFLARE_WORKER_URL=your_cloudflare_worker_url
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start React frontend
cd react-frontend
npm start

# Start Python backend (in another terminal)
cd local_website
python api_service.py
```

The application will be available at `http://localhost:3000`

### Production Build
```bash
cd react-frontend
npm run build
```

## 🏗️ Project Structure

```
cursor_bidai/
├── react-frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── local_website/          # Python backend services
├── config/                 # Configuration files
├── models/                 # AI model files
├── nocodb_schemas/         # Database schemas
└── tests/                  # Test files
```

## 🤖 AI Features

- **Intelligent Chat**: AI-powered wedding planning assistant
- **Vendor Recommendations**: Smart vendor discovery based on preferences
- **Budget Analysis**: AI-driven budget optimization
- **Image Generation**: AI-generated wedding theme visualizations
- **Natural Language Processing**: Understand and respond to wedding planning queries

## 🔧 Configuration

### API Keys Required
- Google API Key (for calendar and email integration)
- Gemini API Key (for AI chat functionality)
- Cloudflare Worker URL (for AI image generation)

### Environment Variables
See the setup section for required environment variables.

## 🧪 Testing

```bash
# Run React tests
cd react-frontend
npm test

# Run Python tests
cd tests
python test_runner.py
```

## 📱 Features Overview

### Dashboard
- Wedding overview and progress tracking
- Quick access to all planning tools

### Vendor Discovery
- Search and filter wedding vendors
- AI-powered recommendations
- Vendor contact management

### Budget Management
- Expense tracking and categorization
- Budget allocation tools
- Financial planning assistance

### Bid AI Chat
- Natural language wedding planning assistance
- Task automation (scheduling, emails, etc.)
- Intelligent recommendations

### Wedding Preferences
- Store wedding details and preferences
- Theme and style preferences
- Guest list management

## 🚀 Deployment

### Frontend Deployment
```bash
cd react-frontend
npm run build
# Deploy build/ folder to your hosting service
```

### Backend Deployment
The Python services can be deployed to:
- Heroku
- AWS Lambda
- Google Cloud Functions
- Cloudflare Workers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React and TypeScript communities
- Tailwind CSS for styling
- Cloudflare for AI services
- Google for API integrations

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ for wedding planning**
