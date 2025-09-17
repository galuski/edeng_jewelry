import express from "express"
import fetch from "node-fetch"

const router = express.Router()

// 🛡️ חשוב: שמור את הסודות ב-ENV, לא בקוד
const YPAY_CLIENT_ID = process.env.YPAY_CLIENT_ID
const YPAY_CLIENT_SECRET = process.env.YPAY_CLIENT_SECRET
const BASE_URL = "https://ypay.co.il/api/v1"

// פונקציה פנימית לקבלת Access Token
async function getAccessToken() {
  const res = await fetch(`${BASE_URL}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: YPAY_CLIENT_ID,
      client_secret: YPAY_CLIENT_SECRET,
    }),
  })

  const data = await res.json()

  if (!res.ok || !data.access_token) {
    throw new Error(`YPAY AccessToken error: ${JSON.stringify(data)}`)
  }

  return data.access_token
}

// 🔹 1. יצירת לינק תשלום (Credit Clearing API)
router.post("/payment", async (req, res) => {
  try {
    const { amount, contact, items, discount } = req.body

    const accessToken = await getAccessToken()

    const body = {
      payments: 1,
      chargeIdentifier: "edeng-" + Date.now(),
      docType: 108, // קבלה
      mail: true,
      rounding: false,
      signDoc: true,
      details: "תשלום עבור תכשיטים באתר Edeng_Jewellry",
      lang: "he",
      currency: "ILS",
      contact,
      items,
      notifyUrl: "https://edengjewellry.com/api/ypay/notify",
      successUrl: "https://edengjewellry.com/order/success",
      failureUrl: "https://edengjewellry.com/order/failure",
    }

    if (discount && discount > 0) {
      body.discount = discount
      body.discountType = "percent"
    }

    const payRes = await fetch(`${BASE_URL}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const payData = await payRes.json()

    if (!payRes.ok || payData.responseCode !== 1) {
      throw new Error(`YPAY Payment error: ${JSON.stringify(payData)}`)
    }

    res.json({
      url: payData.url,
      chargeIdentifier: body.chargeIdentifier,
    })
  } catch (err) {
    console.error("❌ YPAY Payment Error:", err)
    res.status(500).json({ error: err.message })
  }
})

// 🔹 2. יצירת קבלה (Document Generator API)
router.post("/document", async (req, res) => {
  try {
    const { contact, items, amount } = req.body
    const accessToken = await getAccessToken()

    const body = {
      docType: 108, // קבלה
      mail: true,
      signDoc: true,
      lang: "he",
      currency: "ILS",
      contact,
      items,
      methods: [
        { type: 4, total: amount } // 4 = אשראי
      ],
    }

    const docRes = await fetch(`${BASE_URL}/document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const docData = await docRes.json()

    if (!docRes.ok || !docData.url) {
      throw new Error(`YPAY Document error: ${JSON.stringify(docData)}`)
    }

    res.json({
      url: docData.url,
      serialNumber: docData.serial_number,
    })
  } catch (err) {
    console.error("❌ YPAY Document Error:", err)
    res.status(500).json({ error: err.message })
  }
})

export default router
