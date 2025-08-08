
console.log('🧪 Testing Vendor Filtering Functionality...\n');

// Test the vendor discovery service
import('./react-frontend/src/services/vendor_discovery_service.ts').then(async (module) => {
  const { VendorDiscoveryService } = module;
  
  console.log('1. Testing Basic Vendor Search...');
  try {
    const basicSearch = await VendorDiscoveryService.searchVendors({
      category: '',
      location: 'mumbai',
      priceRange: '',
      rating: '',
      searchTerm: ''
    });
    
    if (basicSearch.success) {
      console.log(`   ✅ Basic search returned ${basicSearch.vendors.length} vendors`);
    } else {
      console.log(`   ❌ Basic search failed: ${basicSearch.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Basic search error: ${error.message}`);
  }
  
  console.log('\n2. Testing Category Filtering...');
  try {
    const categorySearch = await VendorDiscoveryService.searchVendors({
      category: 'venues',
      location: 'mumbai',
      priceRange: '',
      rating: '',
      searchTerm: ''
    });
    
    if (categorySearch.success) {
      console.log(`   ✅ Venues search returned ${categorySearch.vendors.length} vendors`);
      categorySearch.vendors.forEach(vendor => {
        console.log(`      - ${vendor.name} (${vendor.category})`);
      });
    } else {
      console.log(`   ❌ Category search failed: ${categorySearch.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Category search error: ${error.message}`);
  }
  
  console.log('\n3. Testing Wedding Planners Category...');
  try {
    const plannersSearch = await VendorDiscoveryService.searchVendors({
      category: 'planners',
      location: 'mumbai',
      priceRange: '',
      rating: '',
      searchTerm: ''
    });
    
    if (plannersSearch.success) {
      console.log(`   ✅ Planners search returned ${plannersSearch.vendors.length} vendors`);
      plannersSearch.vendors.forEach(vendor => {
        console.log(`      - ${vendor.name} (${vendor.category})`);
      });
    } else {
      console.log(`   ❌ Planners search failed: ${plannersSearch.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Planners search error: ${error.message}`);
  }
  
  console.log('\n4. Testing Price Range Filtering...');
  try {
    const budgetSearch = await VendorDiscoveryService.searchVendors({
      category: '',
      location: 'mumbai',
      priceRange: 'budget',
      rating: '',
      searchTerm: ''
    });
    
    if (budgetSearch.success) {
      console.log(`   ✅ Budget search returned ${budgetSearch.vendors.length} vendors`);
      budgetSearch.vendors.forEach(vendor => {
        console.log(`      - ${vendor.name} (${vendor.price_range})`);
      });
    } else {
      console.log(`   ❌ Budget search failed: ${budgetSearch.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Budget search error: ${error.message}`);
  }
  
  console.log('\n5. Testing Rating Filtering...');
  try {
    const ratingSearch = await VendorDiscoveryService.searchVendors({
      category: '',
      location: 'mumbai',
      priceRange: '',
      rating: '4.5',
      searchTerm: ''
    });
    
    if (ratingSearch.success) {
      console.log(`   ✅ 4.5+ rating search returned ${ratingSearch.vendors.length} vendors`);
      ratingSearch.vendors.forEach(vendor => {
        console.log(`      - ${vendor.name} (${vendor.rating} stars)`);
      });
    } else {
      console.log(`   ❌ Rating search failed: ${ratingSearch.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Rating search error: ${error.message}`);
  }
  
  console.log('\n6. Testing Search Term Filtering...');
  try {
    const searchTermTest = await VendorDiscoveryService.searchVendors({
      category: '',
      location: 'mumbai',
      priceRange: '',
      rating: '',
      searchTerm: 'palace'
    });
    
    if (searchTermTest.success) {
      console.log(`   ✅ "palace" search returned ${searchTermTest.vendors.length} vendors`);
      searchTermTest.vendors.forEach(vendor => {
        console.log(`      - ${vendor.name}`);
      });
    } else {
      console.log(`   ❌ Search term test failed: ${searchTermTest.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Search term test error: ${error.message}`);
  }
  
  console.log('\n✅ Vendor filtering tests completed!');
  
}).catch(error => {
  console.error('❌ Failed to load vendor discovery service:', error);
});
