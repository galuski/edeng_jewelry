// backend/loadEnv.js
import dotenv from "dotenv"
import path from "path"

// טוען את ה־.env מהתיקייה של ה־backend
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

console.log("🔑 ENV loaded:", {
  ADMIN_USER: process.env.ADMIN_USER ? "OK" : "MISSING",
  ADMIN_PASS: process.env.ADMIN_PASS ? "OK" : "MISSING",
  SECRET: process.env.SECRET ? "OK" : "MISSING",
})