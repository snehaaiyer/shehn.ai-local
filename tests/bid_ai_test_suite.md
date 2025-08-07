# BID AI Wedding Assistant - Comprehensive Test Suite

## Test Suite Overview
This comprehensive test suite covers all BID AI functionalities based on the product requirements document and implemented features.

**Test Environment:** Local & Production  
**Test Framework:** Manual & Automated  
**Coverage:** UI, API, Integration, Performance, Security  
**Last Updated:** 2024

---

## 1. CORE FUNCTIONALITY TESTS

### 1.1 Wedding Form Tests

#### TC-WF-001: Basic Wedding Form Submission
**Priority:** Critical  
**Description:** Test basic wedding form submission with valid data  
**Preconditions:** User on wedding form screen  

**Test Steps:**
1. Navigate to Wedding Form screen
2. Fill all required fields:
   - Couple Names: "John & Jane"
   - Wedding Date: Future date
   - City: "Mumbai"
   - Budget: "5-10 lakhs"
   - Guest Count: "200"
   - Wedding Type: "Hindu"
3. Click "Submit Wedding Plan"

**Expected Results:**
- Form validates successfully
- Loading overlay shows "Creating your wedding plan..."
- Success notification appears
- Data saved to NocoDB
- Dashboard updates with new wedding data
- Progress bar shows 100%

**Pass Criteria:** All expected results achieved within 5 seconds

---

#### TC-WF-002: Form Validation Tests
**Priority:** High  
**Description:** Test form validation for all required fields  

**Test Cases:**
1. **Empty Form Submission**
   - Leave all fields empty
   - Click submit
   - Expected: Validation errors for all required fields

2. **Invalid Date**
   - Enter past date
   - Expected: "Please select a future date" error

3. **Invalid Budget**
   - Enter negative number
   - Expected: "Please select a valid budget range" error

4. **Invalid Guest Count**
   - Enter 0 or negative number
   - Expected: "Guest count must be at least 1" error

---

#### TC-WF-003: Auto-Save Functionality
**Priority:** Medium  
**Description:** Test auto-save during form filling  

**Test Steps:**
1. Start filling wedding form
2. Fill 50% of fields
3. Wait 30 seconds (auto-save interval)
4. Navigate to another screen
5. Return to wedding form

**Expected Results:**
- Auto-save notification appears after 30 seconds
- Form data persists when returning
- No data loss occurs

---

### 1.2 AI-Powered Vendor Discovery Tests

#### TC-VD-001: Basic Vendor Search
**Priority:** Critical  
**Description:** Test AI vendor discovery functionality  

**Test Steps:**
1. Complete wedding form with:
   - City: "Mumbai"
   - Wedding Type: "Hindu"
   - Guest Count: 200
   - Budget: 500000
2. Click "Discover Vendors"
3. Wait for AI processing

**Expected Results:**
- Loading shows "AI is discovering vendors..."
- CrewAI agent activates
- Returns 5+ vendors with:
  - Business name
  - Contact details
  - Services offered
  - Pricing range
  - Ratings/reviews
- Vendors displayed in organized table
- AI activity logged to NocoDB

**Pass Criteria:** Vendors returned within 30 seconds

---

#### TC-VD-002: Vendor Search by Category
**Priority:** High  
**Description:** Test vendor search for specific categories  

**Categories to Test:**
- Photography
- Catering
- Venue
- Decoration
- Music/DJ
- Transportation

**For Each Category:**
1. Select category
2. Run vendor search
3. Verify results are category-specific
4. Check vendor details completeness

---

#### TC-VD-003: City-Specific Vendor Search
**Priority:** High  
**Description:** Test vendor search across different cities  

**Cities to Test:**
- Mumbai
- Delhi
- Bangalore
- Chennai
- Kolkata
- Pune
- Hyderabad

**For Each City:**
1. Set city in form
2. Search for vendors
3. Verify vendors are location-specific
4. Check local contact information

---

### 1.3 Budget Planning & Analysis Tests

#### TC-BP-001: AI Budget Allocation
**Priority:** Critical  
**Description:** Test AI-powered budget planning  

**Test Steps:**
1. Set total budget: ₹500,000
2. Set guest count: 200
3. Select priority areas: ["Venue", "Photography", "Food"]
4. Select events: ["Sangeet", "Wedding", "Reception"]
5. Request budget plan

**Expected Results:**
- AI generates detailed budget breakdown
- Allocations follow industry standards:
  - Venue & Catering: 40-50%
  - Photography: 8-12%
  - Decoration: 8-15%
  - Clothing: 10-15%
  - Music: 5-8%
  - Transportation: 3-5%
  - Buffer: 5-10%
