# Wedding Planner React App - Test Documentation

## 📋 Overview

This document provides comprehensive documentation for the test suite of the Wedding Planner React application. The test suite covers all major components, screens, and functionality to ensure reliability and maintainability.

## 🏗️ Test Structure

### Test Files Organization

```
src/__tests__/
├── Index.test.tsx              # Dashboard/Index screen tests
├── VendorDiscovery.test.tsx    # Vendor Discovery screen tests
├── BudgetManagement.test.tsx   # Budget Management screen tests
├── WeddingPreferences.test.tsx # Wedding Preferences screen tests
├── AIChat.test.tsx            # AI Chat screen tests
└── App.test.tsx               # Main App component tests
```

### Test Categories

Each test file is organized into logical categories:

1. **Header Section Tests** - Page titles, descriptions, and main actions
2. **Component Rendering Tests** - UI elements and their display
3. **User Interaction Tests** - Click events, form inputs, navigation
4. **Data Handling Tests** - API calls, state management, data validation
5. **Error Handling Tests** - Error states, network failures, edge cases
6. **Responsive Design Tests** - Mobile/desktop layouts
7. **Accessibility Tests** - ARIA labels, keyboard navigation, semantic HTML
8. **Performance Tests** - Rendering efficiency, memory usage

## 🧪 Test Coverage

### Dashboard (Index) Screen - `Index.test.tsx`

**Coverage Areas:**
- ✅ Hero section with banner image and welcome message
- ✅ Stats cards displaying key metrics
- ✅ Couple information and details
- ✅ Budget overview and progress
- ✅ Vendor categories and counts
- ✅ Quick action buttons
- ✅ Wedding timeline
- ✅ Theme preview
- ✅ AI insights
- ✅ Interactive elements and form handling
- ✅ Error handling for API failures
- ✅ Responsive design validation
- ✅ Accessibility compliance

**Key Test Scenarios:**
- Loading states and data fetching
- Budget calculations and progress tracking
- Vendor category filtering and display
- Timeline status management
- Theme selection and preview
- Form validation and error handling

### Vendor Discovery Screen - `VendorDiscovery.test.tsx`

**Coverage Areas:**
- ✅ Header section with search functionality
- ✅ Advanced search and filter options
- ✅ Category tabs and selection
- ✅ Vendor card display and information
- ✅ Contact scores and vendor details
- ✅ Favorite and share functionality
- ✅ Search results and filtering
- ✅ No results handling
- ✅ Loading states
- ✅ Error handling for API failures
- ✅ Responsive design
- ✅ Accessibility features

**Key Test Scenarios:**
- Search functionality with multiple filters
- Vendor data display and formatting
- Contact score validation
- Filter clearing and reset
- Pagination and result limits
- Mobile responsiveness

### Budget Management Screen - `BudgetManagement.test.tsx`

**Coverage Areas:**
- ✅ Budget overview cards
- ✅ Budget breakdown by category
- ✅ Progress tracking and calculations
- ✅ Recent transactions
- ✅ Budget insights and recommendations
- ✅ Interactive budget editing
- ✅ Data validation and error handling
- ✅ Responsive design
- ✅ Accessibility compliance

**Key Test Scenarios:**
- Budget calculations and percentages
- Category allocation management
- Transaction history and filtering
- Budget alerts and recommendations
- Data persistence and validation

### Wedding Preferences Screen - `WeddingPreferences.test.tsx`

**Coverage Areas:**
- ✅ Sidebar navigation between sections
- ✅ Basic details form (guests, date, location)
- ✅ Theme selection with visual previews
- ✅ Ceremony and reception preferences
- ✅ Catering and menu options
- ✅ Additional services selection
- ✅ Form validation and data persistence
- ✅ Responsive design
- ✅ Accessibility features

**Key Test Scenarios:**
- Multi-section form navigation
- Theme selection and preview
- Form validation and error handling
- Data saving and loading
- Mobile form interaction

### AI Chat Screen - `AIChat.test.tsx`

**Coverage Areas:**
- ✅ Chat interface and message display
- ✅ Message input and sending
- ✅ Quick action buttons
- ✅ Chat history management
- ✅ AI response handling
- ✅ Message formatting
- ✅ Error handling for API failures
- ✅ Responsive design
- ✅ Accessibility compliance

**Key Test Scenarios:**
- Real-time chat functionality
- Message sending and receiving
- Quick action integration
- Chat history persistence
- Error recovery and fallbacks

### App Component - `App.test.tsx`

**Coverage Areas:**
- ✅ Initial render and routing
- ✅ Sidebar navigation functionality
- ✅ Mobile responsiveness and menu
- ✅ Route management and state
- ✅ Layout structure and styling
- ✅ Accessibility features
- ✅ Performance optimization

**Key Test Scenarios:**
- Navigation between all screens
- Mobile menu functionality
- Route state management
- Responsive layout behavior

## 🛠️ Test Setup and Configuration

### Dependencies

```json
{
  "@testing-library/jest-dom": "^5.16.4",
  "@testing-library/react": "^13.3.0",
  "@testing-library/user-event": "^14.4.3",
  "@types/jest": "^27.5.2"
}
```

