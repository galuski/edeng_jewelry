// backend/services/mailer.service.js
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail", // אם אתה משתמש בג'ימייל, אחרת לשנות לפי ספק הדוא"ל שלך
  auth: {
    user: process.env.MAIL_USER, // המשתמש שלך (כתובת המייל ששולחת)
    pass: process.env.MAIL_PASS, // סיסמה/אפליקציה ספציפית
  },
})

export async function sendOrderEmail({ to, contact, items, amount }) {
  const itemsHtml = items.map(
    (item) => `<li>${item.name} — ₪${item.price}</li>`
  ).join("")

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

  await transporter.sendMail({
    from: `"Edeng_Jewellry Store" <${process.env.MAIL_USER}>`,
    to, // כתובת המייל של המנהל (תגדיר ב-ENV)
    subject: "✨ התקבלה הזמנה חדשה",
    html,
  })
}
