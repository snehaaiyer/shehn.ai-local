# End-to-End Test Cases - Wedding Platform

## Test Environment Setup
- **Base URL**: http://localhost:8000
- **Server**: simple_unified_server.py
- **Browser**: Chrome/Firefox/Safari
- **Test Data**: Pre-defined preferences and vendor scenarios

---

## Test Suite 1: Enhanced Preferences Flow

### TC-1.1: Basic Preference Selection (Happy Path)
**Objective**: Verify user can select and save basic wedding preferences
**Prerequisites**: Server running, fresh browser session

**Test Steps**:
1. Navigate to `http://localhost:8000/enhanced-preferences.html`
2. **Themes & Colors Tab**:
   - Select "Traditional Indian" theme
   - Select "Burgundy & Gold" color palette
   - Enter custom color: "Deep Purple with Gold Accents"
3. **Date & Timeline Tab**:
   - Select "Within 6 Months" flexibility
   - Choose "Winter" season
   - Select "3 Days" duration
   - Choose "Medium (100-300)" guest count
   - Set wedding days: 3
   - Set specific date: Future date
   - Select "Premium (₹15-30L)" budget
4. **Photography Tab**:
   - Select "Candid" style
5. **Decor & Venue Tab**:
   - Select "Lush & Full" floral style
   - Choose "Fairy Lights" lighting
   - Select "Modern" furniture
   - Choose "Outdoor" venue type
6. **Entertainment Tab**:
   - Check "Bollywood" and "Folk/Traditional" music
   - Check "Live Band" and "Dance Performances" entertainment
7. Click "Save Preferences" button

**Expected Results**:
- All selections appear in summary banner
- Success alert shows "Preferences saved successfully!"
- Browser localStorage contains saved preferences
- Summary shows "3 Days" duration and formatted start date

**Verification Points**:
```javascript
// Browser Console Check
JSON.parse(localStorage.getItem('weddingPreferences'))
```

---

### TC-1.2: Multi-Day Wedding Configuration
**Objective**: Test various wedding duration scenarios
**Test Data**: 1, 3, 7, 14 day configurations

**Test Steps**:
1. Navigate to Date & Timeline tab
2. **Scenario 1**: Set wedding days to 1
   - Verify summary shows no duration indicator
3. **Scenario 2**: Set wedding days to 3  
   - Verify summary shows "3 Days"
4. **Scenario 3**: Set wedding days to 7
   - Verify summary shows "7 Days" 
5. **Scenario 4**: Set wedding days to 14 (boundary)
   - Verify field accepts maximum value
6. **Scenario 5**: Attempt to enter 15 days
   - Verify field validation prevents > 14

**Expected Results**:
- Duration correctly reflected in selections banner
- Input validation works for boundaries
- Preference object stores correct weddingDays value

---

### TC-1.3: Preference Persistence and Restoration
**Objective**: Verify preferences are saved and restored correctly

**Test Steps**:
1. Complete TC-1.1 to save preferences
2. Close browser completely
3. Reopen browser and navigate to enhanced-preferences.html
4. Verify all previous selections are restored:
   - Theme card shows "selected" state
   - Color palette shows "selected" state
   - All option buttons show "selected" state
   - Input fields contain previous values
   - Checkboxes show checked state
   - Selections banner displays all saved preferences

**Expected Results**:
- 100% accurate preference restoration
- UI state matches saved data
- No data loss during browser restart

---

## Test Suite 2: Vendor Discovery & Availability

### TC-2.1: Basic Vendor Search with Preferences
**Objective**: Test vendor discovery with applied preferences

**Test Steps**:
1. Complete preference setup (TC-1.1)
2. Navigate to `http://localhost:8000/vendor-discovery`
3. Verify vendor data loads for all categories:
   - Venues tab loads with vendors
   - Decoration tab shows decorators
   - Catering tab displays caterers
   - Makeup tab shows makeup artists
   - Photography tab lists photographers
4. Check that preferences are applied:
   - Applied filters indicator shows active preferences
   - URL parameters include preference data
5. Verify vendor cards display:
   - Vendor name and basic info
   - Availability section with confidence badges
   - Rating information
   - Contact options

**Expected Results**:
- All vendor categories load successfully
- Preference filters are applied and visible
- Vendor cards show complete information
- Availability confidence scoring displays correctly

**API Verification**:
```
GET /api/vendor-data/venues?dateFlexibility=6months&guestCount=medium&weddingDays=3
```

---

### TC-2.2: Date Flexibility Impact on Availability
**Objective**: Test how date flexibility affects vendor availability and confidence

