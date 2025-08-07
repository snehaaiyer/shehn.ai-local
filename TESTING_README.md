# Wedding Platform Testing Suite

Complete end-to-end testing framework for the wedding planning platform, covering all core functionality including enhanced preferences, vendor discovery, budget analysis, and communication features.

## 🎯 Quick Start

### Option 1: Interactive Test Menu (Recommended)
```bash
python run_tests.py
```

### Option 2: Command Line Testing
```bash
# Manual interactive tests
python run_tests.py manual

# Automated tests (visible browser)
python run_tests.py auto

# Automated tests (headless)
python run_tests.py auto --headless

# API tests only
python run_tests.py api

# Start server only
python run_tests.py server
```

## 📋 Test Coverage

### ✅ Core Features Tested

1. **Enhanced Preferences System**
   - Theme and color selection
   - Date flexibility configuration (3/6/12 months)
   - Multi-day wedding duration (1-14 days)
   - Budget range selection
   - Photography style preferences
   - Preference persistence across sessions

2. **Vendor Discovery Engine**
   - Vendor data loading for all categories
   - Availability confidence scoring
   - Date flexibility impact on availability
   - Multi-day wedding availability calculations
   - Category filtering (venues, decoration, catering, makeup, photography)

3. **Budget Analysis System**
   - Single-day budget calculations
   - Multi-day budget scaling with category-specific multipliers
   - All budget ranges (₹5-15L to ₹50L+)
   - Category breakdown accuracy

4. **Communication Features**
   - WhatsApp message generation
   - Email message generation
   - Vendor-specific messaging

5. **Integration & Data Flow**
   - Preference-to-discovery integration
   - Real-time preference updates
   - End-to-end user journeys

## 🧪 Test Types

### 1. Manual Tests (`manual_test_checklist.py`)

**Best for:** Understanding features, debugging issues, user acceptance testing

**Features:**
- Interactive step-by-step guidance
- Browser-based testing with human verification
- Covers all user scenarios
- No setup dependencies (just web browser)

**Usage:**
```bash
python manual_test_checklist.py
# or
python run_tests.py manual
```

**Output:** `manual_test_results.json`

---

### 2. Automated Tests (`test_automation.py`)

**Best for:** Regression testing, CI/CD pipelines, rapid validation

**Features:**
- Selenium WebDriver automation
- Comprehensive UI testing
- Parallel execution capability
- Both visible and headless modes

**Requirements:**
```bash
pip install selenium
# Chrome browser installed
# chromedriver in PATH (or auto-download)
```

**Usage:**
```bash
python test_automation.py
# or
python run_tests.py auto
python run_tests.py auto --headless
```

**Output:** `test_results.json`

---

### 3. API Tests (Built into `run_tests.py`)

**Best for:** Quick health checks, backend validation, CI/CD

**Features:**
- Direct API testing
- No browser dependencies
- Fast execution
- Core functionality validation

**Usage:**
```bash
python run_tests.py api
```

---

## 📊 Test Scenarios

### Scenario 1: Single Day Wedding
```
Date Flexibility: Within 6 months
Wedding Duration: 1 day
Budget: Premium (₹15-30L)
Expected: High confidence scores, ₹25L budget
```

### Scenario 2: Multi-Day Celebration
```
Date Flexibility: Within 6 months  
Wedding Duration: 3 days
Budget: Premium (₹15-30L)
Expected: Reduced confidence, ₹62.5L budget
```

### Scenario 3: Extended Wedding
```
Date Flexibility: Within 6 months
Wedding Duration: 7 days
Budget: Premium (₹15-30L)
Expected: Lower confidence, ₹144.7L budget
```

### Scenario 4: Specific Date Booking
```
Date Flexibility: Specific date (30 days future)
Wedding Duration: 1 day
Budget: Premium (₹15-30L)
Expected: Reduced confidence due to short notice
```

## 🔍 Key Test Cases

### TC-1: Enhanced Preferences Flow
- ✅ Theme selection and visual feedback
- ✅ Color palette selection
- ✅ Date and timeline configuration
- ✅ Multi-day duration input (1-14 days)
- ✅ Budget range selection
- ✅ Preference saving and localStorage persistence
- ✅ Preference restoration after browser restart

### TC-2: Vendor Discovery & Availability
- ✅ Vendor data loading for all categories
- ✅ Availability confidence scoring algorithm
- ✅ Date flexibility impact on confidence
- ✅ Multi-day wedding availability calculations
- ✅ Confidence badge color coding (🟢🟡🔴)
- ✅ Category tab switching

