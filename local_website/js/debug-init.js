// Debug initialization script for Vivaha AI
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Debug: DOM Content Loaded');
    
    // Force show overview screen
    const overviewScreen = document.getElementById('overview-screen');
    if (overviewScreen) {
        overviewScreen.classList.add('active');
        console.log('✅ Overview screen made active');
    } else {
        console.error('❌ Overview screen not found');
    }
    
    // Check all critical elements
    const criticalElements = [
        'overview-screen',
        'couple-details-screen', 
        'style-design-screen'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ Found: ${id}`);
        } else {
            console.error(`❌ Missing: ${id}`);
        }
    });
    
    // Force visibility for debug
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        if (screen.id === 'overview-screen') {
            screen.style.display = 'block';
            screen.style.visibility = 'visible';
            screen.style.opacity = '1';
            console.log('🔧 Force-enabled overview screen');
        }
    });
    
    // Check navigation manager
    setTimeout(() => {
        if (window.navigationManager) {
            console.log('✅ Navigation manager initialized');
        } else {
            console.error('❌ Navigation manager not found');
        }
        
        if (window.vivahaApp) {
            console.log('✅ Vivaha app initialized');
        } else {
            console.error('❌ Vivaha app not found');
        }
    }, 1000);
}); 