import React, { useState, useEffect, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import { useSeller } from "./SellerContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
} from "firebase/firestore";

const translations = {
  en: {
    salesSummary: "Sales Summary",
    target: "Target",
    totalSales: "Total Sales",
    congratsMessage: "Congratulations! You reached your target!",
    tryAgainMessage: "Try next month! ",
    monthlyTrends: "Monthly Sales Trends",
    bestSellingProduct: "Best-Selling Product:",
    mostFrequentCustomer: "Most Frequent Customer:",
    exportAsPDF: "Export as PDF",
    exportAsExcel: "Export as Excel",
    selectSeller: "Select Seller",
    currentDate: "Current Date (Erbil):",
    monthlyPerformance: "Monthly Performance",
    userComparison: "User Comparison",
    currentMonth: "Current Month",
    previousMonth: "Previous Month",
    monthlyGrowth: "Monthly Growth",
    totalUsers: "Total Users",
    totalRevenue: "Total Revenue",
    averagePerUser: "Average per User",
    topPerformer: "Top Performer",
    growth: "Growth",
    decline: "Decline",
    thisYear: "This Year",
    // New translations for member ranking features
    myRanking: "My Ranking",
    teamLeaderboard: "Team Leaderboard",
    lastMonthComparison: "Last Month vs This Month",
    myProgress: "My Progress",
    achievements: "Achievements",
    performanceBoost: "Performance Boost",
    targetProgress: "Target Progress",
    salesStreak: "Sales Streak",
    bestDay: "Best Day",
    improvement: "Improvement",
    keepGoing: "Keep Going!",
    almostThere: "Almost There!",
    superstar: "Superstar!",
    champion: "Champion!",
    rockstar: "Rockstar!",
    weeklyAverage: "Weekly Average",
    dailyGoal: "Daily Goal",
    rank: "Rank",
    position: "Position",
    outOf: "out of",
    salesThisMonth: "Sales This Month",
    salesLastMonth: "Sales Last Month",
    difference: "Difference",
    daysActive: "Days Active",
    avgPerDay: "Avg per Day",
  },
  ar: {
    salesSummary: "ملخص المبيعات",
    target: "الهدف",
    totalSales: "إجمالي المبيعات",
    congratsMessage: "مبروك! وصلت إلى هدفك!",
    tryAgainMessage: "حاول الشهر المقبل! ",
    monthlyTrends: "اتجاهات المبيعات الشهرية",
    bestSellingProduct: "أفضل منتج مبيعاً:",
    mostFrequentCustomer: "أكثر عميل متكرر:",
    exportAsPDF: "تصدير كـ PDF",
    exportAsExcel: "تصدير كـ Excel",
    selectSeller: "اختر البائع",
    currentDate: "التاريخ الحالي (أربيل):",
    monthlyPerformance: "الأداء الشهري",
    userComparison: "مقارنة المستخدمين",
    currentMonth: "الشهر الحالي",
    previousMonth: "الشهر السابق",
    monthlyGrowth: "النمو الشهري",
    totalUsers: "إجمالي المستخدمين",
    totalRevenue: "إجمالي الإيرادات",
    averagePerUser: "المتوسط لكل مستخدم",
    topPerformer: "أفضل أداء",
    growth: "نمو",
    decline: "انخفاض",
    thisYear: "هذا العام",
    // Arabic translations for new features
    myRanking: "ترتيبي",
    teamLeaderboard: "لوحة الصدارة",
    lastMonthComparison: "الشهر الماضي مقابل هذا الشهر",
    myProgress: "تقدمي",
    achievements: "الإنجازات",
    performanceBoost: "دفعة الأداء",
    targetProgress: "تقدم الهدف",
    salesStreak: "سلسلة المبيعات",
    bestDay: "أفضل يوم",
    improvement: "تحسن",
    keepGoing: "استمر!",
    almostThere: "تقريباً هناك!",
    superstar: "نجم خارق!",
    champion: "بطل!",
    rockstar: "نجم روك!",
    weeklyAverage: "المتوسط الأسبوعي",
    dailyGoal: "الهدف اليومي",
    rank: "الرتبة",
    position: "المركز",
    outOf: "من أصل",
    salesThisMonth: "مبيعات هذا الشهر",
    salesLastMonth: "مبيعات الشهر الماضي",
    difference: "الفرق",
    daysActive: "أيام النشاط",
    avgPerDay: "المتوسط في اليوم",
  },
  ku: {
    salesSummary: "ئەنجامی فرۆشتن",
    target: "ئامانج",
    totalSales: "کۆی فرۆشتنەکان",
    congratsMessage: "پیرۆزە! ئامانجەکەت بەدەست ‌هێنا!",
    tryAgainMessage: "هەوڵبدە بۆ مانگی داهاتوو! ",
    monthlyTrends: "ڕووبەرەکانی فرۆشتنی مانگانە",
    bestSellingProduct: "زۆرترین فرۆشراو:",
    mostFrequentCustomer: "باشترین کڕیار:",
    exportAsPDF: "پەیوەندیدانی بە PDF",
    exportAsExcel: "پەیوەندیدانی بە Excel",
    selectSeller: "هەڵبژاردنی فرۆشگا",
    currentDate: "ڕێکەوتی ئێستا (هەولێر):",
    monthlyPerformance: "پڕکردنەوەی مانگانە",
    userComparison: "بەراوردکردنی بەکارهێنەران",
    currentMonth: "مانگی ئێستا",
    previousMonth: "مانگی پێشوو",
    monthlyGrowth: "گەشەی مانگانە",
    totalUsers: "کۆی بەکارهێنەران",
    totalRevenue: "کۆی داهات",
    averagePerUser: "ناوەند بۆ هەر بەکارهێنەر",
    topPerformer: "باشترین کارکرد",
    growth: "گەشە",
    decline: "کەمبوونەوە",
    thisYear: "ئەمساڵ",
    // Kurdish translations for new features
    myRanking: "پڵچەوانەکەم",
    teamLeaderboard: "خشتەی پڵشەنگ",
    lastMonthComparison: "مانگی پێشوو بەراورد بە ئێمەوە",
    myProgress: "پێشکەوتنم",
    achievements: "دەسکەوتنەکان",
    performanceBoost: "بەهێزکردنی کارایی",
    targetProgress: "پێشکەوتنی ئامانج",
    salesStreak: "بەردەوامی فرۆشتن",
    bestDay: "باشترین ڕۆژ",
    improvement: "باشتربوون",
    keepGoing: "بەردەوام بە!",
    almostThere: "بە نەزیکی گەیشتی!",
    superstar: "ئەستێرەی ناوبانگ!",
    champion: "پاڵوان!",
    rockstar: "ئەستێرەی هونەر!",
    weeklyAverage: "ناوەندی هەفتانە",
    dailyGoal: "ئامانجی ڕۆژانە",
    rank: "پڵچەوانە",
    position: "پڵگە",
    outOf: "لە",
    salesThisMonth: "فرۆشتنی ئەم مانگە",
    salesLastMonth: "فرۆشتنی مانگی رابوو",
    difference: "جیاوازی",
    daysActive: "ڕۆژانی چاودێر",
    avgPerDay: "ناوەند فی ڕۆژ",
  },
};

