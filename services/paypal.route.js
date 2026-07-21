import express from 'express';
const router = express.Router();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE } = process.env;

// פונקציית עזר: קבלת טוקן גישה מ-PayPal
const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("Missing PayPal API credentials");
        }
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
        throw error;
    }
};

// ראוט 1: יצירת הזמנה - לכאן ה-React יפנה כשהלקוח לוחץ על כפתור פייפאל
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency, cart, payer } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Missing amount for order creation" });
        }

        // 🌟 התיקון הקריטי בשרת: מעגלים את הסכום כלפי מעלה בוודאות מוחלטת
        const finalRoundedAmount = Math.ceil(Number(amount));

        const accessToken = await generateAccessToken();
        const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;
        
        const payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: currency || "USD",
                        // מעבירים לפייפאל את המספר המעוגל השלם כסטרינג
                        value: finalRoundedAmount.toString(), 
                    },
                    description: `Jewelry purchase by ${payer?.payerName || 'Guest'}`,
                },
            ],
        };

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            method: "POST",
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        res.json(data); 
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

// ראוט 2: לכידת התשלום - לכאן ה-React יפנה אחרי שהלקוח אישר בחלון של פייפאל
router.post('/:orderID/capture', async (req, res) => {
    try {
        const { orderID } = req.params;
        const accessToken = await generateAccessToken();
        const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        
        // TODO: לבדוק כאן אם data.status === 'COMPLETED'
        // ואז לשמור את ההזמנה ב-DB, לרוקן עגלה ולשלוח אימייל אישור

        res.json(data);
    } catch (error) {
        console.error("Failed to capture order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});

export default router;