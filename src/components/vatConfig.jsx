// vatConfig.js – ניהול גלובלי של אחוז מע"מ + חישוב
let vatRate = 18; // ברירת מחדל: 18%

export const getVatRate = () => vatRate;

export const setVatRate = (newRate) => {
  vatRate = newRate;
};

// מחשב מחיר כולל מע"מ לפי אחוז נוכחי
export const calculatePriceWithVAT = (price) => {
  if (isNaN(price)) return "0.00";
  return (price * (1 + vatRate / 100)).toFixed(2);
};
