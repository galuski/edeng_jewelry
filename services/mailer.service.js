// backend/services/mailer.service.js
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail", // אם זה לא Gmail – שנה לספק שלך
  auth: {
    user: process.env.MAIL_USER, // הכתובת ששולחת
    pass: process.env.MAIL_PASS, // סיסמת אפליקציה של Gmail
  },
})

export async function sendOrderEmail({ to, contact, items, amount }) {
  const itemsHtml = items
    .map((item) => `<li>${item.name || item.vendor} — ₪${item.price}</li>`)
    .join("")

  const html = `
    <h2>📦 התקבלה הזמנה חדשה באתר Edeng_Jewellry</h2>
    <p><b>שם הלקוח:</b> ${contact.name}</p>
    <p><b>אימייל:</b> ${contact.email}</p>
    <p><b>טלפון:</b> ${contact.phone}</p>
    <p><b>כתובת:</b> ${contact.address}</p>
    <p><b>סכום לתשלום:</b> ₪${amount}</p>
    <h3>פריטים שנרכשו:</h3>
    <ul>${itemsHtml}</ul>
  `

  try {
    await transporter.sendMail({
      from: `"Edeng_Jewellry Store" <${process.env.MAIL_USER}>`,
      to,
      subject: "✨ התקבלה הזמנה חדשה",
      html,
    })
    console.log("📧 Order email sent to:", to)
  } catch (err) {
    console.error("❌ Failed to send order email:", err)
    throw err
  }
}