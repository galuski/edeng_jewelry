// ✅ ypay.route.js – גרסה מתוקנת לפי YPAY הרשמי
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const YPAY_API_URL = 'https://ypay.co.il/api/v1';

// 🟢 יצירת קישור לתשלום
router.post('/create-payment', async (req, res) => {
  try {
    // שלב 1: קבלת Access Token
    const tokenRes = await axios.post(`${YPAY_API_URL}/accessToken`, {
      client_id: process.env.YPAY_CLIENT_ID,
      client_secret: process.env.YPAY_CLIENT_SECRET,
    });

    const access_token = tokenRes.data.access_token;

    if (!access_token) throw new Error("No access token received");

    // שלב 2: שליחת בקשה לתשלום
    const paymentRes = await axios.post(
      `${YPAY_API_URL}/payment`,
      {
        ...req.body, // הנתונים שהגיעו מהפרונטנד
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { url, responseCode } = paymentRes.data;

    if (responseCode !== 1 || !url) {
      console.error("❌ YPAY Error Response:", paymentRes.data);
      return res.status(500).json({ error: 'Failed to generate payment URL' });
    }

    res.json({ url });
  } catch (err) {
    console.error("❌ YPAY create-payment error:", err.response?.data || err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
