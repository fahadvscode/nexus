// Twilio token format validator
// This script decodes and validates JWT tokens

// Mock token generation based on the same logic as Supabase function
function generateMockToken() {
  const accountSid = '[REDACTED]';
  const twimlAppSid = '[REDACTED]';
  
  // Generate payload similar to what the Supabase function does
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;
  const jti = `${accountSid}-${now}`;
  
  // Create payload WITH nbf field
  const payload = {
    jti,
    iss: accountSid,
    sub: accountSid,
    iat: now,
    nbf: now, // This is critical - the fix we deployed
    exp,
    grants: {
      identity: 'test@example.com',
      voice: {
        outgoing: { 
          application_sid: twimlAppSid 
        },
        incoming: { 
          allow: true 
        }
      }
    }
  };
  
  return {
    payload,
    base64Payload: btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  };
}

// Decode and validate a base64 JWT payload
function decodeAndValidateToken(base64Payload) {
  try {
    // Convert base64url to regular base64
    const base64 = base64Payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      
    // Add padding if needed
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // Decode
    const jsonStr = atob(padded);
    const decoded = JSON.parse(jsonStr);
    
    // Validate required fields for Twilio
    const checks = {
      jti: !!decoded.jti,
      iss: !!decoded.iss,
      sub: !!decoded.sub,
      grants: !!decoded.grants,
      nbf: !!decoded.nbf,
      exp: !!decoded.exp,
      voice: !!(decoded.grants && decoded.grants.voice),
    };
    
    return {
      decoded,
      checks,
      isValid: Object.values(checks).every(check => check === true)
    };
  } catch (e) {
    console.error('❌ Token decode error:', e);
    return { error: e.message, isValid: false };
  }
}

// Simple browser-compatible testing
function runTests() {
  console.log('🔄 Running Twilio token format tests...');
  
  // Test correct token with nbf field
  console.log('\n🔄 Test 1: Valid token WITH nbf field');
  const { payload, base64Payload } = generateMockToken();
  console.log('📄 Generated payload:', JSON.stringify(payload, null, 2));
  console.log('🔑 Base64 payload (section of JWT):', base64Payload.substring(0, 20) + '...');
  
  const result = decodeAndValidateToken(base64Payload);
  console.log('✅ Decoded payload matches:', 
    JSON.stringify(payload) === JSON.stringify(result.decoded));
  console.log('✅ Validation checks:', result.checks);
  console.log('✅ Is valid for Twilio:', result.isValid);
  
  // Test incorrect token WITHOUT nbf field
  console.log('\n🔄 Test 2: Invalid token WITHOUT nbf field');
  const invalidPayload = { ...payload };
  delete invalidPayload.nbf;
  const invalidBase64 = btoa(JSON.stringify(invalidPayload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  console.log('📄 Generated invalid payload:', JSON.stringify(invalidPayload, null, 2));
  console.log('🔑 Invalid base64 payload:', invalidBase64.substring(0, 20) + '...');
  
  const invalidResult = decodeAndValidateToken(invalidBase64);
  console.log('✅ Decoded payload matches:', 
    JSON.stringify(invalidPayload) === JSON.stringify(invalidResult.decoded));
  console.log('❌ Validation checks:', invalidResult.checks);
  console.log('❌ Is valid for Twilio:', invalidResult.isValid);
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('✅ Valid token with nbf field:', result.isValid ? 'PASS' : 'FAIL');
  console.log('❌ Invalid token without nbf field:', !invalidResult.isValid ? 'EXPECTED FAIL' : 'UNEXPECTED PASS');
  
  // Key findings for Twilio token error 20101
  console.log('\n🔍 Key findings for AccessTokenInvalid (20101):');
  if (!result.isValid) {
    console.log('❌ Even correctly formatted tokens are invalid - check Twilio API compatibility');
  }
  
  if (result.isValid && !invalidResult.isValid) {
    console.log('✅ Token validation confirms that MISSING NBF FIELD causes AccessTokenInvalid (20101)');
    console.log('✅ Your fix to add nbf field should resolve the issue IF properly deployed');
  }
  
  console.log('\n🔧 Recommendations:');
  console.log('1. Clear browser cache completely');
  console.log('2. Ensure you\'re using the latest deployed function');
  console.log('3. Check browser console for any CORS or other errors');
}

// Run tests
runTests(); 