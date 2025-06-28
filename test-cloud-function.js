// Test the deployed Supabase function and parse the JWT token
// This must be run in a browser or with a valid Supabase session token

// Check if running in Node.js environment
const isNode = typeof window === 'undefined';

if (isNode) {
  console.log('⚠️ This script should be run in a browser with a valid Supabase session');
  console.log('⚠️ We will proceed but the test will likely fail due to auth requirements');
}

// Function to test the token endpoint
async function testSupabaseFunction() {
  try {
    // Replace with your actual session token - in a real app this would come from localStorage or similar
    const sessionToken = "REPLACE_WITH_ACTUAL_TOKEN";
    
    // Add cache-busting parameter
    const timestamp = Date.now();
    
    console.log('🔄 Testing Supabase function deployment...');
    console.log('🌐 URL:', `https://ipizfawpzzwdltcbskim.supabase.co/functions/v1/get-twilio-token?t=${timestamp}`);
    console.log('🔐 Using session token:', sessionToken.substring(0, 20) + '...');
    
    const response = await fetch(`https://ipizfawpzzwdltcbskim.supabase.co/functions/v1/get-twilio-token?t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'x-application-name': 'nexus-crm-test'
      }
    });
    
    console.log('🔄 Response status:', response.status);
    console.log('🔄 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // For any response, try to parse the body
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Error response from function:', responseText);
      return;
    }
    
    // Try to parse the JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Response parsed successfully');
    } catch (e) {
      console.error('❌ Failed to parse response JSON:', e);
      console.log('📄 Raw response:', responseText);
      return;
    }
    
    if (!data || !data.token) {
      console.error('❌ No token in response:', data);
      return;
    }
    
    console.log('✅ Token received from function');
    console.log('🔑 Token preview:', data.token.substring(0, 50) + '...');
    
    // Parse the JWT token
    const [headerB64, payloadB64, signature] = data.token.split('.');
    
    console.log('🔍 Analyzing token structure:');
    console.log('- Header (base64):', headerB64);
    console.log('- Payload (base64):', payloadB64.substring(0, 20) + '...');
    console.log('- Signature (base64):', signature.substring(0, 20) + '...');
    
    // Decode header and payload
    try {
      // Convert base64url to regular base64
      const decodeBase64 = (str) => {
        // Convert base64url to regular base64
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        while (base64.length % 4) {
          base64 += '=';
        }
        
        // Decode
        return JSON.parse(atob(base64));
      };
      
      const header = decodeBase64(headerB64);
      const payload = decodeBase64(payloadB64);
      
      console.log('✅ JWT header decoded:', header);
      console.log('✅ JWT payload decoded:', payload);
      
      // Check for nbf field
      if (payload.nbf) {
        console.log('✅ NBF FIELD IS PRESENT in the token from Supabase Function!');
        console.log('✅ NBF value:', payload.nbf);
        console.log('✅ NBF date:', new Date(payload.nbf * 1000).toISOString());
      } else {
        console.error('❌ NBF FIELD IS MISSING in the token from Supabase Function!');
        console.error('❌ This is the root cause of AccessTokenInvalid (20101)');
      }
      
    } catch (e) {
      console.error('❌ Failed to decode token:', e);
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testSupabaseFunction(); 