### Test Configuration

**Jest Configuration (`package.json`):**
```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/index.tsx",
      "!src/reportWebVitals.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### Test Setup File (`setupTests.ts`)

The setup file includes:
- Jest DOM matchers for DOM testing
- Window API mocks (matchMedia, IntersectionObserver, etc.)
- Performance API mocks
- Global fetch mock
- Console error/warning filtering

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm test -- --watchAll=false

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=Index.test.tsx

# Run tests with verbose output
npm test -- --verbose
```

### Using the Test Runner Script

```bash
# Make script executable
chmod +x run-tests.sh

# Run comprehensive test suite
./run-tests.sh
```

The test runner script provides:
- ✅ All tests execution
- ✅ Coverage report generation
- ✅ Individual component testing
- ✅ Verbose output
- ✅ Environment-specific testing

## 📊 Test Metrics and Coverage

### Coverage Targets

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Test Statistics

- **Total Test Files**: 6
- **Total Test Cases**: 200+
- **Test Categories**: 8 per file
- **Mock Components**: 5
- **API Mock Scenarios**: 10+

## 🧪 Test Patterns and Best Practices

### Component Mocking

```typescript
jest.mock('../components/StatsCard', () => {
  return function MockStatsCard({ title, value, icon }: any) {
    return <div data-testid="stats-card">{title}: {value}</div>;
  };
});
```

### API Mocking

```typescript
beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ /* mock data */ })
  });
});
```

### Router Testing

```typescript
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};
```

### User Interaction Testing

```typescript
it('should handle button clicks', () => {
  const button = screen.getByText('Click Me');
  fireEvent.click(button);
  expect(screen.getByText('Clicked!')).toBeInTheDocument();
});
```

### Async Testing

```typescript
it('should load data asynchronously', async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

## 🔍 Test Scenarios by Feature

### Dashboard Features

1. **Hero Section**
   - Banner image display
   - Welcome message with couple name
   - Days until wedding countdown
   - Budget progress visualization

2. **Stats Overview**
   - Budget spent/remaining
   - Vendor count by category
   - Timeline progress
   - Quick action buttons

3. **Data Integration**
   - NocoDB data fetching
   - API error handling
   - Loading states
   - Data validation

### Vendor Discovery Features

1. **Search and Filtering**
   - Text search functionality
   - Category filtering
   - Price range filtering
   - Rating filtering
   - Location filtering

2. **Vendor Display**
   - Vendor card layout
   - Contact information
   - Rating display
   - Contact score validation

3. **User Interactions**
   - Favorite vendors
   - Share functionality
   - Contact vendor
   - Clear filters

### Budget Management Features

1. **Budget Overview**
   - Total budget display
   - Spent amount tracking
   - Remaining budget calculation
   - Progress visualization

2. **Category Management**
   - Budget allocation by category
   - Spending tracking
   - Progress bars
   - Category editing

3. **Transaction History**
   - Recent transactions
   - Transaction details
   - Category filtering
   - Date sorting

### Wedding Preferences Features

1. **Multi-Section Form**
   - Sidebar navigation
   - Form validation
   - Data persistence
   - Section completion tracking

2. **Theme Selection**
   - Visual theme previews
   - Theme descriptions
   - Selection state management
   - Theme customization

3. **Service Selection**
   - Checkbox interactions
   - Service descriptions
   - Cost implications
   - Service combinations

### AI Chat Features

1. **Chat Interface**
   - Message display
   - User/AI message distinction
   - Timestamp display
   - Message formatting

2. **Quick Actions**
   - Predefined queries
   - Action button functionality
   - Response handling
   - Context awareness

3. **Chat Management**
   - Clear chat functionality
   - History persistence
   - Error recovery
   - Loading states

## 🐛 Common Test Issues and Solutions

### Issue: Component Not Found
**Solution**: Ensure proper mocking and import paths

### Issue: Router Context Missing
**Solution**: Wrap components with `BrowserRouter` in tests

### Issue: Async Operations Not Completing
**Solution**: Use `waitFor` for async operations

### Issue: Mock Data Not Loading
**Solution**: Reset mocks in `beforeEach` and provide proper mock data

### Issue: Styling Classes Not Found
**Solution**: Mock CSS modules or use `data-testid` attributes

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test -- --coverage --watchAll=false
      - run: npm run build
```

## 🔧 Maintenance and Updates

### Adding New Tests

1. Create test file in `src/__tests__/`
2. Follow existing test patterns
3. Add comprehensive coverage
4. Update documentation

### Updating Existing Tests

1. Maintain backward compatibility
2. Update mock data as needed
3. Ensure all scenarios covered
4. Validate test results

### Test Data Management

1. Use realistic mock data
2. Maintain data consistency
3. Update data with feature changes
4. Document data schemas

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://testing-library.com/docs/dom-testing-library/api-accessibility)

---

**Last Updated**: December 2024
**Test Suite Version**: 1.0.0
**Coverage Target**: 70%
**Total Test Cases**: 200+ 