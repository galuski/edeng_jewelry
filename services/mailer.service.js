// backend/services/mailer.service.js
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail", // אם זה לא Gmail – שנה לספק שלך
  auth: {
    user: process.env.MAIL_USER, // הכתובת ששולחת
    pass: process.env.MAIL_PASS, // סיסמת אפליקציה של Gmail
  },
})

// לוודא שהמשתנים נטענו (לצורך דיבוג בלבד)
console.log("Mailer config loaded:", {
  user: process.env.MAIL_USER,
  passLength: process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 0
});


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

// --- פונקציה חדשה (צור קשר) ---
export async function sendContactEmail({ name, email, phone, message }) {
  const html = `
    <h2>📩 הודעה חדשה מהאתר (צור קשר)</h2>
    <p><b>שם:</b> ${name}</p>
    <p><b>אימייל:</b> ${email}</p>
    <p><b>טלפון:</b> ${phone}</p>
    <p><b>תוכן ההודעה:</b></p>
    <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
      ${message}
    </blockquote>
  `

  try {
    await transporter.sendMail({
      from: `"Contact Form" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_ADMIN, // המייל שלך (המנהל)
      replyTo: email, // כדי שתוכל לעשות "השב" ישירות ללקוח
      subject: `הודעה חדשה מאת: ${name}`,
      html,
    })
    console.log("📧 Contact email sent successfully")
  } catch (err) {
    console.error("❌ Failed to send contact email:", err)
    throw err
  }
}