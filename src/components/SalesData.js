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
} from "firebase/firestore";

const SalesData = ({ currency, exchangeRate, role }) => {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
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
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    if (
      lastPasswordTime &&
      currentTime - parseInt(lastPasswordTime) < twoHoursInMs
    ) {
      return true; // Password still valid
    }

    const password = prompt(`Please enter the password for ${type}:`);
    if (password === "yaseen") {
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

    const saleRef = doc(db, "sales", saleId);
    try {
      await updateDoc(saleRef, { items: updatedItems });
      // Sales state will update automatically via onSnapshot
    } catch (error) {
      console.error("Error updating bonus:", error);
    }
  };

  return (
    <div className="container">
      <h2
        style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}
      >
        Sales Data
      </h2>
      <div className="filters">
        <input
          type="text"
          placeholder="Search by customer name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          <option value="">All Days</option>
          {[...Array(31)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{`Day ${i + 1}`}</option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{`Month ${i + 1}`}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
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
            <div key={sale.id} className="sales-data-card">
              <div
                className={`status-circle ${
                  sale.status === "visited" ? "visited" : "not-visited"
                }`}
              ></div>
              <h3>{sale.customerName}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Bonus</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(sale.items) &&
                    sale.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>
                          {priceDisplay(item.price)} {currency}
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          <input
                            type="number"
                            value={item.bonus || 0}
                            onChange={(e) =>
                              handleBonusChange(sale.id, i, e.target.value)
                            }
                            style={{ width: "60px", padding: "2px" }}
                          />
                        </td>
                        <td>
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
              <select
                value={sale.status || "not-visited"}
                onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                style={{ marginTop: "0.75rem" }}
              >
                <option value="not-visited">Not Visited</option>
                <option value="visited">Visited</option>
              </select>
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
