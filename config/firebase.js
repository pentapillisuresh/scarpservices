// const admin = require('firebase-admin');
// require('dotenv').config();

// const serviceAccount = {
//   type: "service_account",
//   project_id: process.env.FIREBASE_PROJECT_ID,
//   private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   client_email: process.env.FIREBASE_CLIENT_EMAIL
// };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const auth = admin.auth();

// module.exports = { admin, auth };




// This is now a simulated OTP system - No Firebase required

class SimulatedOTP {
  constructor() {
    console.log('✅ Simulated OTP system initialized');
    console.log('📱 OTPs will be logged to console for development');
  }

  // Simulate sending OTP
  async sendOTP(phone, otp) {
    console.log(`📱 [SIMULATED SMS] OTP for ${phone}: ${otp}`);
    console.log('⏱️  OTP valid for 10 minutes');
    return { success: true, message: 'OTP sent successfully' };
  }

  // Verify OTP (always returns true for testing)
  async verifyOTP(phone, otp) {
    console.log(`📱 [SIMULATED VERIFICATION] Phone: ${phone}, OTP: ${otp}`);
    return { success: true, message: 'OTP verified successfully' };
  }
}

// Export simulated OTP system
const simulatedOTP = new SimulatedOTP();

module.exports = {
  sendOTP: simulatedOTP.sendOTP.bind(simulatedOTP),
  verifyOTP: simulatedOTP.verifyOTP.bind(simulatedOTP),
  isFirebaseEnabled: false
};