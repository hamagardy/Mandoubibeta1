import React, { useState, useEffect, useContext } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LanguageContext } from "./LanguageContext";
import { useSeller } from "./SellerContext";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const EXCEL_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

const translations = {
  en: {
    salesForecasting: "Sales Forecasting",
    month: "Month",
    forecastedSales: "Forecasted Sales",
    totalForecastedSales: "Total Forecasted Sales (12 months)",
    exportAsPDF: "Export as PDF",
    exportAsExcel: "Export as Excel",
    noSalesData: "No sales data available for forecasting.",
  },
  ar: {
    salesForecasting: "توقعات المبيعات",
    month: "الشهر",
    forecastedSales: "المبيعات المتوقعة",
    totalForecastedSales: "إجمالي المبيعات المتوقعة (12 شهرًا)",
    exportAsPDF: "تصدير كـ PDF",
    exportAsExcel: "تصدير كـ Excel",
    noSalesData: "لا توجد بيانات مبيعات متاحة للتنبؤ.",
  },
  ku: {
    salesForecasting: "پێشبینیکردنی فرۆشتن",
    month: "مانگ",
    forecastedSales: "فرۆشتنی پێشبینیکراو",
    totalForecastedSales: "کۆی فرۆشتنی پێشبینیکراو (12 مانگ)",
    exportAsPDF: "پەیوەندیدانی بە PDF",
    exportAsExcel: "پەیوەندیدانی بە Excel",
    noSalesData: "هیچ داتای فرۆشتنێک بۆ پێشبینیکردن بەردەست نیە.",
  },
};

const SalesForecasting = ({
  currency,
  exchangeRate,
  role,
  monthlyTargetPrices,
}) => {
  const [sales, setSales] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const { language } = useContext(LanguageContext);
  const { selectedSeller } = useSeller();
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const salesRef = collection(db, "sales");
    let q;
    if (role === "admin" && selectedSeller) {
      q = query(salesRef, where("userId", "==", selectedSeller));
    } else {
      q = query(salesRef, where("userId", "==", currentUser.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSales(salesData);
      },
      (error) => console.error("Error fetching sales:", error)
    );

    return () => unsubscribe();
  }, [selectedSeller, role]);

  useEffect(() => {
    if (sales.length > 0) {
      const allMonthsSales = calculateAllMonthsSales(sales);
      const forecast = generateSalesForecast(allMonthsSales);
      setForecastData(forecast);
    }
  }, [sales, language]);

  const calculateAllMonthsSales = (salesData) => {
    const months = Array(12).fill(0);
    salesData.forEach((sale) => {
      const saleMonth = new Date(sale.date).getMonth();
      months[saleMonth] += sale.totalPrice || 0;
    });
    return months;
  };

  const generateSalesForecast = (allMonthsSales) => {
    const forecast = [];
    let totalSales = 0;
    for (let i = 0; i < 12; i++) {
      totalSales += allMonthsSales[i];
      forecast.push({
        month: `${translations[language].month} ${i + 1}`,
        sales: allMonthsSales[i],
      });
    }
    forecast.push({
      month: translations[language].totalForecastedSales,
      sales: totalSales,
    });
    return forecast;
  };

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  const handleExportPDF = () => {
    const input = document.getElementById("forecast-container");

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
      pdf.save("sales_forecast.pdf");
    });
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      forecastData.map((data) => ({
        Month: data.month,
        "Forecasted Sales": priceDisplay(data.sales),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Forecast");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(data, "sales_forecast.xlsx");
  };

  // Updated chartData to reflect individual monthly targets
  const chartData = {
    labels: forecastData.slice(0, 12).map((data) => data.month),
    datasets: [
      {
        label: "Forecasted Sales",
        data: forecastData.slice(0, 12).map((data) => priceDisplay(data.sales)),
        backgroundColor: "#5e72e4",
        borderColor: "#485fe0",
        borderWidth: 1,
      },
      {
        label: "Target",
        data: forecastData
          .slice(0, 12)
          .map((_, index) =>
            priceDisplay(monthlyTargetPrices[index] || 13000000)
          ),
        backgroundColor: "rgba(94, 114, 228, 0.2)",
        borderColor: "#5e72e4",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: translations[language].salesForecasting },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `${translations[language].forecastedSales} (${currency})`,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <section className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {translations[language].salesForecasting}
      </h2>
      <div id="forecast-container" className="sales-forecast-container">
        {forecastData.length > 0 ? (
          <>
            <div className="card mb-6 chart-container">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="card sales-forecast-card mb-4">
              <h3 className="text-lg font-semibold text-[#1f2a44] mb-4">
                {translations[language].salesForecasting}
              </h3>
              <div className="forecast-items">
                {forecastData.slice(0, 12).map((data, index) => (
                  <div
                    key={index}
                    className={`forecast-item ${
                      index < 11 ? "border-b" : ""
                    } py-2`}
                  >
                    <div className="flex justify-between">
                      <span className="text-[#1f2a44] font-medium">
                        {data.month}
                      </span>
                      <span className="text-[#67748e]">
                        {translations[language].forecastedSales}:{" "}
                        <span className="font-bold text-[#5e72e4]">
                          {priceDisplay(data.sales)} {currency}
                        </span>
                      </span>
                    </div>
                    <p className="text-[#67748e] mt-1">
                      Target:{" "}
                      <span className="font-bold">
                        {priceDisplay(monthlyTargetPrices[index] || 13000000)}{" "}
                        {currency}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card sales-forecast-card">
              <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">
                {forecastData[12].month}
              </h3>
              <p className="text-[#67748e]">
                {translations[language].forecastedSales}:{" "}
                <span className="font-bold text-[#5e72e4]">
                  {priceDisplay(forecastData[12].sales)} {currency}
                </span>
              </p>
            </div>
          </>
        ) : (
          <p className="card">{translations[language].noSalesData}</p>
        )}
      </div>
      <div className="export-buttons mt-4">
        <button onClick={handleExportPDF}>
          {translations[language].exportAsPDF}
        </button>
        <button onClick={handleExportExcel}>
          {translations[language].exportAsExcel}
        </button>
      </div>
    </section>
  );
};

export default SalesForecasting;