**Test Scenarios**:

**Scenario A - Specific Date**:
1. Set preferences: Specific date (30 days future), 1 day wedding
2. Check vendor availability displays
3. Note confidence scores

**Scenario B - 3 Month Flexibility**:
1. Change to "Within 3 Months", 1 day wedding
2. Compare confidence scores (should be +10% higher)
3. Verify availability messaging changes

**Scenario C - 6 Month Flexibility**:
1. Change to "Within 6 Months", 1 day wedding
2. Verify confidence boost (+15% from base)

**Scenario D - 12 Month Flexibility**:
1. Change to "Within 12 Months", 1 day wedding  
2. Verify maximum confidence boost (+20% from base)

**Expected Results**:
- Confidence scores increase with flexibility: 3mo(+10%) < 6mo(+15%) < 12mo(+20%)
- Availability messages adapt to flexibility level
- Green/Orange/Red badges update appropriately
- Vendor rankings may change based on confidence

---

### TC-2.3: Multi-Day Wedding Availability Impact
**Objective**: Test how wedding duration affects availability and confidence

**Test Scenarios**:

**Scenario A - Single Day**:
1. Set: 6 month flexibility, 1 day duration
2. Record confidence scores for top 3 vendors

**Scenario B - 3 Day Wedding**:
1. Change to 3 days duration, same flexibility
2. Compare confidence scores (should be -10% from single day)
3. Verify availability messages show duration

**Scenario C - 7 Day Wedding**:
1. Change to 7 days duration
2. Verify significant confidence reduction (-30% from single day)
3. Check availability drops appropriately

**Expected Results**:
- Confidence decreases: 1 day > 3 days > 7 days
- Availability percentages decrease with duration
- Messages show "Available for your X-day wedding celebration"
- Some vendors may drop below visibility thresholds

---

### TC-2.4: Availability Confidence Scoring Algorithm
**Objective**: Verify confidence calculation accuracy

**Test Data**: Known vendor with 4.5 rating

**Manual Calculation Verification**:
1. Base confidence = 4.5 × 20 = 90%
2. **Single day, 6 months flexibility**: 90% + 15% = 105% (capped at 95%)
3. **3 days, 6 months flexibility**: 90% + 15% - 10% = 95%
4. **7 days, 6 months flexibility**: 90% + 15% - 30% = 75%
5. **Specific date <30 days**: 90% - 20% = 70%

**Test Steps**:
1. Find vendor with known rating
2. Test each scenario above
3. Verify displayed confidence matches calculation
4. Confirm badge colors: 🟢 High(85%+), 🟡 Medium(70-84%), 🔴 Low(<70%)

**Expected Results**:
- Mathematical accuracy in confidence calculation
- Proper confidence capping (never > 95%)
- Correct badge color assignment
- Minimum thresholds enforced (confidence ≥ 60%, availability ≥ 10%)

---

## Test Suite 3: Budget Analysis

### TC-3.1: Single Day Budget Analysis
**Objective**: Test budget calculation for single day weddings

**Test Steps**:
1. Navigate to vendor discovery
2. Open browser developer tools → Network tab
3. Set preferences: 1 day, Premium budget (₹15-30L)
4. Trigger budget analysis API call
5. Verify response structure and calculations

**Expected Results**:
```json
{
  "totalBudget": 25000000,
  "categoryBreakdown": {
    "Venue": 7500000,
    "Catering": 6250000,
    "Photography": 3750000,
    "Decoration": 3750000,
    "Makeup": 1875000,
    "Miscellaneous": 1875000
  },
  "dayMultiplier": 1.0,
  "notes": "Single day budget analysis"
}
```

**API Verification**:
```
POST /api/budget-analysis
Body: {"budget": "premium", "weddingDays": 1}
```

---

### TC-3.2: Multi-Day Budget Scaling
**Objective**: Test budget scaling for multi-day weddings

**Test Scenarios**:

**3-Day Wedding Budget**:
1. Set: Premium budget, 3 days
2. Verify total budget ≈ ₹62.5L (25L × 2.5 multiplier)
3. Check category-specific scaling:
   - Venue: ₹18L (25% base × 3 × 0.8 multiplier)
   - Catering: ₹18.75L (25% base × 3 × 1.0 multiplier)
   - Photography: ₹7.875L (15% base × 3 × 0.7 multiplier)
   - Decoration: ₹6.75L (15% base × 3 × 0.6 multiplier)
   - Makeup: ₹5.625L (7.5% base × 3 × 1.0 multiplier)
   - Miscellaneous: ₹5.625L (7.5% base × 3 × 0.8 multiplier)

