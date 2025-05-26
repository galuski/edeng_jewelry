import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// ✅ CORS middleware לכל הבקשות
router.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://edengjewellry.com',
    'https://www.edengjewellry.com',
  ];
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // ✅ אם זו בקשת preflight - עונים מיד עם headers
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// 🟢 קבלת access token מ־YPAY
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

// 🟢 יצירת קישור לתשלום
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

export default router;