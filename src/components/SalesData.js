import React, { useState, useEffect } from "react";
import { useSeller } from "./SellerContext";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const SalesData = ({ currency, exchangeRate, role }) => {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const { selectedSeller } = useSeller();
  const [exportLoading, setExportLoading] = useState({}); // New: Track loading state per sale

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

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    return (
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedDay || saleDate.getDate() === Number(selectedDay)) &&
      (!selectedMonth || saleDate.getMonth() + 1 === Number(selectedMonth)) &&
      (!selectedYear || saleDate.getFullYear() === Number(selectedYear))
    );
  });

  const checkPasswordTimeout = (type) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const key = `${currentUser.uid}_${type}_lastPasswordTime`;
    const lastPasswordTime = localStorage.getItem(key);
    const currentTime = Date.now();
    const timeout =
      type === "priceChange" ? 3 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

    if (
      lastPasswordTime &&
      currentTime - parseInt(lastPasswordTime) < timeout
    ) {
      return true;
    }

    const expectedPassword = type === "priceChange" ? "dashty" : "yaseen";
    const password = prompt(`Please enter the password for ${type}:`);
    if (password === expectedPassword) {
      localStorage.setItem(key, currentTime.toString());
      return true;
    } else {
      alert("Incorrect password!");
      return false;
    }
  };

  const handleStatusChange = async (saleId, status) => {
    if (!checkPasswordTimeout("statusChange")) return;

    const saleRef = doc(db, "sales", saleId);
    const newStatus = status === "visited" ? "visited" : "not-visited";
    try {
      await updateDoc(saleRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleBonusChange = async (saleId, itemIndex, newBonus) => {
    if (!checkPasswordTimeout("bonusEdit")) return;

    const sale = sales.find((s) => s.id === saleId);
    if (!sale || !Array.isArray(sale.items)) return;

    const updatedItems = [...sale.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      bonus: Number(newBonus) || 0,
    };

    const newTotalPrice = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const saleRef = doc(db, "sales", saleId);
    try {
      await updateDoc(saleRef, {
        items: updatedItems,
        totalPrice: newTotalPrice,
      });
    } catch (error) {
      console.error("Error updating bonus:", error);
    }
  };

  const handleQuantityChange = async (saleId, itemIndex, newQuantity) => {
    if (!checkPasswordTimeout("quantityEdit")) return;

    const sale = sales.find((s) => s.id === saleId);
    if (!sale || !Array.isArray(sale.items)) return;

    const updatedItems = [...sale.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: Number(newQuantity) || 1,
    };

    const newTotalPrice = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const saleRef = doc(db, "sales", saleId);
    try {
      await updateDoc(saleRef, {
        items: updatedItems,
        totalPrice: newTotalPrice,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handlePriceChange = async (saleId, itemIndex, newPrice) => {
    if (!checkPasswordTimeout("priceChange")) return;

    const sale = sales.find((s) => s.id === saleId);
    if (!sale || !Array.isArray(sale.items)) return;

    const updatedItems = [...sale.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      price: Number(newPrice) || 0,
    };

    const newTotalPrice = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const saleRef = doc(db, "sales", saleId);
    try {
      await updateDoc(saleRef, {
        items: updatedItems,
        totalPrice: newTotalPrice,
      });
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!checkPasswordTimeout("deleteSale")) return;

    if (!window.confirm("Are you sure you want to delete this sale?")) return;

    const saleRef = doc(db, "sales", saleId);
    try {
      await deleteDoc(saleRef);
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const handleExportSalePDF = async (saleId) => {
    setExportLoading((prev) => ({ ...prev, [saleId]: true }));
    const saleElement = document.getElementById(`sale-card-${saleId}`);
    if (!saleElement) {
      console.error("Sale card not found");
      setExportLoading((prev) => ({ ...prev, [saleId]: false }));
      return;
    }

    try {
      const canvas = await html2canvas(saleElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
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

      const sale = sales.find((s) => s.id === saleId);
      const fileName = `sale_${sale.customerName}_${
        new Date(sale.date).toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setExportLoading((prev) => ({ ...prev, [saleId]: false }));
    }
  };

  return (
    <div className="container">
      <h2
        style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}
      >
        Sales Data
      </h2>
      <div
        className="filters"
        style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}
      >
        <input
          type="text"
          placeholder="Search by customer name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px" }}
        />
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px" }}
        >
          <option value="">All Days</option>
          {[...Array(31)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{`Day ${i + 1}`}</option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px" }}
        >
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{`Month ${i + 1}`}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px" }}
        >
          <option value="">All Years</option>
          {[...Array(5)].map((_, i) => (
            <option key={i} value={new Date().getFullYear() - 2 + i}>
              {new Date().getFullYear() - 2 + i}
            </option>
          ))}
        </select>
      </div>
      <div className="sales-data-container">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              id={`sale-card-${sale.id}`}
              className="sales-data-card"
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
              }}
            >
              <div
                className={`status-circle ${
                  sale.status === "visited" ? "visited" : "not-visited"
                }`}
              ></div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                {sale.customerName}
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th style={{ padding: "8px" }}>Item</th>
                    <th style={{ padding: "8px" }}>Price</th>
                    <th style={{ padding: "8px" }}>Quantity</th>
                    <th style={{ padding: "8px" }}>Bonus</th>
                    <th style={{ padding: "8px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(sale.items) &&
                    sale.items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: "8px" }}>{item.name}</td>
                        <td style={{ padding: "8px" }}>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handlePriceChange(sale.id, i, e.target.value)
                            }
                            min="0"
                            step="0.01"
                            style={{ width: "80px", padding: "2px" }}
                          />
                          {` ${currency}`}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(sale.id, i, e.target.value)
                            }
                            min="1"
                            style={{ width: "60px", padding: "2px" }}
                          />
                        </td>
                        <td style={{ padding: "8px" }}>
                          <input
                            type="number"
                            value={item.bonus || 0}
                            onChange={(e) =>
                              handleBonusChange(sale.id, i, e.target.value)
                            }
                            style={{ width: "60px", padding: "2px" }}
                          />
                        </td>
                        <td style={{ padding: "8px" }}>
                          {priceDisplay(item.quantity * item.price)} {currency}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p style={{ marginTop: "0.75rem", fontWeight: 600 }}>
                Total:{" "}
                {priceDisplay(
                  sale.totalPrice ||
                    sale.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    )
                )}{" "}
                {currency}
              </p>
              <p style={{ fontSize: "0.9rem", color: "#67748e" }}>
                Date: {new Date(sale.date).toLocaleString()}
              </p>
              {sale.note && (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#67748e",
                    marginTop: "0.5rem",
                  }}
                >
                  Note: {sale.note}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "0.75rem",
                }}
              >
                <select
                  value={sale.status || "not-visited"}
                  onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                  style={{ padding: "4px", borderRadius: "4px" }}
                >
                  <option value="not-visited">Not Visited</option>
                  <option value="visited">Visited</option>
                </select>
                <button
                  onClick={() => handleDeleteSale(sale.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e74c3c",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                  }}
                  title="Delete Sale"
                >
                  🗑️
                </button>
                <button
                  onClick={() => handleExportSalePDF(sale.id)}
                  disabled={exportLoading[sale.id]}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: exportLoading[sale.id]
                      ? "#ccc"
                      : "#3498db",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: exportLoading[sale.id] ? "not-allowed" : "pointer",
                  }}
                >
                  {exportLoading[sale.id] ? "Exporting..." : "Export as PDF"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#67748e" }}>
            No sales found for the selected filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default SalesData;
