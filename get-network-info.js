#!/usr/bin/env node
const os = require('os');

console.log('🌐 Network Access Information for Tink Banking App\n');

// Get network interfaces
const interfaces = os.networkInterfaces();
const networkIPs = [];

for (const name of Object.keys(interfaces)) {
  for (const net of interfaces[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      networkIPs.push({
        interface: name,
        address: net.address
      });
    }
  }
}

console.log('📱 Mobile Access URLs:');
console.log('='.repeat(50));

if (networkIPs.length > 0) {
  networkIPs.forEach(({ interface, address }) => {
    console.log(`\n🔗 Interface: ${interface}`);
    console.log(`   Frontend: http://${address}:3000`);
    console.log(`   Backend:  http://${address}:5000/api`);
    console.log(`   Health:   http://${address}:5000/api/health`);
  });
} else {
  console.log('\n⚠️  No external network interfaces found.');
  console.log('   You may be in a restricted environment.');
}

console.log('\n🏠 Local Access URLs:');
console.log('='.repeat(30));
console.log('   Frontend: http://localhost:3000');
console.log('   Backend:  http://localhost:5000/api');
console.log('   Health:   http://localhost:5000/api/health');

console.log('\n📋 Instructions for Mobile Testing:');
console.log('='.repeat(40));
console.log('1. Make sure your phone is on the same WiFi network');
console.log('2. Use one of the IP addresses shown above');
console.log('3. Open the Frontend URL in your phone\'s browser');
console.log('4. The app will automatically connect to the backend API');

console.log('\n🔧 Troubleshooting:');
console.log('='.repeat(20));
console.log('• If no external IPs are shown, you may need to configure network access');
console.log('• Ensure ports 3000 and 5000 are not blocked by firewall');
console.log('• Try different network interfaces if multiple are available');

console.log('\n✅ Servers Status:');
console.log('='.repeat(20));

// Test server connectivity
const testConnectivity = async () => {
  try {
    const { default: fetch } = await import('node-fetch');
    
    // Test backend
    try {
      const response = await fetch('http://localhost:5000/api/health', { timeout: 5000 });
      if (response.ok) {
        console.log('✅ Backend: Running on port 5000');
      } else {
        console.log('❌ Backend: Not responding properly');
      }
    } catch (error) {
      console.log('❌ Backend: Not running or not accessible');
    }
    
    // Test frontend
    try {
      const response = await fetch('http://localhost:3000', { timeout: 5000 });
      if (response.ok) {
        console.log('✅ Frontend: Running on port 3000');
      } else {
        console.log('❌ Frontend: Not responding properly');
      }
    } catch (error) {
      console.log('❌ Frontend: Not running or not accessible');
    }
    
  } catch (error) {
    console.log('⚠️  Could not test connectivity:', error.message);
  }
};

testConnectivity();