- Specific amounts calculated
- Cost-saving tips provided
- Budget saved to database

---

#### TC-BP-002: Budget Optimization
**Priority:** Medium  
**Description:** Test budget optimization for different scenarios  

**Test Scenarios:**
1. **Low Budget (₹200,000)**
   - Expected: More conservative allocations
   - Focus on essentials
   - Cost-saving suggestions

2. **High Budget (₹2,000,000)**
   - Expected: Premium allocations
   - Luxury options suggested
   - Enhanced experiences

3. **Priority-Based Allocation**
   - Photography priority: Higher photography budget
   - Venue priority: Higher venue budget
   - Food priority: Higher catering budget

---

### 1.4 Cultural Wedding Advice Tests

#### TC-CA-001: Hindu Wedding Traditions
**Priority:** High  
**Description:** Test cultural advice for Hindu weddings  

**Test Steps:**
1. Set wedding type: "Hindu"
2. Set region: "North Indian"
3. Ask specific question: "What are the essential ceremonies?"
4. Request cultural guidance

**Expected Results:**
- Comprehensive guide covering:
  - Essential ceremonies (Mehndi, Sangeet, Haldi, Wedding, Reception)
  - Traditional attire recommendations
  - Auspicious timing considerations
  - Required rituals and order
  - Traditional foods
  - Music traditions
  - Decoration themes
  - Gift-giving customs
  - Regional variations

---

#### TC-CA-002: Multi-Cultural Wedding Support
**Priority:** Medium  
**Description:** Test advice for different wedding types  

**Wedding Types to Test:**
- Muslim
- Christian
- Sikh
- Buddhist
- Mixed/Interfaith

**For Each Type:**
1. Request cultural guidance
2. Verify tradition-specific advice
3. Check authenticity and respect
4. Ensure practical recommendations

---

### 1.5 Visual Preferences & Themes Tests

#### TC-VP-001: Theme Selection
**Priority:** Medium  
**Description:** Test visual theme customization  

**Test Steps:**
1. Navigate to Visual Preferences
2. Test each theme:
   - Rose Gold Elegance (Default)
   - Romantic Blush
   - Royal Luxury
   - Natural Serenity
3. Apply each theme

**Expected Results:**
- Theme changes apply immediately
- UI colors update correctly
- Theme preference saved
- Notification confirms theme change
- Theme persists across sessions

---

#### TC-VP-002: Color Palette Customization
**Priority:** Low  
**Description:** Test custom color selections  

**Test Steps:**
1. Select custom color options
2. Preview changes
3. Apply custom palette
4. Save preferences

**Expected Results:**
- Live preview works
- Colors apply consistently
- Custom palette saved
- Reset option available

---

## 2. INTEGRATION TESTS

### 2.1 NocoDB Integration Tests

#### TC-DB-001: Database Connection
**Priority:** Critical  
**Description:** Test NocoDB database connectivity  

**Test Steps:**
1. Start application
2. Check database connection status
3. Verify all 10 tables accessible:
   - Weddings
   - Couples
   - Venues
   - Vendors
   - Tasks
   - Preferences
   - Communications
   - Ceremonies
   - Budget
   - AI Activities

**Expected Results:**
- All tables accessible
- Connection status shows "Active"
- No authentication errors
- Data operations succeed

---

#### TC-DB-002: CRUD Operations
**Priority:** Critical  
**Description:** Test Create, Read, Update, Delete operations  

**For Each Table:**
1. **Create:** Add new record
2. **Read:** Retrieve records
3. **Update:** Modify existing record
4. **Delete:** Remove record

**Expected Results:**
- All operations complete successfully
- Data integrity maintained
- Proper error handling
- Audit trail maintained

---

#### TC-DB-003: Data Synchronization
**Priority:** High  
**Description:** Test data sync between frontend and database  

**Test Steps:**
1. Create wedding in frontend
2. Verify data appears in NocoDB
3. Modify data in frontend
4. Verify changes sync to database
5. Check data consistency

**Expected Results:**
- Real-time synchronization
- No data loss
- Consistent data state
- Proper timestamps

---

### 2.2 CrewAI Integration Tests

#### TC-AI-001: AI Service Connectivity
**Priority:** Critical  
**Description:** Test CrewAI service connection  

**Test Steps:**
1. Check AI service status endpoint
2. Verify Ollama connection
3. Test model availability
4. Check agent initialization

