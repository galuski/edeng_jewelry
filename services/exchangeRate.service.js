const APP_ID = process.env.OPEN_EXCHANGE_APP_ID;
const API_URL = `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`;

// משתנה שיחזיק את השער הנוכחי בזיכרון
let currentIlsRate = null;

async function fetchExchangeRate() {
    try {
        // שימוש ב-fetch המובנה של Node.js (גרסאות 18 ומעלה)
        // אם אתה בגרסה ישנה יותר, תוכל להשתמש ב-axios
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data && data.rates && data.rates.ILS) {
            currentIlsRate = data.rates.ILS;
            console.log(`[Exchange Rate] Updated successfully: 1 USD = ${currentIlsRate} ILS`);
        }
    } catch (error) {
        console.error('[Exchange Rate] Error fetching data:', error);
    }
}

// קריאה ראשונית ברגע שהשרת עולה
fetchExchangeRate();

// הגדרת טיימר שקורא לפונקציה פעם בשעה (1000 מילישניות * 60 שניות * 60 דקות)
setInterval(fetchExchangeRate, 1000 * 60 * 60);

// פונקציה שתחזיר את השער לראוטר שלנו
function getRate() {
    return currentIlsRate;
}

export { getRate };