**7-Day Wedding Budget**:
1. Set: Premium budget, 7 days
2. Verify total budget ≈ ₹144.7L
3. Check extreme scaling scenarios

**Expected Results**:
- Accurate mathematical scaling
- Category-specific multipliers applied correctly
- Total equals sum of categories
- Realistic budget progression

---

### TC-3.3: Budget Range Testing
**Objective**: Test all budget ranges with multi-day scaling

**Test Matrix**:
| Budget Range | Days | Expected Base | Expected 3-Day | Expected 7-Day |
|--------------|------|---------------|----------------|----------------|
| Budget (₹5-15L) | 1 | ₹10L | ₹25L | ₹57.9L |
| Premium (₹15-30L) | 1 | ₹25L | ₹62.5L | ₹144.7L |
| Luxury (₹30-50L) | 1 | ₹40L | ₹100L | ₹231.5L |
| Ultra Luxury (₹50L+) | 1 | ₹75L | ₹187.5L | ₹434.3L |

**Test Steps**:
1. For each budget range:
   - Test 1-day calculation
   - Test 3-day scaling  
   - Test 7-day scaling
2. Verify category breakdowns are proportional
3. Check for mathematical consistency

---

## Test Suite 4: Communication Features

### TC-4.1: WhatsApp Message Generation
**Objective**: Test WhatsApp message generation for vendor communication

**Test Steps**:
1. Navigate to vendor discovery
2. Select a venue vendor
3. Click "WhatsApp" button
4. Verify message generation API call
5. Check generated message content includes:
   - Couple names (if available)
   - Wedding date preferences
   - Guest count
   - Specific venue inquiry
   - Professional tone

**Expected Message Format**:
```
Dear [Vendor Name],

I hope this message finds you well. I am reaching out regarding our upcoming wedding celebration and would like to inquire about your [service type] services.

Details:
- Date Flexibility: Within 6 months
- Guest Count: 100-300 guests  
- Duration: 3-day celebration
- Budget Range: Premium (₹15-30L)

We are particularly interested in your venue and would appreciate the opportunity to discuss availability and packages.

Could we schedule a call to discuss further?

Best regards
```

**API Verification**:
```
POST /api/generate-whatsapp-message
Body: {vendor details, preferences}
```

---

### TC-4.2: Email Message Generation
**Objective**: Test formal email message generation

**Test Steps**:
1. Select vendor and click "Email" button
2. Verify more formal message generation
3. Check message includes:
   - Formal salutation
   - Detailed requirements
   - Professional closing
   - Contact information request

**Expected Results**:
- More formal tone than WhatsApp
- Complete wedding details
- Call-to-action for vendor response
- Professional language throughout

---

### TC-4.3: Cross-Category Communication
**Objective**: Test communication across different vendor categories

**Test Steps**:
1. Generate messages for vendors in each category:
   - Venues
   - Decoration
   - Catering  
   - Makeup
   - Photography
2. Verify category-specific customization
3. Check that preferences are consistently included

**Expected Results**:
- Service-specific language and inquiries
- Consistent preference information
- Appropriate messaging for each vendor type

---

## Test Suite 5: Integration & Cross-Feature Testing

### TC-5.1: Preference-to-Discovery Integration
**Objective**: Test seamless flow from preference setting to vendor discovery

**Complete User Journey**:
1. Start at enhanced-preferences.html
2. Set comprehensive preferences (all tabs)
3. Save preferences  
4. Navigate to vendor-discovery
5. Verify preferences are automatically applied
6. Check that search results reflect preferences
7. Verify URL parameters include preference data

**Expected Results**:
- Zero manual preference re-entry required
- Automatic preference application
- Consistent data flow between components
- URL reflects applied filters

---

### TC-5.2: Budget Analysis Integration
**Objective**: Test budget analysis integration with preferences

**Test Steps**:
1. Set preferences with specific budget range and duration
2. Navigate to vendor discovery
3. Trigger budget analysis
4. Verify analysis uses saved preferences
5. Check budget scaling matches multi-day configuration
6. Confirm category breakdowns are realistic

**Expected Results**:
- Budget analysis auto-uses saved preferences
- Scaling calculations match wedding duration
- Category advice appears for multi-day weddings

---

### TC-5.3: Real-Time Preference Updates
**Objective**: Test dynamic updates when preferences change

**Test Steps**:
1. Load vendor discovery with initial preferences
2. Use "Clear Applied Preferences" option
3. Apply new preferences
4. Verify vendor results update dynamically
5. Check availability confidence recalculates
6. Confirm budget analysis updates

