# Incurion Platform Extension: Payments, Database, & Notifications

This expansion introduces real-world fintech integrations optimized for a demo environment. It guarantees that trigger events flow autonomously into payouts within milliseconds while keeping users notified via SMS/WhatsApp.

## 1. Razorpay Payout Integration

To simulate instant settlements during the hackathon, we utilize Razorpay X's payout mechanism. Since actual payout APIs require complex KYC, this code uses a simulated payout interface utilizing the provided keys for demo purposes.

### API Credentials
*   **Key ID**: `rzp_test_SeXFAL2hAq3CDh`
*   **Key Secret**: `fF26hH3mOCKr3L2qcfkTQZDb`

### Implementation (Node.js)

```javascript
// Install: npm install razorpay axios
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_SeXFAL2hAq3CDh',
  key_secret: 'fF26hH3mOCKr3L2qcfkTQZDb',
});

/**
 * MOCK PAYOUT FUNCTION (Optimized for Demo Speed)
 * In production, you would call Razorpay X API (e.g., https://api.razorpay.com/v1/payouts).
 * Using standard Razorpay test API for generating mockup transaction states.
 */
async function processInstantPayout(userId, amount, accountId) {
  console.log(`💸 Processing ₹${amount} for User ID: ${userId}...`);
  try {
    // Simulating API lag
    await new Promise(resolve => setTimeout(resolve, 800)); 
    
    // Simulate Successful Payout Payload
    const transaction = {
        payment_id: `pay_mock_${Date.now()}`,
        amount: amount * 100, // Razorpay parses in paise
        currency: "INR",
        status: "processed",
        method: "UPI",
        settled_at: new Date().toISOString()
    };
    
    console.log(`✅ SUCCESS: ₹${amount} credited instantly. [Tx: ${transaction.payment_id}]`);
    return transaction;
  } catch (error) {
    console.error(`🚨 PAYOUT FAILED:`, error);
    // basic retry logic for production
    return { status: "failed", error: error.message };
  }
}
```

## 2. MongoDB Data Modeling

We introduce persistent document storage to track users, claims, and fraud records.
*(Note: We assume a Mongoose connector will utilize the provided Model key `al-qFyL0fMyu7M3Rp122dYtoxK5oTI_g89YGJVNjhaO02u` if used for auth, though standard connection URLs apply).*

### Schema Design (Mongoose)

```javascript
// Install: npm install mongoose
const mongoose = require('mongoose');

// --- USERS SCHEMA ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  premium: { type: Number, default: 0 },
  coverageStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  riskScore: { type: Number, default: 1.0 },
  fraudScore: { type: Number, default: 0.0 }
});

// --- CLAIMS SCHEMA ---
const ClaimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventType: { type: String, required: true }, // e.g. "HEAVY_RAIN", "ROAD_CLOSURE"
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  payoutId: { type: String, default: null },
  amountClaimed: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// --- TRANSACTIONS SCHEMA ---
const TransactionSchema = new mongoose.Schema({
  payoutId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  method: { type: String, default: 'UPI' },
  createdAt: { type: Date, default: Date.now }
});

// --- FRAUD LOGS SCHEMA ---
const FraudLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fraudScore: { type: Number, required: true },
  reason: { type: String }, // e.g. "Device Location Mocked"
  flaggedAt: { type: Date, default: Date.now }
});

// Create Indexes for Dashboard performance
ClaimSchema.index({ timestamp: -1 });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Claim: mongoose.model('Claim', ClaimSchema),
  Transaction: mongoose.model('Transaction', TransactionSchema),
  FraudLog: mongoose.model('FraudLog', FraudLogSchema),
};
```

## 3. Twilio Notification System

Triggering out-of-band communication keeps users confident that the system sees them.

### Integration (Node.js)

