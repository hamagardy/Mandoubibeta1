import React, { useState, useEffect, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import { db } from "../firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";

const translations = {
  en: {
    followUp: "Follow Up Activities",
    email: "User",
    customerName: "Customer",
    totalSales: "Total Sales",
    activity: "Activity",
    date: "Date",
    noActivity: "No activities found.",
    totalAmount: "Total Amount",
    status: "Status",
    recentActivities: "Recent Activities",
    allActivities: "All Activities",
    showAll: "Show All",
    showRecent: "Show Recent Only",
  },
  ar: {
    followUp: "أنشطة المتابعة",
    email: "المستخدم",
    customerName: "العميل",
    totalSales: "إجمالي المبيعات",
    activity: "النشاط",
    date: "التاريخ",
    noActivity: "لم يتم العثور على أنشطة.",
    totalAmount: "المبلغ الإجمالي",
    status: "الحالة",
    recentActivities: "الأنشطة الأخيرة",
    allActivities: "جميع الأنشطة",
    showAll: "عرض الكل",
    showRecent: "عرض الأحدث فقط",
  },
  ku: {
    followUp: "چالاکیەکانی بەدواداچوون",
    email: "بەکارهێنەر",
    customerName: "کڕیار",
    totalSales: "کۆی فرۆشتن",
    activity: "چالاکی",
    date: "ڕێکەوت",
    noActivity: "هیچ چالاکیەک نەدۆزراوەتەوە.",
    totalAmount: "کۆی گشتی",
    status: "دۆخ",
    recentActivities: "چالاکیە تازەکان",
    allActivities: "هەموو چالاکیەکان",
    showAll: "هەموو نیشان بدە",
    showRecent: "تەنها تازەکان نیشان بدە",
  },
};

const FollowUp = ({ currency, exchangeRate }) => {
  const [sellers, setSellers] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loading, setLoading] = useState(true);
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const sellersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email || "Unknown",
          name: doc.data().name || "Unnamed",
        }));
        setSellers(sellersData);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };
    
    fetchSellers();

    const unsubscribe = onSnapshot(collection(db, "sales"), (snapshot) => {
      try {
        const activities = [];
        snapshot.docs.forEach((doc) => {
          const sale = doc.data();
          activities.push({
            id: doc.id,
            userId: sale.userId,
            customerName: sale.customerName,
            totalPrice: sale.totalPrice,
            date: sale.date,
            status: sale.status || "not-visited",
            items: sale.items || [],
            note: sale.note || "",
          });
        });
        
        // Sort activities by date (newest first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllActivities(activities);
        setLoading(false);
      } catch (error) {
        console.error("Error processing sales data:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  const getSellerName = (userId) => {
    const seller = sellers.find(s => s.id === userId);
    return seller ? (seller.name || seller.email) : "Unknown User";
  };

  const displayedActivities = showAllActivities 
    ? allActivities 
    : allActivities.slice(0, 10); // Show only recent 10 activities

  const getStatusBadge = (status) => {
    const badgeClass = status === "visited" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {status === "visited" ? "Visited" : "Not Visited"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="ios-glassy-container">
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{
              fontSize: "1.125rem",
              color: "var(--body)",
              fontWeight: "500"
            }}>
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="ios-glassy-container">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <h2 style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: "var(--dark)",
            margin: 0
          }}>
            {translations[language].followUp}
          </h2>
          <button
            onClick={() => setShowAllActivities(!showAllActivities)}
            className="ios-button"
          >
            {showAllActivities 
              ? translations[language].showRecent 
              : translations[language].showAll}
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="ios-grid ios-grid-3" style={{ marginBottom: "1.5rem" }}>
          <div className="ios-card" style={{
            background: "rgba(60, 80, 224, 0.05)",
            border: "1px solid rgba(60, 80, 224, 0.1)"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "var(--primary)",
              marginBottom: "0.5rem"
            }}>
              Total Users
            </h3>
            <p style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "var(--primary)",
              margin: 0
            }}>
              {sellers.length}
            </p>
          </div>
          
          <div className="ios-card" style={{
            background: "rgba(33, 150, 83, 0.05)",
            border: "1px solid rgba(33, 150, 83, 0.1)"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "var(--success)",
              marginBottom: "0.5rem"
            }}>
              Total Activities
            </h3>
            <p style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "var(--success)",
              margin: 0
            }}>
              {allActivities.length.toLocaleString()}
            </p>
          </div>
          
          <div className="ios-card" style={{
            background: "rgba(156, 39, 176, 0.05)",
            border: "1px solid rgba(156, 39, 176, 0.1)"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#9C27B0",
              marginBottom: "0.5rem"
            }}>
              Total Revenue
            </h3>
            <p style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "#9C27B0",
              margin: 0
            }}>
              {priceDisplay(allActivities.reduce((sum, activity) => sum + (activity.totalPrice || 0), 0)).toLocaleString()} {currency}
            </p>
          </div>
        </div>
      </div>
      
      <div className="ios-glassy-container">
        <div style={{ overflowX: "auto" }}>
          <table className="ios-table">
            <thead>
              <tr>
                <th>{translations[language].email}</th>
                <th>{translations[language].customerName}</th>
                <th>{translations[language].totalAmount}</th>
                <th>{translations[language].status}</th>
                <th>{translations[language].date}</th>
              </tr>
            </thead>
            <tbody>
              {displayedActivities.length > 0 ? (
                displayedActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <div style={{
                        fontWeight: "500",
                        color: "var(--dark)"
                      }}>
                        {getSellerName(activity.userId)}
                      </div>
                    </td>
                    <td style={{ color: "var(--body)" }}>
                      {activity.customerName}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: "600",
                        color: "var(--success)"
                      }}>
                        {priceDisplay(activity.totalPrice).toLocaleString()} {currency}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "8px",
                        background: activity.status === "visited"
                          ? "rgba(33, 150, 83, 0.1)"
                          : "rgba(211, 64, 83, 0.1)",
                        color: activity.status === "visited"
                          ? "var(--success)"
                          : "var(--danger)",
                        fontWeight: "500"
                      }}>
                        {activity.status === "visited" ? "Visited" : "Not Visited"}
                      </span>
                    </td>
                    <td style={{
                      color: "var(--body)",
                      fontSize: "0.875rem"
                    }}>
                      {new Date(activity.date).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "var(--body)"
                  }}>
                    {translations[language].noActivity}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!showAllActivities && allActivities.length > 10 && (
          <div style={{
            marginTop: "1rem",
            textAlign: "center"
          }}>
            <p style={{
              color: "var(--body)",
              fontSize: "0.875rem"
            }}>
              Showing 10 of {allActivities.length.toLocaleString()} activities
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUp;
