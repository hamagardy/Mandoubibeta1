import React, { useState, useEffect, useContext } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { LanguageContext } from "./LanguageContext";
import { useSeller } from "./SellerContext";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const translations = {
  en: {
    salesReports: "Sales Reports",
    allCustomers: "All Customers",
    allMonths: "All Months",
    allDays: "All Days",
    exportAsPDF: "Export as PDF",
    exportAsExcel: "Export as Excel",
    noSalesFound: "No sales found for the selected filters.",
  },
  ar: {
    salesReports: "تقارير المبيعات",
    allCustomers: "جميع العملاء",
    allMonths: "جميع الأشهر",
    allDays: "جميع الأيام",
    exportAsPDF: "تصدير كـ PDF",
    exportAsExcel: "تصدير كـ Excel",
    noSalesFound: "لا توجد مبيعات تم العثور عليها للتصفيات المحددة.",
  },
  ku: {
    salesReports: "راپۆرتەکانی فرۆشتن",
    allCustomers: "هەموو کڕیاران",
    allMonths: "هەموو مانگەکان",
    allDays: "هەموو ڕۆژەکان",
    exportAsPDF: "پەیوەندیدانی بە PDF",
    exportAsExcel: "پەیوەندیدانی بە Excel",
    noSalesFound: "هیچ فرۆشتنێک نەدۆزراوەتەوە بۆ ئەو پاڵاوتنانەی هەڵبژێردراون.",
  },
};

const SalesReports = ({ currency, exchangeRate, role }) => {
  const [sales, setSales] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedDay, setSelectedDay] = useState(-1);
  const [selectedMonth, setSelectedMonth] = useState(-1);
  const { language } = useContext(LanguageContext);
  const { selectedSeller } = useSeller();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const salesRef = collection(db, "sales");
    let q =
      role === "admin" && selectedSeller
        ? query(salesRef, where("userId", "==", selectedSeller))
        : query(salesRef, where("userId", "==", currentUser.uid));

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

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const saleDay = saleDate.getDate();
    const saleMonth = saleDate.getMonth();
    return (
      (selectedCustomer ? sale.customerName === selectedCustomer : true) &&
      (selectedDay === -1 || saleDay === selectedDay) &&
      (selectedMonth === -1 || saleMonth === selectedMonth)
    );
  });

  const uniqueCustomers = [...new Set(sales.map((sale) => sale.customerName))];
  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPosition = 10;
    doc.text(translations[language].salesReports, 10, yPosition);
    yPosition += 10;

    filteredSales.forEach((sale) => {
      doc.text(`Customer: ${sale.customerName}`, 10, yPosition);
      doc.text(
        `Total: ${priceDisplay(sale.totalPrice)} ${currency}`,
        10,
        yPosition + 5
      );
      doc.text(
        `Date: ${new Date(sale.date).toLocaleString()}`,
        10,
        yPosition + 10
      );
      yPosition += 20;
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 10;
      }
    });

    doc.save("sales_report.pdf");
  };

  const handleExportExcel = () => {
    const salesData = filteredSales.map((sale) => ({
      Customer: sale.customerName,
      Total: priceDisplay(sale.totalPrice),
      Date: new Date(sale.date).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(salesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, "sales_report.xlsx");
  };

  return (
    <div className="container">
      <h2
        style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}
      >
        {translations[language].salesReports}
      </h2>
      <div className="filters">
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
        >
          <option value="">{translations[language].allCustomers}</option>
          {uniqueCustomers.map((customer) => (
            <option key={customer} value={customer}>
              {customer}
            </option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          <option value={-1}>{translations[language].allMonths}</option>
          {monthsOfYear.map((month, index) => (
            <option key={index} value={index}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(Number(e.target.value))}
        >
          <option value={-1}>{translations[language].allDays}</option>
          {daysOfMonth.map((day) => (
            <option key={day} value={day}>
              Day {day}
            </option>
          ))}
        </select>
      </div>
      <div className="sales-reports-container">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <div key={sale.id} className="sales-report-card">
              <h3>{sale.customerName}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total</td>
                    <td>
                      {priceDisplay(sale.totalPrice)} {currency}
                    </td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>{new Date(sale.date).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Items</td>
                    <td>
                      {sale.items
                        .map((item) => `${item.name} (x${item.quantity})`)
                        .join(", ")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#67748e" }}>
            {translations[language].noSalesFound}
          </p>
        )}
      </div>
      <div className="export-buttons">
        <button onClick={handleExportPDF}>
          {translations[language].exportAsPDF}
        </button>
        <button onClick={handleExportExcel}>
          {translations[language].exportAsExcel}
        </button>
      </div>
    </div>
  );
};

export default SalesReports;
