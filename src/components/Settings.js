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
      <form className="settings-form">
        <h2>{translations[language].settings}</h2>
        <div>
          <label>{translations[language].language}</label>
          <select
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
            <div>
              <label>{translations[language].targetPriceSettings}</label>
              <p>
                {translations[language].currentTargetPrice} {localTargetPrice}{" "}
                {currentCurrency}
              </p>
              <input
                type="number"
                value={localTargetPrice}
                onChange={(e) => setLocalTargetPrice(e.target.value)}
              />
              <button type="button" onClick={handleSaveTargetPrice}>
                {translations[language].saveTargetPrice}
              </button>
            </div>
            <div>
              <label>{translations[language].currencySettings}</label>
              <button
                type="button"
                onClick={() => changeCurrency("IQD")}
                style={{
                  backgroundColor:
                    currentCurrency === "IQD" ? "#5e72e4" : "#e9ecef",
                  marginRight: "0.5rem",
                }}
              >
                {translations[language].iq}
              </button>
              <button
                type="button"
                onClick={() => changeCurrency("USD")}
                style={{
                  backgroundColor:
                    currentCurrency === "USD" ? "#5e72e4" : "#e9ecef",
                }}
              >
                {translations[language].usd}
              </button>
            </div>
            <button
              type="button"
              className="reset-btn"
              onClick={handleResetSales}
            >
              {translations[language].resetSalesData}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Settings;
