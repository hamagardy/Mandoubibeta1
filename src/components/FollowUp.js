import React, { useState, useEffect, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import { db } from "../firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";

const translations = {
  en: {
    followUp: "Follow Up",
    email: "Email",
    lastActivity: "Last Activity",
    noActivity: "No recent activity found.",
  },
  ar: {
    followUp: "متابعة",
    email: "البريد الإلكتروني",
    lastActivity: "آخر نشاط",
    noActivity: "لم يتم العثور على نشاط حديث.",
  },
  ku: {
    followUp: "بەدواداچوون",
    email: "ئیمەیڵ",
    lastActivity: "دوایین چالاکی",
    noActivity: "هیچ چالاکیەکی نوێ نەدۆزراوەتەوە.",
  },
};

const FollowUp = ({ currency, exchangeRate }) => {
  const [sellers, setSellers] = useState([]);
  const [activities, setActivities] = useState({});
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    const fetchSellers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setSellers(
        usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email || "Unknown",
        }))
      );
    };
    fetchSellers();

    const unsubscribe = onSnapshot(collection(db, "sales"), (snapshot) => {
      const activityMap = {};
      snapshot.docs.forEach((doc) => {
        const sale = doc.data();
        const userId = sale.userId;
        const saleDate = new Date(sale.date);
        if (
          !activityMap[userId] ||
          saleDate > new Date(activityMap[userId].date)
        ) {
          activityMap[userId] = {
            date: sale.date,
            customerName: sale.customerName,
            totalPrice: sale.totalPrice,
          };
        }
      });
      setActivities(activityMap);
    });

    return () => unsubscribe();
  }, []);

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  return (
    <div className="container">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-[#1f2a44]">
          {translations[language].followUp}
        </h2>
        <table className="follow-up-table w-full">
          <thead>
            <tr>
              <th>{translations[language].email}</th>
              <th>{translations[language].lastActivity}</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id}>
                <td>{seller.email}</td>
                <td className="text-[#67748e]">
                  {activities[seller.id]
                    ? `Last Sale: ${new Date(
                        activities[seller.id].date
                      ).toLocaleString()} - ${
                        activities[seller.id].customerName
                      } (${priceDisplay(
                        activities[seller.id].totalPrice
                      )} ${currency})`
                    : translations[language].noActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FollowUp;