**Expected Results:**
- Service responds to health checks
- Ollama model loaded successfully
- All AI agents initialized
- No connection errors

---

#### TC-AI-002: AI Agent Performance
**Priority:** High  
**Description:** Test AI agent response quality  

**Test Cases:**
1. **Vendor Discovery Agent**
   - Input: Valid search criteria
   - Expected: Relevant vendor list
   - Response time: <30 seconds

2. **Budget Planning Agent**
   - Input: Budget parameters
   - Expected: Detailed allocation plan
   - Response time: <15 seconds

3. **Cultural Advice Agent**
   - Input: Wedding type and questions
   - Expected: Authentic cultural guidance
   - Response time: <20 seconds

---

#### TC-AI-003: AI Error Handling
**Priority:** Medium  
**Description:** Test AI service error scenarios  

**Test Scenarios:**
1. **Service Unavailable**
   - Simulate AI service down
   - Expected: Graceful degradation
   - User notified of limitation

2. **Model Overloaded**
   - Simulate high load
   - Expected: Queue requests
   - Show appropriate wait times

3. **Invalid Requests**
   - Send malformed data
   - Expected: Proper error messages
   - No system crashes

---

### 2.3 API Integration Tests

#### TC-API-001: Wedding API Endpoints
**Priority:** Critical  
**Description:** Test all wedding-related API endpoints  

**Endpoints to Test:**
- `POST /api/weddings` - Create wedding
- `GET /api/weddings` - List weddings
- `PUT /api/weddings/{id}` - Update wedding
- `DELETE /api/weddings/{id}` - Delete wedding
- `POST /api/discover-vendors` - AI vendor search
- `POST /api/plan-budget` - AI budget planning
- `POST /api/cultural-advice` - AI cultural guidance

**For Each Endpoint:**
1. Test with valid data
2. Test with invalid data
3. Test authentication
4. Test rate limiting
5. Verify response format

---

#### TC-API-002: API Response Times
**Priority:** Medium  
**Description:** Test API performance benchmarks  

**Performance Targets:**
- Standard CRUD operations: <2 seconds
- AI vendor discovery: <30 seconds
- Budget planning: <15 seconds
- Cultural advice: <20 seconds

**Test Method:**
1. Make 100 requests per endpoint
2. Measure response times
3. Calculate averages and percentiles
4. Verify meets targets

---

## 3. USER EXPERIENCE TESTS

### 3.1 Navigation Tests

#### TC-NAV-001: Screen Navigation
**Priority:** High  
**Description:** Test navigation between screens  

**Test Steps:**
1. Navigate to each screen using menu
2. Test keyboard shortcuts (Ctrl+1, Ctrl+2, Ctrl+3)
3. Test browser back/forward buttons
4. Test URL direct access

**Expected Results:**
- Smooth transitions between screens
- Keyboard shortcuts work
- Browser navigation works
- URLs update correctly
- Screen state preserved

---

#### TC-NAV-002: Mobile Navigation
**Priority:** Medium  
**Description:** Test navigation on mobile devices  

**Test Steps:**
1. Access on mobile browser
2. Test touch navigation
3. Test navigation shortcuts
4. Test screen responsiveness

**Expected Results:**
- Navigation buttons properly sized
- Touch targets adequate
- Floating navigation shortcuts appear
- Responsive design works

---

### 3.2 Notification System Tests

#### TC-NOT-001: Notification Display
**Priority:** Medium  
**Description:** Test notification system functionality  

**Test Cases:**
1. **Success Notifications**
   - Form submission success
   - Data save success
   - Theme change confirmation

2. **Error Notifications**
   - Form validation errors
   - API call failures
   - Network connectivity issues

3. **Info Notifications**
   - Navigation changes
   - Feature explanations
   - Status updates

**Expected Results:**
- Notifications appear promptly
- Proper icons and colors
- Auto-dismiss after timeout
- Manual dismiss works
- Accessible to screen readers

---

#### TC-NOT-002: Notification Persistence
**Priority:** Low  
**Description:** Test notification behavior across sessions  

**Test Steps:**
1. Generate notifications
2. Close browser
3. Reopen application
4. Check notification state

**Expected Results:**
- Notifications don't persist unnecessarily
- Important notifications saved
- No notification spam

---

### 3.3 Loading & Performance Tests

#### TC-PERF-001: Page Load Performance
**Priority:** High  
**Description:** Test application loading performance  

**Metrics to Test:**
- Initial page load: <3 seconds
- Script loading: <2 seconds
- CSS loading: <1 second
- Font loading: <2 seconds

