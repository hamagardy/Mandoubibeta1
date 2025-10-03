import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageContext } from "./LanguageContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const translations = {
  en: {
    home: "Home",
    dailySales: "Daily Sales",
    salesData: "Sales Data",
    reports: "Reports",
    items: "Items",
    salesForecast: "Sales Forecast",
    settings: "Settings",
    adminMembers: "Admin Members",
    followUp: "Follow Up",
    pharmaLocations: "Pharma Locations",
    brochure: "Brochure", // New translation
    logout: "Logout",
  },
  ar: {
    home: "الرئيسية",
    dailySales: "المبيعات اليومية",
    salesData: "بيانات المبيعات",
    reports: "التقارير",
    items: "العناصر",
    salesForecast: "التنبؤ بالمبيعات",
    settings: "الإعدادات",
    adminMembers: "أعضاء الإدارة",
    followUp: "متابعة",
    pharmaLocations: "مکان صیدلیات",
    brochure: "بروشور", // New translation
    logout: "تسجيل الخروج",
  },
  ku: {
    home: "ماڵەوە",
    dailySales: "فرۆشتنی ڕۆژانە",
    salesData: "زانیاری فرۆشتن",
    reports: "ڕاپۆرتەکان",
    items: "کاڵاکان",
    salesForecast: "پێشبینی فرۆشتن",
    settings: "ڕێکخستنەکان",
    adminMembers: "ئەندامەکانی بەڕێوەبردن",
    followUp: "بەدواداچوون",
    pharmaLocations: "شوێنی دەرمانخانەکان",
    brochure: "بروشور", // New translation
    logout: "چوونەدەرەوە",
  },
};

const Menu = ({ role, permissions }) => {
  const { language, changeLanguage } = useContext(LanguageContext);
  const isAdmin = role === "admin";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef(null);
  const navigate = useNavigate();

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleLanguage = () => setIsLanguageOpen(!isLanguageOpen);

  const getLanguageFlag = (lang) => {
    switch (lang) {
      case 'en': return '🇬🇧'; // UK flag for English
      case 'ar': return '🇮🇶'; // Iraqi flag for Arabic
      case 'ku': return (
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/1200px-Flag_of_Kurdistan.svg.png" 
          alt="Kurdistan Flag" 
          className="flag"
          style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }}
        />
      );
      default: return '🇬🇧';
    }
  };

  const getLanguageName = (lang) => {
    switch (lang) {
      case 'en': return 'English';
      case 'ar': return 'العربية';
      case 'ku': return 'کوردی';
      default: return 'English';
    }
  };

  const getLanguageClass = (lang) => {
    switch (lang) {
      case 'ar': return 'arabic-text';
      case 'ku': return 'kurdish-text';
      default: return '';
    }
  };

  const handleDailySalesClick = (e) => {
    // Remove password protection - allow direct access
    setIsMenuOpen(false);
    navigate("/daily-sales");
  };

  const menuItems = [
    { path: "/", label: translations[language].home, key: "salesSummary" },
    {
      path: "/daily-sales",
      label: translations[language].dailySales,
      key: "dailySales",
      onClick: handleDailySalesClick,
    },
    {
      path: "/brochure",
      label: translations[language].brochure,
      key: "brochure",
    },
    {
      path: "/sales-data",
      label: translations[language].salesData,
      key: "salesData",
    },
    {
      path: "/reports",
      label: translations[language].reports,
      key: "salesReports",
    },
    { path: "/items", label: translations[language].items, key: "items" },
    {
      path: "/sales-forecast",
      label: translations[language].salesForecast,
      key: "salesForecast",
    },
    {
      path: "/settings",
      label: translations[language].settings,
      key: "settings",
    },
    {
      path: "/admin-members",
      label: translations[language].adminMembers,
      key: "adminMembers",
    },
    {
      path: "/follow-up",
      label: translations[language].followUp,
      key: "followUp",
    },
    {
      path: "/pharma-locations",
      label: translations[language].pharmaLocations,
      key: "pharmaLocations",
    },
  ];

  const filteredItems = isAdmin
    ? menuItems
    : menuItems.filter((item) => permissions[item.key]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">Sales Dashboard</span>
        </Link>
        <div className="navbar-buttons">
          {/* Language Dropdown */}
          <div className="language-dropdown" ref={languageRef}>
            <button
              onClick={toggleLanguage}
              className="navbar-btn language-btn haptic-feedback"
            >
              <span className="flag">{getLanguageFlag(language)}</span>
              <span className={`language-text ${getLanguageClass(language)}`}>{getLanguageName(language)}</span>
              <span className={`dropdown-arrow ${isLanguageOpen ? 'open' : ''}`}>▼</span>
            </button>
            {isLanguageOpen && (
              <div className="language-menu">
                <button
                  onClick={() => {
                    changeLanguage('en');
                    setIsLanguageOpen(false);
                  }}
                  className={`language-option ${language === 'en' ? 'active' : ''}`}
                >
                  <span className="flag">🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => {
                    changeLanguage('ar');
                    setIsLanguageOpen(false);
                  }}
                  className={`language-option ${language === 'ar' ? 'active' : ''}`}
                >
                  <span className="flag">🇮🇶</span>
                  <span className="arabic-text">العربية</span>
                </button>
                <button
                  onClick={() => {
                    changeLanguage('ku');
                    setIsLanguageOpen(false);
                  }}
                  className={`language-option ${language === 'ku' ? 'active' : ''}`}
                >
                  <span className="flag">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/1200px-Flag_of_Kurdistan.svg.png" 
                      alt="Kurdistan Flag" 
                      style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }}
                    />
                  </span>
                  <span className="kurdish-text">کوردی</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="navbar-btn navbar-logout-btn haptic-feedback"
          >
            {translations[language].logout}
          </button>
          <button
            className={`navbar-toggle haptic-feedback ${isMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
          >
            <span className="navbar-toggle-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </span>
            <span className="navbar-toggle-close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          </button>
        </div>
        <div className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <ul className="navbar-nav">
            {filteredItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className="nav-link haptic-feedback"
                  onClick={item.onClick || (() => setIsMenuOpen(false))}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Menu;
