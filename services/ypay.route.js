// ✅ ypay.route.js - FINAL VERSION
import express from 'express'

const router = express.Router()

// Get access token
router.post('/get-access-token', async (req, res) => {
    try {
        const response = await fetch('https://ypay.co.il/api/v1/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: 'Mg==',
                client_secret: '1234',
            }),
        })

        const data = await response.json()
        res.json(data)
    } catch (err) {
        console.error('Failed to get token from YPAY:', err)
        res.status(500).send({ error: 'Failed to get token from YPAY' })
    }
})

// Create payment link
router.post('/create-payment', async (req, res) => {
    try {
        const tokenRes = await fetch('https://ypay.co.il/api/v1/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: 'Mg==',
                client_secret: '1234',
            }),
        })

        const { access_token } = await tokenRes.json()

        const paymentRes = await fetch('https://ypay.co.il/api/v1/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify(req.body),
        })

        const data = await paymentRes.json()

        console.log('🔥 YPAY payment response:', data)

        res.json(data)
    } catch (err) {
        console.error('Failed to create payment URL:', err)
        res.status(500).send({ error: 'Failed to create payment URL' })
    }
})

export default router