### TC-3: Budget Analysis
- ✅ Single-day budget calculations
- ✅ Multi-day scaling with category multipliers
- ✅ All budget ranges validation
- ✅ Category breakdown accuracy
- ✅ Mathematical consistency

### TC-4: Communication Features
- ✅ WhatsApp message generation
- ✅ Email message generation
- ✅ Vendor-specific messaging
- ✅ Preference integration in messages

### TC-5: Integration Testing
- ✅ Preference-to-discovery data flow
- ✅ Real-time preference updates
- ✅ End-to-end user journeys
- ✅ Cross-component data consistency

## 📈 Confidence Scoring Algorithm

### Base Calculation
```
Base Confidence = Vendor Rating × 20 (max 95%)
```

### Date Flexibility Bonuses
- **3 months:** +10% confidence
- **6 months:** +15% confidence  
- **12 months:** +20% confidence

### Multi-Day Penalties
- **Each additional day:** -5% confidence (min 60%)

### Specific Date Penalties
- **<30 days notice:** -20% confidence
- **30-90 days:** -5% confidence
- **90+ days:** +5% confidence

### Badge Thresholds
- 🟢 **High:** ≥85% confidence
- 🟡 **Medium:** 70-84% confidence
- 🔴 **Low:** <70% confidence

## 💰 Budget Scaling Logic

### Category Multipliers (per day)
- **Venue:** 0.8x (package discounts)
- **Catering:** 1.0x (full daily cost)
- **Photography:** 0.7x (multi-day packages)
- **Decoration:** 0.6x (reusable elements)
- **Makeup:** 1.0x (daily requirements)
- **Miscellaneous:** 0.8x (partial scaling)

### Budget Examples
| Base Budget | 1 Day | 3 Days | 7 Days |
|-------------|-------|--------|---------|
| Premium (₹25L) | ₹25L | ₹62.5L | ₹144.7L |
| Luxury (₹40L) | ₹40L | ₹100L | ₹231.5L |

## 🚀 Running Tests

### Prerequisites
```bash
# Install Python dependencies
pip install requests fastapi uvicorn

# For automated tests only
pip install selenium
```

### Start Testing
1. **Start the server:**
   ```bash
   python simple_unified_server.py
   ```

2. **Run tests (choose one):**
   ```bash
   # Interactive menu
   python run_tests.py
   
   # Quick API validation
   python run_tests.py api
   
   # Manual testing
   python run_tests.py manual
   
   # Automated testing
   python run_tests.py auto
   ```

### Test Files Generated
- `test_cases_e2e.md` - Detailed test documentation
- `manual_test_results.json` - Manual test results
- `test_results.json` - Automated test results

## 🔧 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 8000 is already in use
- Ensure `simple_unified_server.py` exists
- Verify Python dependencies are installed

**Selenium tests fail:**
- Install Chrome browser
- Update chromedriver: `webdriver-manager install`
- Try headless mode: `python run_tests.py auto --headless`

**Manual tests incomplete:**
- Follow prompts carefully
- Ensure browser is open to correct URLs
- Check network connectivity

### Debug Mode
```bash
# Enable detailed logging
python run_tests.py auto --verbose

# Check server logs
python simple_unified_server.py --debug
```

## 📊 Success Criteria

### Functional Requirements
- ✅ 100% of core user journeys work end-to-end
- ✅ All preference types save and restore correctly
- ✅ Vendor discovery works across all categories
- ✅ Budget calculations are mathematically accurate
- ✅ Communication features generate appropriate messages

### Performance Requirements
- ✅ Enhanced preferences page load: <2 seconds
- ✅ Vendor discovery initial load: <3 seconds
- ✅ API responses: <1 second
- ✅ Budget analysis: <500ms

### Integration Requirements
- ✅ Seamless data flow between components
- ✅ Preference persistence across sessions
- ✅ Real-time updates without page refresh

## 📝 Test Reporting

### Automated Reports
```json
{
  "test": "Enhanced Preferences Basic",
  "status": "PASS",
  "details": "All selections saved correctly",
  "timestamp": "2025-01-14 10:30:15"
}
```

### Manual Test Metrics
- Success rate percentage
- Failed test details
- Execution timestamps
- User feedback integration

## 🎉 Continuous Testing

### CI/CD Integration
```bash
# In CI pipeline
python run_tests.py api --headless
if [ $? -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed"
  exit 1
fi
```

### Regression Testing
- Run after each feature update
- Validate multi-day calculations
- Verify preference persistence
- Check API compatibility

This comprehensive testing suite ensures the wedding platform delivers a reliable, user-friendly experience across all core functionality. 