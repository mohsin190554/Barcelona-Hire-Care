// ════════════════════════════════════════════════════════
//  Vercel Serverless Function — Stripe Payment Intent
//  File: /api/create-payment-intent.js
//
//  HOW TO DEPLOY:
//  1. Put this file in your project root at: /api/create-payment-intent.js
//  2. In Vercel dashboard → Settings → Environment Variables, add:
//     STRIPE_SECRET_KEY = mk_1TPpWMEdWmvL3vWsdqLVRU2r
//  3. Deploy — Vercel auto-detects the /api folder
//
//  ⚠️  NEVER put the secret key in your HTML or frontend JS!
// ════════════════════════════════════════════════════════

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // Allow CORS from your own domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, description } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:      Math.round(amount),   // in cents — e.g. 20000 = €200.00
      currency:    currency || 'eur',
      description: description || 'Royal Taxi Services — Booking',
      automatic_payment_methods: { enabled: true }
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Payment intent creation failed' });
  }
};