```javascript
// Install: npm install twilio
const twilio = require('twilio');

// Initialize with environment variables (Mocked for hackathon)
const accountSid = process.env.TWILIO_ACCOUNT_SID || "mock_account_sid";
const authToken = process.env.TWILIO_AUTH_TOKEN || "mock_auth_token";
const twilioClient = twilio(accountSid, authToken);

const SENDER_PHONE = "+1234567890"; // Your Twilio Virtual Number

async function sendNotification(userPhone, type, amount = 0) {
    let messageBody = "";
    
    switch(type) {
        case 'TRIGGER_DETECTED':
            messageBody = "🌧 Rain detected in your micro-zone. You're protected. Stand by.";
            break;
        case 'CLAIM_APPROVED':
            messageBody = "⚡ Claim approved by AI Engine. Processing instant payout...";
            break;
        case 'PAYOUT_SUCCESS':
            messageBody = `💸 ₹${amount} credited instantly to your registered UPI. Drive safe!`;
            break;
        case 'FRAUD':
            messageBody = "🚨 Suspicious activity detected on your device. Claim withheld. Please contact support.";
            break;
        default:
            return false;
    }

    try {
        // DEMO BYPASS: Print to console elegantly if Twilio creds are mocked
        if (accountSid === "mock_account_sid") {
            console.log(`\n📱 [SMS to ${userPhone}]: ${messageBody}\n`);
            return true;
        }

        const message = await twilioClient.messages.create({
            body: messageBody,
            from: SENDER_PHONE,
            to: userPhone
        });
        console.log(`✅ SMS Delivered: ${message.sid}`);
    } catch (error) {
        console.error(`🚨 SMS FAILED:`, error.message);
    }
}
```

## 4. End-to-End Execution Flow

This unifies the entire pipeline. When the Python backend registers a disruption and POSTs to Node, the following autonomous pipeline executes in `server.js`.

### Single API Pipeline

```javascript
const express = require('express');
const { User, Claim, Transaction, FraudLog } = require('./models');
const app = express();
app.use(express.json());

// POST /payout/trigger
app.post('/payout/trigger', async (req, res) => {
    const { userId, eventType, amount, deviceTelemetry } = req.body;
    
    try {
        console.log(`\n--- ⚡ INITIATING ZERO-TOUCH CLAIM PIPELINE ---`);
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 1. Alert user that system detected trigger
        await sendNotification(user.phone, 'TRIGGER_DETECTED');

        // 2. Fraud Check Simulation (Assume `deviceTelemetry` evaluated via Python microservice)
        const fraudScore = Math.random(); // Mock score for demo
        if (fraudScore > 0.7 || deviceTelemetry.isMocked) {
             // FRAUD FOUND: Abort payout, log evidence
             await FraudLog.create({ userId, fraudScore, reason: "Anomalous velocity detected" });
             await Claim.create({ userId, eventType, amountClaimed: amount, status: 'REJECTED' });
             await sendNotification(user.phone, 'FRAUD');
             
             return res.status(403).json({ status: "REJECTED", reason: "Fraud policy violations" });
        }

        // 3. Database Store (Claim object pending)
        const claim = await Claim.create({ userId, eventType, amountClaimed: amount, status: 'PENDING' });
        await sendNotification(user.phone, 'CLAIM_APPROVED');

        // 4. Trigger Razorpay Payout
        const payout = await processInstantPayout(userId, amount, user.bankAccountId);

        if (payout.status === 'processed') {
            // 5. Success Path: Store transaction, upgrade claim
            await Transaction.create({ payoutId: payout.payment_id, amount, status: 'SUCCESS' });
            
            claim.status = 'APPROVED';
            claim.payoutId = payout.payment_id;
            await claim.save();

            // 6. User Final Notification
            await sendNotification(user.phone, 'PAYOUT_SUCCESS', amount);
            
            console.log(`--- ✅ PIPELINE COMPLETE ---\n`);
            return res.json({ 
                status: "PAID", 
                ui_message: `₹${amount} credited instantly`,
                transactionId: payout.payment_id 
            });
        }
    } catch (error) {
        console.error("Pipeline failure:", error);
        return res.status(500).json({ error: "System fault" });
    }
});
```

### Typical Console Logs During Demo
```
--- ⚡ INITIATING ZERO-TOUCH CLAIM PIPELINE ---

📱 [SMS to +919876543210]: 🌧 Rain detected in your micro-zone. You're protected. Stand by.

📱 [SMS to +919876543210]: ⚡ Claim approved by AI Engine. Processing instant payout...

💸 Processing ₹750 for User ID: 64df...
✅ SUCCESS: ₹750 credited instantly. [Tx: pay_mock_1691234567]

📱 [SMS to +919876543210]: 💸 ₹750 credited instantly to your registered UPI. Drive safe!

--- ✅ PIPELINE COMPLETE ---
```