**Test Method:**
1. Clear browser cache
2. Load application
3. Measure loading times
4. Verify progressive loading

---

#### TC-PERF-002: Memory Usage
**Priority:** Medium  
**Description:** Test application memory consumption  

**Test Steps:**
1. Monitor initial memory usage
2. Navigate through all screens
3. Fill forms with data
4. Run AI operations
5. Monitor memory over time

**Expected Results:**
- No memory leaks detected
- Reasonable memory consumption
- Garbage collection working
- Performance stable over time

---

## 4. SECURITY TESTS

### 4.1 Data Security Tests

#### TC-SEC-001: Input Validation
**Priority:** Critical  
**Description:** Test input validation and sanitization  

**Test Cases:**
1. **SQL Injection Attempts**
   - Input: `'; DROP TABLE weddings; --`
   - Expected: Input sanitized/rejected

2. **XSS Attempts**
   - Input: `<script>alert('XSS')</script>`
   - Expected: Script tags escaped

3. **Large Input Tests**
   - Input: Very long strings (>10000 chars)
   - Expected: Proper handling/truncation

---

#### TC-SEC-002: API Security
**Priority:** High  
**Description:** Test API security measures  

**Test Cases:**
1. **Authentication Required**
   - Access without token
   - Expected: 401 Unauthorized

2. **Rate Limiting**
   - Make excessive requests
   - Expected: 429 Too Many Requests

3. **CORS Headers**
   - Cross-origin requests
   - Expected: Proper CORS handling

---

### 4.2 Privacy Tests

#### TC-PRIV-001: Data Storage
**Priority:** High  
**Description:** Test data privacy and storage  

**Test Steps:**
1. Create wedding with personal data
2. Check local storage
3. Check database storage
4. Test data deletion

**Expected Results:**
- Sensitive data encrypted
- No unnecessary data stored
- Data deletion works completely
- Privacy preferences respected

---

## 5. COMPATIBILITY TESTS

### 5.1 Browser Compatibility

#### TC-COMP-001: Multi-Browser Testing
**Priority:** High  
**Description:** Test application across different browsers  

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**For Each Browser:**
1. Test basic functionality
2. Test AI features
3. Test responsive design
4. Test performance

---

### 5.2 Device Compatibility

#### TC-COMP-002: Device Testing
**Priority:** Medium  
**Description:** Test across different devices  

**Devices to Test:**
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

**For Each Device:**
1. Test layout responsiveness
2. Test touch interactions
3. Test performance
4. Test feature availability

---

## 6. ERROR HANDLING TESTS

### 6.1 Network Error Tests

#### TC-ERR-001: Network Connectivity
**Priority:** High  
**Description:** Test behavior with network issues  

**Test Scenarios:**
1. **Complete Network Loss**
   - Disconnect internet
   - Try to use features
   - Expected: Offline mode activated

2. **Slow Network**
   - Throttle connection
   - Test performance
   - Expected: Graceful degradation

3. **Intermittent Connection**
   - Simulate spotty connection
   - Test retry mechanisms
   - Expected: Automatic retries

---

### 6.2 Service Error Tests

#### TC-ERR-002: Service Failures
**Priority:** Medium  
**Description:** Test handling of service failures  

**Test Cases:**
1. **AI Service Down**
   - Stop AI service
   - Try AI features
   - Expected: Fallback options

2. **Database Unavailable**
   - Block database access
   - Try data operations
   - Expected: Local storage fallback

3. **Partial Service Degradation**
   - Disable some services
   - Test remaining functionality
   - Expected: Feature-specific errors

---

## 7. ACCESSIBILITY TESTS

### 7.1 Screen Reader Tests

#### TC-ACC-001: Screen Reader Compatibility
**Priority:** Medium  
**Description:** Test screen reader accessibility  

**Test Tools:** NVDA, JAWS, VoiceOver  

**Test Areas:**
1. Navigation announcements
2. Form label associations
3. Error message reading
4. Button descriptions
5. Progress indicators

---

### 7.2 Keyboard Navigation Tests

#### TC-ACC-002: Keyboard Accessibility
**Priority:** Medium  
**Description:** Test keyboard-only navigation  

**Test Steps:**
1. Disable mouse/touchpad
2. Navigate using only keyboard
3. Test all interactive elements
4. Verify focus indicators

**Expected Results:**
- All features accessible via keyboard
- Logical tab order
- Visible focus indicators
- Keyboard shortcuts work

---

## 8. PERFORMANCE BENCHMARKS

### 8.1 Load Testing

