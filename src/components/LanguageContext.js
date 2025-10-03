import React, { createContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  // Initialize language settings on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    changeLanguage(savedLanguage);
  }, []);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
    document.dir = newLanguage === "ar" || newLanguage === "ku" ? "rtl" : "ltr";
    
    // Apply language-specific font classes
    document.body.className = document.body.className.replace(/\b(arabic-text|kurdish-text)\b/g, '');
    if (newLanguage === "ar") {
      document.body.classList.add('arabic-text');
    } else if (newLanguage === "ku") {
      document.body.classList.add('kurdish-text');
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
