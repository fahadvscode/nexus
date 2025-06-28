// Direct test to generate a Twilio-compatible JWT token using API Key authentication
// Based on Twilio's specific JWT requirements for Voice SDK v2.13.0

// Run this with: node fix-twilio-auth.js

import crypto from 'crypto';

async function generateTwilioCompatibleJWT() {
  console.log('🔧 Generating Twilio-compatible JWT token using API Key authentication...');
  
  // Twilio credentials - using API Key approach
  const accountSid = '***REMOVED***';
  const apiKeySid = '***REMOVED***';
  const apiKeySecret = '***REMOVED***';
  const twimlAppSid = '***REMOVED***';
  
  // Generate a token with the correct structure for API Key auth
  const identity = 'test@example.com';
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiration
  const jti = `${apiKeySid}-${now}`;
  
  // Header exactly as per Twilio Voice SDK requirements
  const header = { 
    typ: 'JWT', 
    alg: 'HS256', 
    cty: 'twilio-fpa;v=1' 
  };
  
  // Payload with all required fields - IMPORTANT: For API Key auth, issuer is API Key SID
  const payload = {
    jti,
    iss: apiKeySid,      // Use API Key SID as issuer (not Account SID)
    sub: accountSid,     // Account SID remains as subject
    iat: now,
    nbf: now,
    exp,
    grants: {
      identity,
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
  
  console.log('🔍 JWT Header:', JSON.stringify(header, null, 2));
  console.log('🔍 JWT Payload:', JSON.stringify(payload, null, 2));
  console.log('🔑 Using API Key authentication (more secure than Auth Token)');
  
  // Convert objects to strings and encode as base64url
  const encodeBase64Url = (data) => {
    return Buffer.from(JSON.stringify(data))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  const headerBase64 = encodeBase64Url(header);
  const payloadBase64 = encodeBase64Url(payload);
  
  // Create unsigned token
  const unsignedToken = `${headerBase64}.${payloadBase64}`;
  
  // Sign the token with API Key Secret instead of Auth Token
  const signature = crypto
    .createHmac('sha256', apiKeySecret)
    .update(unsignedToken)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  // Assemble the final token
  const token = `${unsignedToken}.${signature}`;
  
  console.log('✅ Generated token:', token);
  console.log('✅ Token length:', token.length);
  
  // Decode to verify
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token structure - should have 3 parts');
      return;
    }
    
    const decodedHeader = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('\n✅ Token verification:');
    console.log('✅ Header decoded successfully:', decodedHeader);
    console.log('✅ Payload decoded successfully with nbf:', decodedPayload.nbf);
    console.log('✅ Issuer is API Key SID:', decodedPayload.iss === apiKeySid);
    console.log('✅ Subject is Account SID:', decodedPayload.sub === accountSid);
    
    // Verify signature
    const verifySignature = crypto
      .createHmac('sha256', apiKeySecret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log('✅ Signature verification:', verifySignature === parts[2] ? 'PASSED' : 'FAILED');
  } catch (err) {
    console.error('❌ Token verification failed:', err);
  }
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Update the Supabase function to use this exact API Key authentication approach');
  console.log('2. Set TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET as environment variables');
  console.log('3. Modify the token generation to use apiKeySid as issuer');
}

generateTwilioCompatibleJWT(); 