#### TC-LOAD-001: Concurrent Users
**Priority:** Medium  
**Description:** Test application with multiple concurrent users  

**Test Scenarios:**
- 10 concurrent users
- 50 concurrent users
- 100 concurrent users

**Metrics to Monitor:**
- Response times
- Success rates
- Resource utilization
- Error rates

---

### 8.2 Stress Testing

#### TC-STRESS-001: High Load Scenarios
**Priority:** Low  
**Description:** Test application under extreme load  

**Test Cases:**
1. **Memory Stress**
   - Create many weddings
   - Monitor memory usage
   - Test cleanup

2. **CPU Stress**
   - Run multiple AI operations
   - Monitor CPU usage
   - Test performance

---

## 9. AUTOMATED TEST SCRIPTS

### 9.1 Jest Unit Tests

```javascript
// Example: Wedding Form Validation Tests
describe('Wedding Form Validation', () => {
  test('should reject empty form submission', () => {
    const form = new WeddingForm();
    const result = form.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Couple names required');
  });

  test('should accept valid form data', () => {
    const validData = {
      coupleNames: 'John & Jane',
      weddingDate: '2024-12-01',
      city: 'Mumbai',
      budget: '5-10 lakhs',
      guestCount: 200
    };
    const form = new WeddingForm();
    const result = form.validate(validData);
    expect(result.isValid).toBe(true);
  });
});
```

### 9.2 Playwright E2E Tests

```javascript
// Example: End-to-End Wedding Planning Flow
test('complete wedding planning flow', async ({ page }) => {
  await page.goto('http://localhost:8000');
  
  // Navigate to wedding form
  await page.click('[data-screen="wedding-form"]');
  
  // Fill form
  await page.fill('[name="coupleNames"]', 'John & Jane');
  await page.fill('[name="weddingDate"]', '2024-12-01');
  await page.selectOption('[name="city"]', 'Mumbai');
  
  // Submit form
  await page.click('#submit-wedding');
  
  // Verify success
  await expect(page.locator('.notification.success')).toBeVisible();
  await expect(page.locator('#dashboard-screen')).toBeVisible();
});
```

### 9.3 API Test Scripts

```javascript
// Example: API Integration Tests
describe('Wedding API', () => {
  test('should create wedding successfully', async () => {
    const weddingData = {
      name: 'John & Jane Wedding',
      date: '2024-12-01',
      city: 'Mumbai',
      budget: 500000
    };
    
    const response = await fetch('/api/weddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weddingData)
    });
    
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.wedding.name).toBe(weddingData.name);
  });
});
```

---

## 10. TEST EXECUTION SCHEDULE

### 10.1 Regression Testing
**Frequency:** Before each release  
**Scope:** All critical and high priority tests  
**Duration:** 4-6 hours  

### 10.2 Smoke Testing
**Frequency:** Daily (CI/CD)  
**Scope:** Basic functionality tests  
**Duration:** 30 minutes  

### 10.3 Performance Testing
**Frequency:** Weekly  
**Scope:** Performance and load tests  
**Duration:** 2-3 hours  

### 10.4 Security Testing
**Frequency:** Monthly  
**Scope:** Security and privacy tests  
**Duration:** 4-6 hours  

---

## 11. DEFECT TRACKING

### 11.1 Severity Levels
- **Critical:** Application crashes, data loss, security vulnerabilities
- **High:** Major features broken, significant user impact
- **Medium:** Minor features broken, workarounds available
- **Low:** Cosmetic issues, minor inconveniences

### 11.2 Priority Levels
- **P1:** Fix immediately
- **P2:** Fix in current sprint
- **P3:** Fix in next release
- **P4:** Fix when convenient

---

## 12. ENVIRONMENT SETUP

### 12.1 Test Environment Requirements
- **OS:** macOS, Windows, Linux
- **Browsers:** Chrome, Firefox, Safari, Edge
- **Node.js:** v16+
- **Python:** v3.8+
- **Memory:** 8GB minimum
- **Storage:** 10GB free space

### 12.2 Test Data Setup
- Sample wedding data sets
- Mock vendor responses
- Test user accounts
- Pre-configured themes

---

## 13. REPORTING

### 13.1 Test Reports
- Daily test execution summary
- Weekly trend analysis
- Monthly quality metrics
- Release readiness report

### 13.2 Metrics Tracked
- Test pass/fail rates
- Defect discovery rate
- Performance benchmarks
- User satisfaction scores

---

**Test Suite Version:** 1.0  
**Last Review:** 2024  
**Next Review:** Quarterly  
**Maintained By:** BID AI QA Team 