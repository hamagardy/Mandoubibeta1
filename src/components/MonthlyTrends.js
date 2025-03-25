import React, { useEffect, useState, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const translations = {
  en: {
    monthlyTrends: "Monthly Sales Trends",
    daily: "Daily",
    weekly: "Weekly",
  },
  ar: {
    monthlyTrends: "اتجاهات المبيعات الشهرية",
    daily: "يومي",
    weekly: "أسبوعي",
  },
  ku: {
    monthlyTrends: "ڕووبەرەکانی فرۆشتنی مانگانە",
    daily: "یەومە",
    weekly: "هەفتانە",
  },
};

const MonthlyTrends = ({ currency, exchangeRate }) => {
  const [salesData, setSalesData] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [viewType, setViewType] = useState("Daily");
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const salesRef = collection(db, "sales");
    const q = query(salesRef, where("userId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSalesData(sales);
      },
      (error) => console.error("Error fetching sales:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dailyData = Array(31)
      .fill(0)
      .map((_, index) => ({
        day: index + 1,
        total: salesData
          .filter((sale) => new Date(sale.date).getDate() === index + 1)
          .reduce((sum, sale) => sum + (sale.totalPrice || 0), 0),
      }));
    setDailySales(dailyData);
  }, [salesData]);

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  const dataToDisplay =
    viewType === "Daily"
      ? dailySales
      : dailySales.reduce((weekly, day, index) => {
          const week = Math.floor(index / 7);
          if (!weekly[week])
            weekly[week] = { week: `Week ${week + 1}`, total: 0 };
          weekly[week].total += day.total;
          return weekly;
        }, []);

  return (
    <div className="monthly-trends p-4">
      <h2 className="text-xl font-bold mb-4">
        {translations[language].monthlyTrends}
      </h2>
      <select
        onChange={(e) => setViewType(e.target.value)}
        value={viewType}
        className="p-2 border rounded mb-4"
      >
        <option value="Daily">{translations[language].daily}</option>
        <option value="Weekly">{translations[language].weekly}</option>
      </select>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dataToDisplay}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={viewType === "Daily" ? "day" : "week"} />
          <YAxis />
          <Tooltip
            formatter={(value) => `${priceDisplay(value)} ${currency}`}
          />
          <Line type="monotone" dataKey="total" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyTrends;