**Expected Results**:
- Real-time vendor list updates
- Confidence scores recalculate instantly  
- No page refresh required
- Smooth user experience

---

## Test Suite 6: Error Handling & Edge Cases

### TC-6.1: API Error Handling
**Objective**: Test system behavior during API failures

**Test Scenarios**:
1. **Network Disconnection**:
   - Disconnect internet during vendor data loading
   - Verify graceful error messages
   - Check retry mechanisms

2. **Server Errors**:
   - Stop server during operation
   - Verify error messages are user-friendly
   - Test recovery when server restarts

3. **Invalid Preference Data**:
   - Corrupt localStorage preferences
   - Verify system handles gracefully
   - Check fallback behavior

**Expected Results**:
- User-friendly error messages
- No application crashes
- Graceful degradation
- Clear recovery instructions

---

### TC-6.2: Boundary Value Testing
**Objective**: Test system limits and boundaries

**Test Cases**:
1. **Wedding Days**: Test 1, 14, and invalid values (0, 15)
2. **Date Selection**: Past dates, far future dates
3. **Browser Storage**: Maximum localStorage capacity
4. **Long Input Values**: Very long custom color descriptions
5. **Special Characters**: Unicode, emojis in custom inputs

**Expected Results**:
- Proper validation messages
- No system crashes
- Data integrity maintained
- Graceful handling of edge cases

---

### TC-6.3: Browser Compatibility
**Objective**: Test cross-browser functionality

**Test Matrix**:
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|---------|------|
| Preference Selection | ✓ | ✓ | ✓ | ✓ |
| LocalStorage Persistence | ✓ | ✓ | ✓ | ✓ |
| Vendor Discovery | ✓ | ✓ | ✓ | ✓ |
| Budget Analysis | ✓ | ✓ | ✓ | ✓ |
| Message Generation | ✓ | ✓ | ✓ | ✓ |

**Test Process**:
1. Execute core test cases in each browser
2. Verify UI rendering consistency
3. Check JavaScript functionality
4. Test localStorage behavior
5. Validate API communication

---

## Test Suite 7: Performance & Load Testing

### TC-7.1: Page Load Performance
**Objective**: Measure and validate page load times

**Metrics to Track**:
- Enhanced preferences page load: < 2 seconds
- Vendor discovery initial load: < 3 seconds  
- Vendor data API response: < 1 second
- Budget analysis calculation: < 500ms
- Message generation: < 300ms

**Test Steps**:
1. Use browser dev tools → Performance tab
2. Measure first contentful paint
3. Track API response times
4. Verify progressive loading

---

### TC-7.2: Large Dataset Handling
**Objective**: Test performance with large vendor datasets

**Test Scenarios**:
1. Load vendor discovery with 100+ vendors per category
2. Apply/remove filters with large datasets  
3. Test scroll performance with long vendor lists
4. Verify search responsiveness

**Expected Results**:
- Smooth scrolling with large lists
- Fast filter application
- No UI freezing
- Responsive interactions

---

## Test Execution Plan

### Phase 1: Core Functionality (Day 1)
- Execute Test Suites 1-2 (Preferences + Discovery)
- Focus on happy path scenarios
- Establish baseline functionality

### Phase 2: Advanced Features (Day 2)  
- Execute Test Suites 3-4 (Budget + Communication)
- Test integration scenarios
- Validate complex calculations

### Phase 3: Quality & Reliability (Day 3)
- Execute Test Suites 5-7 (Integration + Error Handling + Performance)
- Focus on edge cases and error scenarios
- Cross-browser validation

### Test Environment Requirements
- **Development Server**: simple_unified_server.py on port 8000
- **Test Browsers**: Chrome (latest), Firefox (latest), Safari (if on Mac)
- **Network Conditions**: Stable internet for API testing
- **Test Data**: Pre-defined preference sets and vendor scenarios

### Success Criteria
- **Functional**: 100% of core user journeys work end-to-end
- **Integration**: Seamless data flow between all components  
- **Performance**: All pages load within performance targets
- **Reliability**: Error handling prevents crashes and provides clear feedback
- **Compatibility**: Core functionality works across target browsers

### Bug Reporting Template
```markdown
**Bug ID**: BUG-001
**Component**: Enhanced Preferences
**Severity**: High/Medium/Low
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Browser**: Chrome 120.0.0.0
**Screenshot**: [Attach if applicable]
**Additional Notes**: Any relevant context
```

This comprehensive test plan covers all core functionality and ensures the wedding platform works reliably end-to-end across all user scenarios. 