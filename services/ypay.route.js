import express from "express"
import fetch from "node-fetch"

const router = express.Router()

const BASE_URL = "https://ypay.co.il/api/v1"
const YPAY_CLIENT_ID = process.env.YPAY_CLIENT_ID
const YPAY_CLIENT_SECRET = process.env.YPAY_CLIENT_SECRET

// פונקציה פנימית ללקיחת Access Token
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
  console.log("📥 AccessToken raw response:", data) // ✅ לוג של התשובה המקורית

  if (!res.ok || !data.access_token) {
    throw new Error(`❌ YPAY AccessToken error: ${JSON.stringify(data)}`)
  }

  console.log("✅ Got access token:", data.access_token) // ✅ טוקן מוצלח
  return data.access_token
}

// 🔹 יצירת לינק תשלום
router.post("/payment", async (req, res) => {
  try {
    const { amount, contact, items, discount } = req.body
    console.log("📩 Incoming /payment request body:", {
      amount,
      contact,
      items,
      discount,
    })

    const accessToken = await getAccessToken()

    const body = {
      payments: 1,
      chargeIdentifier: "edeng-" + Date.now(),
      docType: 108,
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

    console.log("📤 Sending payment body to YPAY:", JSON.stringify(body, null, 2))

    const payRes = await fetch(`${BASE_URL}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const payData = await payRes.json()
    console.log("📥 YPAY raw payment response:", payData) // ✅ תגובה מקורית מ־YPAY

    if (!payRes.ok || payData.responseCode !== 1) {
      console.error("❌ YPAY Payment error response:", payData)
      throw new Error(`❌ YPAY Payment error: ${JSON.stringify(payData)}`)
    }

    res.json({
      url: payData.url,
      chargeIdentifier: body.chargeIdentifier,
    })
    console.log("➡️ Returning to frontend:", {
      url: payData.url,
      chargeIdentifier: body.chargeIdentifier,
    })
  } catch (err) {
    console.error("❌ Payment route error:", err)
    res.status(500).json({ error: err.message })
  }
})

// 🔹 יצירת קבלה
router.post("/document", async (req, res) => {
  try {
    const { contact, items, amount } = req.body
    console.log("📩 Incoming /document request body:", {
      contact,
      items,
      amount,
    })

    const accessToken = await getAccessToken()

    const body = {
      docType: 108,
      mail: true,
      signDoc: true,
      lang: "he",
      currency: "ILS",
      contact,
      items,
      methods: [{ type: 4, total: amount }],
    }

    console.log("📤 Sending document body to YPAY:", JSON.stringify(body, null, 2))

    const docRes = await fetch(`${BASE_URL}/document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const docData = await docRes.json()
    console.log("📥 YPAY raw document response:", docData) // ✅ תגובה מקורית מ־YPAY

    if (!docRes.ok || !docData.url) {
      console.error("❌ YPAY Document error response:", docData)
      throw new Error(`❌ YPAY Document error: ${JSON.stringify(docData)}`)
    }

    res.json({
      url: docData.url,
      serialNumber: docData.serial_number,
    })
    console.log("➡️ Returning document response to frontend:", {
      url: docData.url,
      serialNumber: docData.serial_number,
    })
  } catch (err) {
    console.error("❌ Document route error:", err)
    res.status(500).json({ error: err.message })
  }
})

export default router