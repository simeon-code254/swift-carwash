const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const adminRoutes = require('./admin');
const adminAuth = adminRoutes.adminAuth;

// SMS Configuration - In production, use Twilio, AWS SNS, or similar service
const SMS_CONFIG = {
  enabled: true,
  provider: 'twilio', // 'twilio', 'aws-sns', 'simulated'
  apiKey: process.env.SMS_API_KEY || 'your-sms-api-key',
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
  fromNumber: process.env.SMS_FROM_NUMBER || '+1234567890'
};

// Simulated SMS sending function
const sendSMS = async (to, message) => {
  try {
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures (10% failure rate for realism)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      console.log('📱 SMS SENT (SIMULATED):');
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      console.log('Status: Delivered (Simulated)');
      console.log('⚠️  NOTE: This is a simulation. Real SMS not sent.');
      
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'delivered',
        simulated: true
      };
    } else {
      console.log('❌ SMS FAILED (SIMULATED):');
      console.log(`To: ${to}`);
      console.log(`Error: Network timeout (simulated)`);
      
      return {
        success: false,
        error: 'Network timeout (simulated)',
        simulated: true
      };
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message,
      simulated: true
    };
  }
};

// Twilio SMS sending function (for production)
const sendSMSViaTwilio = async (to, message) => {
  try {
    console.log('📱 Sending REAL SMS via Twilio...');
    console.log(`To: ${to}`);
    console.log(`From: ${SMS_CONFIG.fromNumber}`);
    console.log(`Message: ${message}`);
    
    const twilio = require('twilio');
    const client = twilio(SMS_CONFIG.accountSid, SMS_CONFIG.authToken);
    
    const result = await client.messages.create({
      body: message,
      from: SMS_CONFIG.fromNumber,
      to: to
    });
    
    console.log('✅ Twilio SMS sent successfully!');
    console.log(`Message ID: ${result.sid}`);
    console.log(`Status: ${result.status}`);
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      real: true
    };
  } catch (error) {
    console.error('❌ Twilio SMS error:', error.message);
    console.error('Error details:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send SMS';
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 21214) {
      errorMessage = 'Phone number is not mobile';
    } else if (error.code === 21608) {
      errorMessage = 'Insufficient account balance';
    } else if (error.code === 21610) {
      errorMessage = 'Message body is too long';
    } else if (error.message.includes('Authentication')) {
      errorMessage = 'Invalid Twilio credentials';
    }
    
    return {
      success: false,
      error: errorMessage,
      twilioError: error.message,
      real: true
    };
  }
};

// SMS sending endpoint
router.post('/send', adminAuth, async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }
    
    // Validate message length
    if (message.length > 160) {
      return res.status(400).json({
        success: false,
        error: 'Message too long (max 160 characters)'
      });
    }
    
    let result;
    
    // Check if Twilio is properly configured
    const isTwilioConfigured = SMS_CONFIG.provider === 'twilio' && 
                               SMS_CONFIG.enabled && 
                               SMS_CONFIG.accountSid && 
                               SMS_CONFIG.accountSid !== 'your-twilio-account-sid' &&
                               SMS_CONFIG.authToken && 
                               SMS_CONFIG.authToken !== 'your-twilio-auth-token' &&
                               SMS_CONFIG.fromNumber && 
                               SMS_CONFIG.fromNumber !== '+1234567890';
    
    // Choose SMS provider based on configuration
    if (isTwilioConfigured) {
      console.log('📱 Using REAL Twilio SMS service');
      result = await sendSMSViaTwilio(to, message);
    } else {
      console.log('⚠️  Using SIMULATED SMS (Twilio not properly configured)');
      console.log('   To enable real SMS, set up your Twilio credentials in .env file');
      result = await sendSMS(to, message);
    }
    
    if (result.success) {
      // Log SMS activity
      if (result.real) {
        console.log(`✅ REAL SMS sent successfully to ${to}`);
      } else {
        console.log(`✅ SIMULATED SMS sent successfully to ${to}`);
      }
      
      const responseData = {
        success: true,
        messageId: result.messageId,
        status: result.status,
        message: result.real ? 'Real SMS sent successfully!' : 'SMS sent successfully (simulated)'
      };
      
      // Add simulation warning if applicable
      if (result.simulated) {
        responseData.warning = 'This is a simulated SMS. No actual message was sent.';
        responseData.simulated = true;
      } else if (result.real) {
        responseData.real = true;
        responseData.message = 'Real SMS sent successfully!';
      }
      
      return res.json(responseData);
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send SMS',
        simulated: result.simulated || false,
        real: result.real || false,
        twilioError: result.twilioError || null
      });
    }
    
  } catch (error) {
    console.error('SMS endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// SMS configuration endpoint
router.get('/config', adminAuth, (req, res) => {
  res.json({
    enabled: SMS_CONFIG.enabled,
    provider: SMS_CONFIG.provider,
    fromNumber: SMS_CONFIG.fromNumber
  });
});

// Update SMS configuration endpoint
router.put('/config', adminAuth, [
  body('enabled').optional().isBoolean(),
  body('provider').optional().isIn(['simulated', 'twilio', 'aws']),
  body('apiKey').optional().isString(),
  body('fromNumber').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { enabled, provider, apiKey, fromNumber } = req.body;

    // Update SMS configuration
    if (enabled !== undefined) SMS_CONFIG.enabled = enabled;
    if (provider) SMS_CONFIG.provider = provider;
    if (apiKey) SMS_CONFIG.apiKey = apiKey;
    if (fromNumber) SMS_CONFIG.fromNumber = fromNumber;

    // In production, you would save this to a database or environment variables
    console.log('SMS Configuration updated:', {
      enabled: SMS_CONFIG.enabled,
      provider: SMS_CONFIG.provider,
      fromNumber: SMS_CONFIG.fromNumber
    });

    res.json({
      success: true,
      message: 'SMS configuration updated successfully',
      config: {
        enabled: SMS_CONFIG.enabled,
        provider: SMS_CONFIG.provider,
        fromNumber: SMS_CONFIG.fromNumber
      }
    });

  } catch (error) {
    console.error('SMS config update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// SMS status endpoint
router.get('/status', adminAuth, (req, res) => {
  res.json({
    service: 'SMS Service',
    status: 'operational',
    provider: SMS_CONFIG.provider,
    enabled: SMS_CONFIG.enabled
  });
});

module.exports = router;
module.exports.sendSMS = sendSMS; 