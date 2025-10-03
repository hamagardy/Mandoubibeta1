// Settings.js (unchanged except for logging)
import React, { useState, useContext } from "react";
import { LanguageContext } from "./LanguageContext";

const translations = {
  en: {
    settings: "Settings",
    language: "Language",
    targetPriceSettings: "Target Price Settings (Current Month)",
    currentTargetPrice: "Current Target Price:",
    saveTargetPrice: "Save Target Price",
    currencySettings: "Currency Settings",
    iq: "IQD",
    usd: "USD",
    resetSalesData: "Reset All Sales Data",
  },
  ar: {
    settings: "الإعدادات",
    language: "اللغة",
    targetPriceSettings: "إعدادات سعر الهدف (الشهر الحالي)",
    currentTargetPrice: "سعر الهدف الحالي:",
    saveTargetPrice: "حفظ سعر الهدف",
    currencySettings: "إعدادات العملة",
    iq: "دينار عراقي",
    usd: "دولار أمريكي",
    resetSalesData: "إعادة تعيين جميع بيانات المبيعات",
  },
  ku: {
    settings: "ڕێکخستنەکان",
    language: "زمان",
    targetPriceSettings: "ڕێکخستنەکانی نرخەی ئامانج (مانگی ئێستا)",
    currentTargetPrice: "نرخی ئامانجی ئێستا:",
    saveTargetPrice: "پاشەکەوتکردنی نرخی ئامانج",
    currencySettings: "ڕێکخستنەکانی دراو",
    iq: "د.ع",
    usd: "دۆلار",
    resetSalesData: "سڕینەوەی هەموو داتاکانی فرۆشتن",
  },
};

const Settings = ({
  resetAllSales,
  changeCurrency,
  currentCurrency,
  updateTargetPrice,
  monthlyTargetPrices,
  role,
}) => {
  const currentMonth = new Date().getMonth(); // 0-11 (Jan-Dec)
  const [localTargetPrice, setLocalTargetPrice] = useState(
    monthlyTargetPrices[currentMonth] || 13000000
  );
  const { language, changeLanguage } = useContext(LanguageContext);
  const isAdmin = role === "admin";

  const handleSaveTargetPrice = async () => {
    const numericTargetPrice = Number(localTargetPrice);
    if (isNaN(numericTargetPrice) || numericTargetPrice <= 0) {
      alert("Please enter a valid target price.");
      return;
    }
    if (
      isAdmin &&
      !window.confirm(
        "Are you sure you want to update the target price for all users for this month?"
      )
    )
      return;
    await updateTargetPrice(numericTargetPrice, currentMonth);
    setLocalTargetPrice(numericTargetPrice);
    console.log(
      "Settings: Updated target for month",
      currentMonth,
      "to",
      numericTargetPrice
    ); // Debug log
    alert("Target price updated successfully for the current month!");
  };

  const handleResetSales = () => {
    if (isAdmin) {
      const password = prompt(
        "Please enter the password to reset all sales data:"
      );
      if (password !== "Hama1122") {
        alert("Incorrect password!");
        return;
      }
    }
    if (
      !window.confirm(
        "Are you sure you want to reset ALL sales data for ALL accounts?"
      )
    )
      return;
    resetAllSales();
    alert("All sales data has been reset!");
  };

  return (
    <div className="container">
      <div className="ios-glassy-container">
        <h2 style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          color: "var(--dark)",
          textAlign: "center"
        }}>
          {translations[language].settings}
        </h2>
        
        <div className="ios-grid ios-grid-1" style={{ gap: "1.5rem" }}>
          <div className="ios-card">
            <label className="ios-label">{translations[language].language}</label>
            <select
              className="ios-select"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="en">English (EN)</option>
              <option value="ar">العربية (AR)</option>
              <option value="ku">کوردی (KU)</option>
            </select>
          </div>
          
          {isAdmin && (
            <>
              <div className="ios-card">
                <label className="ios-label">{translations[language].targetPriceSettings}</label>
                <div style={{
                  padding: "1rem",
                  background: "rgba(60, 80, 224, 0.05)",
                  borderRadius: "12px",
                  marginBottom: "1rem"
                }}>
                  <div style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "var(--primary)"
                  }}>
                    {translations[language].currentTargetPrice} {localTargetPrice.toLocaleString()} {currentCurrency}
                  </div>
                </div>
                <input
                  className="ios-input"
                  type="number"
                  value={localTargetPrice}
                  onChange={(e) => setLocalTargetPrice(e.target.value)}
                  style={{ marginBottom: "1rem" }}
                />
                <button 
                  type="button" 
                  onClick={handleSaveTargetPrice}
                  className="ios-button"
                  style={{ width: "100%" }}
                >
                  {translations[language].saveTargetPrice}
                </button>
              </div>
              
              <div className="ios-card">
                <label className="ios-label">{translations[language].currencySettings}</label>
                <div className="ios-input-group">
                  <button
                    type="button"
                    onClick={() => changeCurrency("IQD")}
                    className={`ios-button ${
                      currentCurrency === "IQD" ? "" : "ios-button-secondary"
                    }`}
                    style={{
                      flex: 1,
                      background: currentCurrency === "IQD" 
                        ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)"
                        : "rgba(0, 0, 0, 0.05)",
                      color: currentCurrency === "IQD" ? "var(--white)" : "var(--dark)"
                    }}
                  >
                    {translations[language].iq}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeCurrency("USD")}
                    className={`ios-button ${
                      currentCurrency === "USD" ? "" : "ios-button-secondary"
                    }`}
                    style={{
                      flex: 1,
                      background: currentCurrency === "USD" 
                        ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)"
                        : "rgba(0, 0, 0, 0.05)",
                      color: currentCurrency === "USD" ? "var(--white)" : "var(--dark)"
                    }}
                  >
                    {translations[language].usd}
                  </button>
                </div>
              </div>
              
              <div className="ios-card" style={{
                background: "rgba(211, 64, 83, 0.05)",
                border: "1px solid rgba(211, 64, 83, 0.1)"
              }}>
                <button
                  type="button"
                  className="ios-button ios-button-danger"
                  onClick={handleResetSales}
                  style={{ width: "100%" }}
                >
                  {translations[language].resetSalesData}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
