// backend/services/ypay.route.js
import express from "express"
import fetch from "node-fetch"
import { sendOrderEmail } from "./mailer.service.js"

const router = express.Router()

const BASE_URL = "https://ypay.co.il/api/v1"
const YPAY_CLIENT_ID = process.env.YPAY_CLIENT_ID
const YPAY_CLIENT_SECRET = process.env.YPAY_CLIENT_SECRET

// 🔎 בדיקה שה־ENV באמת נטען
console.log("🔑 ENV check (PRODUCTION):", {
  YPAY_CLIENT_ID,
  YPAY_CLIENT_SECRET: YPAY_CLIENT_SECRET ? "***" : undefined,
})

// --------------------------------------------------
// לקיחת Access Token
// --------------------------------------------------
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
  console.log("📥 AccessToken response:", data)

  if (!res.ok || !data.access_token) {
    throw new Error(`❌ YPAY AccessToken error: ${JSON.stringify(data)}`)
  }

  return data.access_token
}

// --------------------------------------------------
// יצירת לינק תשלום (כולל קבלה ב-YPAY)
// --------------------------------------------------
router.post("/payment", async (req, res) => {
  try {
    const { amount, contact, items, discount } = req.body
    const accessToken = await getAccessToken()

    // ⚡ יוצרים תיאור לפי המוצרים (vendor/name)
    const itemsDetails = items
      .map((i) => `${i.vendor || i.name || "מוצר"} (x${i.quantity || 1})`)
      .join(", ")

    const body = {
      payments: 1,
      chargeIdentifier: "edeng-" + Date.now(),
      docType: 108, // קבלה
      mail: true,
      signDoc: true,
      rounding: false,
      details: `תשלום עבור: ${itemsDetails} — סה״כ ${amount} ש״ח`,
      lang: "he",
      currency: "ILS",
      contact,
      items,
      notifyUrl: "https://edengjewellry.com/api/ypay/notify-admin",
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
    console.log("📤 Body sent to YPAY:", JSON.stringify(body, null, 2))
    console.log("📥 Payment response from YPAY:", JSON.stringify(payData, null, 2))

    if (!payRes.ok || payData.responseCode !== 1) {
      throw new Error(`❌ YPAY Payment error: ${JSON.stringify(payData)}`)
    }

    res.json({
      url: payData.url,
      chargeIdentifier: body.chargeIdentifier,
    })
  } catch (err) {
    console.error("❌ Payment route error:", err)
    res.status(500).json({ error: err.message })
  }
})

// --------------------------------------------------
// שליחת מייל למנהלת בלבד (ללא יצירת מסמך נוסף ב-YPAY)
// --------------------------------------------------
router.post("/notify-admin", async (req, res) => {
  try {
    const { contact, items, amount } = req.body

    await sendOrderEmail({
      to: process.env.MAIL_ADMIN,
      contact,
      items,
      amount,
    })

    res.json({ success: true })
  } catch (err) {
    console.error("❌ Notify admin error:", err)
    res.status(500).json({ error: err.message })
  }
})

export default router