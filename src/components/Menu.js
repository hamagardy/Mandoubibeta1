import React, { useContext, useState } from "react";
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
  const { language } = useContext(LanguageContext);
  const isAdmin = role === "admin";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleDailySalesClick = (e) => {
    if (isAdmin) {
      e.preventDefault();
      const password = prompt("Please enter the password:");
      if (password === "1") {
        setIsMenuOpen(false);
        navigate("/daily-sales");
      } else {
        alert("Incorrect password!");
      }
    } else {
      setIsMenuOpen(false);
    }
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
    {
      path: "/brochure",
      label: translations[language].brochure, // New menu item
      key: "brochure",
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
          <button
            onClick={handleLogout}
            className="navbar-btn navbar-logout-btn"
          >
            {translations[language].logout}
          </button>
          <button
            className={`navbar-toggle ${isMenuOpen ? "active" : ""}`}
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
                  className="nav-link"
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
