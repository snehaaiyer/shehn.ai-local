#!/bin/bash

echo "🎉 Setting up React Wedding Planner Application"
echo "================================================"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js is already installed ($(node --version))"
fi

# Check if npm is working
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please reinstall Node.js"
    exit 1
else
    echo "✅ npm is available ($(npm --version))"
fi

# Navigate to React frontend directory
echo "📂 Navigating to React frontend directory..."
cd react-frontend

# Install dependencies
echo "📦 Installing React dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete! Your React wedding planner is ready."
    echo ""
    echo "To start the development server:"
    echo "  cd react-frontend"
    echo "  npm start"
    echo ""
    echo "The app will open at: http://localhost:3000"
    echo ""
    echo "Your Python backend should run on: http://localhost:8000"
    echo ""
else
    echo "❌ Installation failed. Please check the errors above."
    exit 1
fi 