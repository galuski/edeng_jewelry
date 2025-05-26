// server/services/ypay.route.js

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// CORS headers middleware - ספציפי לנתיב הזה בלבד
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://edengjewellry.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Preflight response
router.options('/create-payment', (req, res) => {
  res.sendStatus(200);
});

// Access Token from YPAY
router.post('/get-access-token', async (req, res) => {
  const { apiKey, secretKey } = req.body;

  try {
    const response = await axios.post('https://gateway.ypay.co.il/api/auth/access-token', {
      apiKey,
      secretKey,
    });

    res.json({ token: response.data.token });
  } catch (error) {
    console.error('❌ Error getting token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get access token' });
  }
});

// Create payment link
router.post('/create-payment', async (req, res) => {
  const {
    token,
    amount,
    description,
    cancelUrl,
    successUrl,
    buyerName,
    buyerEmail,
    buyerPhone,
  } = req.body;

  try {
    const response = await axios.post(
      'https://gateway.ypay.co.il/api/payments/create-link',
      {
        amount,
        description,
        cancelUrl,
        successUrl,
        buyerName,
        buyerEmail,
        buyerPhone,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ url: response.data?.url });
  } catch (error) {
    console.error('❌ Error creating payment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.options('*', (req, res) => {
  res.sendStatus(200);
});


export default router;