const SalesSummary = ({
  currency,
  exchangeRate,
  monthlyTargetPrices,
  updateTargetPrice,
  setMonthlyTargetPrices,
  role,
}) => {
  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [topProduct, setTopProduct] = useState(null);
  const [topCustomer, setTopCustomer] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { selectedSeller, setSelectedSeller } = useSeller();
  const [currentDate, setCurrentDate] = useState("");
  // New state for member ranking features
  const [userRanking, setUserRanking] = useState(null);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [memberProgressState, setMemberProgressState] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [salesStreak, setSalesStreak] = useState(0);
  const [bestSalesDay, setBestSalesDay] = useState(null);
  const { language } = useContext(LanguageContext);
  const currentMonth = new Date().getMonth();
  const targetPrice = monthlyTargetPrices?.[currentMonth] || 13000000;

  useEffect(() => {
    const fetchSellers = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && role === "admin") {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const sellerList = snapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email || "Unknown",
          name: doc.data().name || "Unnamed",
        }));
        setSellers(sellerList);
      }
    };
    fetchSellers();

    const updateDate = () => {
      const erbilDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Baghdad",
      });
      setCurrentDate(erbilDate);
    };
    updateDate();
    const dateInterval = setInterval(updateDate, 1000);

    const checkMonthlyReset = () => {
      const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Baghdad",
      });
      const day = new Date(now).getDate();
      const month = new Date(now).getMonth();
      const lastResetMonth = localStorage.getItem("lastResetMonth");

      if (day === 1 && month !== Number(lastResetMonth)) {
        setTotalSales(0);
        setSalesData([]);
        localStorage.setItem("lastResetMonth", month);
      }
    };
    checkMonthlyReset();

    return () => clearInterval(dateInterval);
  }, [role]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribeTarget = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (typeof setMonthlyTargetPrices === "function") {
          setMonthlyTargetPrices(userData.monthlyTargetPrices || {});
        } else {
          console.error("setMonthlyTargetPrices is not a function");
        }
      }
    });

    const salesRef = collection(db, "sales");
    let q;
    if (role === "admin" && selectedSeller) {
      q = query(salesRef, where("userId", "==", selectedSeller));
    } else if (role === "admin") {
      q = salesRef;
    } else {
      q = query(salesRef, where("userId", "==", currentUser.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date)
        }));
        setSalesData(sales);
        
        // For admin dashboard analytics - get all sales
        if (role === "admin" && !selectedSeller) {
          setAllSales(sales);
        } else {
          // For regular users, also get all sales for ranking
          const allSalesQuery = collection(db, "sales");
          const allSalesUnsubscribe = onSnapshot(allSalesQuery, (allSnapshot) => {
            const allSalesData = allSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              date: new Date(doc.data().date)
            }));
            setAllSales(allSalesData);
          });
        }

        const now = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Baghdad",
        });
        const currentMonth = new Date(now).getMonth();
        const currentYear = new Date(now).getFullYear();

        const monthlySales = sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return (
            saleDate.getMonth() === currentMonth &&
            saleDate.getFullYear() === currentYear
          );
        });

        let total = monthlySales.reduce(
          (sum, sale) => sum + (sale.totalPrice || 0),
          0
        );
        setTotalSales(total);

        const productSales = {};
        monthlySales.forEach((sale) => {
          sale.items.forEach((item) => {
            productSales[item.name] =
              (productSales[item.name] || 0) + (item.quantity || 1);
          });
        });
        const bestProduct = Object.keys(productSales).reduce(
          (a, b) => (productSales[a] > productSales[b] ? a : b),
          null
        );
        setTopProduct(bestProduct);

        const customerFrequency = {};
        monthlySales.forEach((sale) => {
          customerFrequency[sale.customerName] =
            (customerFrequency[sale.customerName] || 0) + 1;
        });
        const bestCustomer = Object.keys(customerFrequency).reduce(
          (a, b) => (customerFrequency[a] > customerFrequency[b] ? a : b),
          null
        );
        setTopCustomer(bestCustomer);
      },
      (error) => {
        console.error("Error fetching sales:", error);
      }
    );

    return () => {
      unsubscribeTarget();
      unsubscribe();
    };
  }, [selectedSeller, role, setMonthlyTargetPrices]);

  const data = [
    { name: "Sales", value: totalSales },
    { name: "Remaining", value: Math.max(0, targetPrice - totalSales) },
  ];
  const COLORS = ["#3C50E0", "#e74c3c"];

  // Dashboard Analytics Functions
  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : Math.round(price);

  const formatCurrency = (amount) => {
    const value = priceDisplay(amount);
    // Add commas to numbers
    const formattedValue = Number(value).toLocaleString();
    return `${formattedValue} ${currency}`;
  };

  const formatNumber = (num) => {
    return Number(num).toLocaleString();
  };

  // Calculate member ranking and motivational data
  const calculateMemberProgress = () => {
    if (!allSales.length || !auth.currentUser) return null;

    const currentUser = auth.currentUser;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get current user's sales
    const userSales = allSales.filter(sale => sale.userId === currentUser.uid);
    
    // Current month sales for current user
    const currentMonthUserSales = userSales.filter(sale => 
      sale.date.getMonth() === currentMonth && 
      sale.date.getFullYear() === currentYear
    );
    const currentMonthTotal = currentMonthUserSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);

    // Previous month sales for current user
    const previousMonthUserSales = userSales.filter(sale => 
      sale.date.getMonth() === previousMonth && 
      sale.date.getFullYear() === previousMonthYear
    );
    const previousMonthTotal = previousMonthUserSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);

    // Calculate all users' current month performance for ranking
    const allUsersPerformance = sellers.map(seller => {
      const sellerSales = allSales.filter(sale => 
        sale.userId === seller.id && 
        sale.date.getMonth() === currentMonth && 
        sale.date.getFullYear() === currentYear
      );
      const total = sellerSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
      return {
        id: seller.id,
        name: seller.name,
        total: total,
        salesCount: sellerSales.length
      };
    }).filter(user => user.total > 0).sort((a, b) => b.total - a.total);

    // Find current user's rank
    const userRank = allUsersPerformance.findIndex(user => user.id === currentUser.uid) + 1;
    
    // Calculate sales streak (consecutive days with sales)
    const last30Days = Array.from({length: 30}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();
    
    let streak = 0;
    for (let i = last30Days.length - 1; i >= 0; i--) {
      const dayStr = last30Days[i].toDateString();
      const hasSalesOnDay = currentMonthUserSales.some(sale => 
        new Date(sale.date).toDateString() === dayStr
      );
      if (hasSalesOnDay) {
        streak++;
      } else {
        break;
      }
    }

    // Find best sales day
    const dailySales = {};
    currentMonthUserSales.forEach(sale => {
      const dayKey = new Date(sale.date).toDateString();
      dailySales[dayKey] = (dailySales[dayKey] || 0) + (sale.totalPrice || 0);
    });
    
    const bestDay = Object.keys(dailySales).reduce((best, day) => 
      dailySales[day] > (dailySales[best] || 0) ? day : best, null
    );

    // Calculate achievements
    const achievements = [];
    const targetProgress = (currentMonthTotal / targetPrice) * 100;
    
    if (targetProgress >= 100) achievements.push({ icon: '🏆', text: translations[language].champion });
    else if (targetProgress >= 80) achievements.push({ icon: '⭐', text: translations[language].almostThere });
    else if (targetProgress >= 50) achievements.push({ icon: '🚀', text: translations[language].keepGoing });
    
    if (streak >= 7) achievements.push({ icon: '🔥', text: `${streak} ${translations[language].salesStreak}` });
    if (userRank === 1 && allUsersPerformance.length > 1) achievements.push({ icon: '👑', text: translations[language].superstar });
    if (currentMonthTotal > previousMonthTotal && previousMonthTotal > 0) {
      const growthPercent = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
      achievements.push({ icon: '📈', text: `+${growthPercent.toFixed(1)}% ${translations[language].improvement}` });
    }

    return {
      currentMonthTotal,
      previousMonthTotal,
      userRank,
      totalUsers: allUsersPerformance.length,
      targetProgress,
      streak,
      bestDay: bestDay ? { date: bestDay, amount: dailySales[bestDay] } : null,
      achievements,
      leaderboard: allUsersPerformance.slice(0, 5), // Top 5
      monthlyGrowth: previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0,
      daysActive: Object.keys(dailySales).length,
      avgPerDay: Object.keys(dailySales).length > 0 ? currentMonthTotal / Object.keys(dailySales).length : 0
    };
  };

  // Calculate dashboard analytics for admin
  const calculateDashboardAnalytics = () => {
    if (!allSales.length) return null;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter sales based on user role
    const relevantSales = role === "admin" ? allSales : allSales.filter(sale => sale.userId === auth.currentUser?.uid);

    // Current month sales
    const currentMonthSales = relevantSales.filter(sale => 
      sale.date.getMonth() === currentMonth && 
      sale.date.getFullYear() === currentYear
    );

    // Previous month sales
    const previousMonthSales = relevantSales.filter(sale => 
      sale.date.getMonth() === previousMonth && 
      sale.date.getFullYear() === previousMonthYear
    );

    // Calculate totals
    const currentMonthTotal = currentMonthSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    const previousMonthTotal = previousMonthSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    const totalRevenue = relevantSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    
    // Calculate growth
    const monthlyGrowth = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;

    // Monthly data for the selected year
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const monthSales = relevantSales.filter(sale => 
        sale.date.getMonth() === index && 
        sale.date.getFullYear() === selectedYear
      );
      const total = monthSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
      return {
        month: new Date(selectedYear, index).toLocaleDateString(language, { month: 'short' }),
        value: total,
        sales: monthSales.length
      };
    });

    // User sales data (only for admin)
    const userSalesData = role === "admin" ? sellers.map(user => {
      const userSales = allSales.filter(sale => sale.userId === user.id);
      const total = userSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
      return {
        name: user.name,
        total: total,
        sales: userSales.length,
      };
    }).filter(user => user.total > 0) : [];

    // Top performer (only for admin)
    const topPerformer = role === "admin" ? userSalesData.reduce((top, user) => 
      user.total > top.total ? user : top, 
      { total: 0, name: "N/A" }
    ) : { total: 0, name: "N/A" };

    return {
      currentMonthTotal,
      previousMonthTotal,
      totalRevenue,
      monthlyGrowth,
      monthlyData,
      userSalesData,
      topPerformer,
      totalUsers: sellers.length,
      averagePerUser: sellers.length > 0 ? totalRevenue / sellers.length : 0
    };
  };

  const dashboardAnalytics = calculateDashboardAnalytics();
  const memberProgress = calculateMemberProgress();

  // Updated dailySales to match the same month as totalSales
  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Baghdad" });
  const currentMonthIndex = new Date(now).getMonth();
  const currentYear = new Date(now).getFullYear();
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const dailySales = Array.from({ length: daysInMonth }, (_, day) => ({
    day: `Day ${day + 1}`,
    total: salesData
      .filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
          saleDate.getDate() === day + 1 &&
          saleDate.getMonth() === currentMonthIndex &&
          saleDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, sale) => sum + (sale.totalPrice || 0), 0),
  }));

  const handleExportPDF = () => {
    const input = document.getElementById("sales-summary-container");
    html2canvas(input, {
      scale: 2,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;

      pdf.addImage(
        imgData,
        "PNG",
        (pdfWidth - imgWidth) / 2,
        10,
        imgWidth,
        imgHeight
      );
      pdf.save("sales_summary.pdf");
    });
  };

  const handleExportExcel = () => {
    const excelData = salesData.map((sale) => ({
      Customer: sale.customerName,
      Date: sale.date,
      Total: sale.totalPrice,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
    XLSX.writeFile(wb, "sales_summary.xlsx");
  };

  return (
    <div className="sales-summary-wrapper">
      <div
        id="sales-summary-container"
        className="sales-summary-container"
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#2c3e50",
          }}
        >
          {translations[language].salesSummary}
          {role === "admin" && selectedSeller
            ? ` - ${
                sellers.find((s) => s.id === selectedSeller)?.name || "Unnamed"
              }`
            : ""}
        </h2>

        <p style={{ marginBottom: "10px", fontSize: "16px" }}>
          <strong>{translations[language].currentDate}</strong> {currentDate}
        </p>

        {/* Member Ranking and Progress Section */}
        {memberProgress && role !== "admin" && (
          <div className="ios-glassy-container" style={{ marginBottom: "20px" }}>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              color: "var(--dark)",
              textAlign: "center"
            }}>
              🏆 {translations[language].myRanking}
            </h3>
            
            {/* Ranking Card */}
            <div className="ios-card" style={{
              background: "linear-gradient(135deg, rgba(60, 80, 224, 0.1), rgba(147, 51, 234, 0.1))",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: memberProgress.userRank <= 3 ? "#f59e0b" : "var(--primary)"
                  }}>
                    #{memberProgress.userRank}
                  </div>
                  <div style={{ color: "var(--body)", fontSize: "0.9rem" }}>
                    {translations[language].position} {memberProgress.userRank} {translations[language].outOf} {memberProgress.totalUsers}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "var(--primary)"
                  }}>
                    {formatCurrency(memberProgress.currentMonthTotal)}
                  </div>
                  <div style={{ color: "var(--body)", fontSize: "0.9rem" }}>
                    {translations[language].salesThisMonth}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Comparison */}
            <div className="ios-grid ios-grid-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
              <div className="ios-card">
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: memberProgress.monthlyGrowth >= 0 ? "var(--success)" : "var(--danger)",
                    marginBottom: "0.5rem"
                  }}>
                    {memberProgress.monthlyGrowth >= 0 ? "+" : ""}{memberProgress.monthlyGrowth.toFixed(1)}%
                  </div>
                  <div style={{ color: "var(--body)", fontSize: "0.85rem" }}>
                    {translations[language].lastMonthComparison}
                  </div>
                  <div style={{ color: "var(--body)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    {translations[language].salesLastMonth}: {formatCurrency(memberProgress.previousMonthTotal)}
                  </div>
                </div>
              </div>
              
              <div className="ios-card">
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "var(--primary)",
                    marginBottom: "0.5rem"
                  }}>
                    {memberProgress.targetProgress.toFixed(0)}%
                  </div>
                  <div style={{ color: "var(--body)", fontSize: "0.85rem" }}>
                    {translations[language].targetProgress}
                  </div>
                  <div style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(60, 80, 224, 0.1)",
                    borderRadius: "3px",
                    marginTop: "0.5rem",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${Math.min(memberProgress.targetProgress, 100)}%`,
                      height: "100%",
                      background: memberProgress.targetProgress >= 100 
                        ? "linear-gradient(90deg, #10b981, #059669)" 
                        : "linear-gradient(90deg, #3c50e0, #9333ea)",
                      transition: "width 0.5s ease"
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="ios-grid ios-grid-3" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="ios-card" style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--primary)" }}>
                  {memberProgress.daysActive}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--body)" }}>
                  {translations[language].daysActive}
                </div>
              </div>
              
              <div className="ios-card" style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--primary)" }}>
                  {formatCurrency(memberProgress.avgPerDay)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--body)" }}>
                  {translations[language].avgPerDay}
                </div>
              </div>
              
              <div className="ios-card" style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--primary)" }}>
                  {memberProgress.streak}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--body)" }}>
                  {translations[language].salesStreak}
                </div>
              </div>
            </div>

            {/* Achievements */}
            {memberProgress.achievements.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  color: "var(--dark)"
                }}>
                  🎖️ {translations[language].achievements}
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {memberProgress.achievements.map((achievement, index) => (
                    <div key={index} style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "var(--success)",
                      padding: "0.5rem 1rem",
                      borderRadius: "20px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}>
                      <span>{achievement.icon}</span>
                      <span>{achievement.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Day */}
            {memberProgress.bestDay && (
              <div className="ios-card" style={{
                background: "rgba(251, 191, 36, 0.1)",
                borderRadius: "12px",
                padding: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--dark)", marginBottom: "0.25rem" }}>
                      🎆 {translations[language].bestDay}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--body)" }}>
                      {new Date(memberProgress.bestDay.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#f59e0b"
                  }}>
                    {formatCurrency(memberProgress.bestDay.amount)}
                  </div>
                </div>
              </div>
            )}

            {/* Team Leaderboard */}
            {memberProgress.leaderboard.length > 1 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "var(--dark)"
                }}>
                  🏅 {translations[language].teamLeaderboard}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {memberProgress.leaderboard.map((member, index) => (
                    <div key={member.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      background: member.id === auth.currentUser?.uid 
                        ? "rgba(60, 80, 224, 0.1)" 
                        : "rgba(255, 255, 255, 0.5)",
                      borderRadius: "12px",
                      border: member.id === auth.currentUser?.uid 
                        ? "2px solid var(--primary)" 
                        : "1px solid rgba(0, 0, 0, 0.05)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: index === 0 ? "#f59e0b" : index === 1 ? "#6b7280" : index === 2 ? "#d97706" : "var(--primary)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "600"
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "var(--dark)" }}>
                            {member.name} {member.id === auth.currentUser?.uid && "(You)"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--body)" }}>
                            {member.salesCount} sales
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontWeight: "600",
                        color: "var(--primary)",
                        fontSize: "0.9rem"
                      }}>
                        {formatCurrency(member.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {role === "admin" && (
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="seller-select" style={{ marginRight: "10px" }}>
              {translations[language].selectSeller}
            </label>
            <select
              id="seller-select"
              value={selectedSeller || ""}
              onChange={(e) => setSelectedSeller(e.target.value || null)}
              style={{ padding: "5px", borderRadius: "5px" }}
            >
              <option value="">
                {translations[language].salesSummary} (All)
              </option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name || "Unnamed"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dashboard Analytics for All Users */}
        {dashboardAnalytics && (
          <>
            {/* Key Metrics */}
            <div className="analytics-metrics-section">
              <h3 className="analytics-section-title">{translations[language].monthlyPerformance}</h3>
              <div className="analytics-metrics-grid">
                <div className="analytics-metric-card">
                  <div className="analytics-metric-icon">💰</div>
                  <div className="analytics-metric-content">
                    <h4>{translations[language].totalRevenue}</h4>
                    <p className="analytics-metric-value">{formatCurrency(dashboardAnalytics.totalRevenue)}</p>
                  </div>
                </div>
                <div className="analytics-metric-card">
                  <div className="analytics-metric-icon">📈</div>
                  <div className="analytics-metric-content">
                    <h4>{translations[language].currentMonth}</h4>
                    <p className="analytics-metric-value">{formatCurrency(dashboardAnalytics.currentMonthTotal)}</p>
                  </div>
                </div>
                {/* Monthly Growth - Only for Admin */}
                {role === "admin" && (
                  <div className="analytics-metric-card">
                    <div className="analytics-metric-icon">{dashboardAnalytics.monthlyGrowth >= 0 ? '📊' : '📉'}</div>
                    <div className="analytics-metric-content">
                      <h4>{translations[language].monthlyGrowth}</h4>
                      <p className={`analytics-metric-value ${dashboardAnalytics.monthlyGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {dashboardAnalytics.monthlyGrowth >= 0 ? '+' : ''}{dashboardAnalytics.monthlyGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
                {/* Total Users - Only for Admin */}
                {role === "admin" && (
                  <div className="analytics-metric-card">
                    <div className="analytics-metric-icon">👥</div>
                    <div className="analytics-metric-content">
                      <h4>{translations[language].totalUsers}</h4>
                      <p className="analytics-metric-value">{formatNumber(dashboardAnalytics.totalUsers)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Comparison - Only for Admin */}
            {role === "admin" && (
              <div className="analytics-comparison-section">
                <h3 className="analytics-section-title">Month to Month Comparison</h3>
                <div className="analytics-comparison-content">
                  <div className="analytics-comparison-item">
                    <div className="analytics-comparison-label">{translations[language].currentMonth}</div>
                    <div className="analytics-comparison-value current">{formatCurrency(dashboardAnalytics.currentMonthTotal)}</div>
                  </div>
                  <div className="analytics-comparison-vs">VS</div>
                  <div className="analytics-comparison-item">
                    <div className="analytics-comparison-label">{translations[language].previousMonth}</div>
                    <div className="analytics-comparison-value previous">{formatCurrency(dashboardAnalytics.previousMonthTotal)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="analytics-charts-section">
              {/* Year Selector */}
              <div className="analytics-year-selector-container">
                <label>{translations[language].thisYear}: </label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="analytics-year-select"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              {/* Monthly Performance Chart */}
              <h3 className="analytics-section-title">{role === "admin" ? `${translations[language].monthlyPerformance} - ${selectedYear}` : `My ${translations[language].monthlyPerformance} - ${selectedYear}`}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardAnalytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 122, 137, 0.3)" />
                  <XAxis dataKey="month" stroke="#67748e" />
                  <YAxis stroke="#67748e" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [formatCurrency(value), translations[language].totalSales]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3C50E0" 
                    radius={[4, 4, 0, 0]}
                    name={translations[language].totalSales}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Performance Table - Only for Admin */}
            {role === "admin" && dashboardAnalytics.topPerformer.name !== "N/A" && (
              <div className="analytics-user-performance-section">
                <h3 className="analytics-section-title">{translations[language].userComparison}</h3>
                <div className="analytics-top-performer-banner">
                  <span className="analytics-trophy">🏆</span>
                  <span>{translations[language].topPerformer}: {dashboardAnalytics.topPerformer.name}</span>
                  <span className="analytics-top-amount">{formatCurrency(dashboardAnalytics.topPerformer.total)}</span>
                </div>
                <div className="analytics-performance-table-container">
                  <table className="analytics-performance-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>{translations[language].totalSales}</th>
                        <th>Sales Count</th>
                        <th>Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardAnalytics.userSalesData
                        .sort((a, b) => b.total - a.total)
                        .map((user, index) => (
                        <tr key={user.name} className={index === 0 ? 'analytics-top-performer-row' : ''}>
                          <td>
                            <div className="analytics-user-cell">
                              <div className="analytics-user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="analytics-user-name">{user.name}</span>
                            </div>
                          </td>
                          <td className="analytics-amount-cell">{formatCurrency(user.total)}</td>
                          <td>{formatNumber(user.sales)}</td>
                          <td>{formatCurrency(user.sales > 0 ? user.total / user.sales : 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <p style={{ marginBottom: "10px", fontSize: "16px" }}>
          <strong>{translations[language].target}:</strong> {formatNumber(targetPrice)}{" "}
          {currency}
        </p>
        <p style={{ marginBottom: "20px", fontSize: "16px" }}>
          <strong>{translations[language].totalSales}:</strong> {formatNumber(totalSales)}{" "}
          {currency}
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              fill="#8884d8"
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <p
          style={{
            marginTop: "30px",
            marginBottom: "20px",
            fontSize: "16px",
            color: totalSales >= targetPrice ? "#27ae60" : "#c0392b",
          }}
        >
          {totalSales >= targetPrice
            ? translations[language].congratsMessage
            : translations[language].tryAgainMessage}
        </p>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            margin: "20px 0 10px",
            color: "#2c3e50",
          }}
        >
          {translations[language].monthlyTrends}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#riju" />
            <XAxis dataKey="day" stroke="#7f8c8d" />
            <YAxis stroke="#7f8c8d" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#34495e",
                color: "#ecf0f1",
                borderRadius: "5px",
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3498db"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3498db" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ margin: "10px 0", fontSize: "16px" }}>
          <strong>{translations[language].bestSellingProduct}</strong>{" "}
          {topProduct || "N/A"}
        </p>
        <p style={{ marginBottom: "20px", fontSize: "16px" }}>
          <strong>{translations[language].mostFrequentCustomer}</strong>{" "}
          {topCustomer || "N/A"}
        </p>
        <div className="export-buttons">
          <button
            onClick={handleExportPDF}
            className="ios-button"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              color: "var(--white)",
              border: "none",
              borderRadius: "12px",
              padding: "0.875rem 1.5rem",
              fontWeight: "600",
              fontSize: "0.95rem",
              minWidth: "140px"
            }}
          >
            {translations[language].exportAsPDF}
          </button>
          <button
            onClick={handleExportExcel}
            className="ios-button ios-button-success"
            style={{
              minWidth: "140px"
            }}
          >
            {translations[language].exportAsExcel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;
