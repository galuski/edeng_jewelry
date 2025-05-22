// server/services/ypay.route.js

import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// ✅ תמיכה ב־OPTIONS עבור Preflight (CORS)
router.options('/create-payment', (req, res) => {
  res.sendStatus(200)
})

// 🌐 קבלת Access Token מה־YPAY API
router.post('/get-access-token', async (req, res) => {
  const { apiKey, secretKey } = req.body

  try {
    const response = await axios.post('https://gateway.ypay.co.il/api/auth/access-token', {
      apiKey,
      secretKey
    })

    const token = response.data.token
    res.json({ token })
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to get access token' })
  }
})

// 💳 יצירת קישור לתשלום
router.post('/create-payment', async (req, res) => {
    console.log('✅ Received POST /create-payment');
  const {
    token,
    amount,
    description,
    cancelUrl,
    successUrl,
    buyerName,
    buyerEmail,
    buyerPhone
  } = req.body

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
        buyerPhone
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const paymentLink = response.data?.url
    res.json({ url: paymentLink })
  } catch (error) {
    console.error('Error creating payment:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

export default router
