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
  const { selectedSeller, setSelectedSeller } = useSeller();
  const [currentDate, setCurrentDate] = useState("");
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
        }));
        setSalesData(sales);

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
  const COLORS = ["#1abc9c", "#e74c3c"];

  const dailySales = Array.from({ length: 31 }, (_, day) => ({
    day: `Day ${day + 1}`,
    total: salesData
      .filter((sale) => new Date(sale.date).getDate() === day + 1)
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#ecf0f1",
        padding: "20px",
      }}
    >
      <div
        id="sales-summary-container"
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
        }}
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
                sellers.find((s) => s.id === selectedSeller)?.email || "Unknown"
              }`
            : ""}
        </h2>

        <p style={{ marginBottom: "10px", fontSize: "16px" }}>
          <strong>{translations[language].currentDate}</strong> {currentDate}
        </p>

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
                  {seller.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <p style={{ marginBottom: "10px", fontSize: "16px" }}>
          <strong>{translations[language].target}:</strong> {targetPrice}{" "}
          {currency}
        </p>
        <p style={{ marginBottom: "20px", fontSize: "16px" }}>
          <strong>{translations[language].totalSales}:</strong> {totalSales}{" "}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#bdc3c7" />
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
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            onClick={handleExportPDF}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#2980b9")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#3498db")}
          >
            {translations[language].exportAsPDF}
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              padding: "10px 20px",
              backgroundColor: "#27ae60",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#219653")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#27ae60")}
          >
            {translations[language].exportAsExcel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;
