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
  getDocs,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const SalesData = ({ currency, exchangeRate, role, permissions }) => {
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState(""); // New: Search by item
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const { selectedSeller } = useSeller();
  const [exportLoading, setExportLoading] = useState({}); // New: Track loading state per sale

  // Fetch users if user has permission to view all sales data
  useEffect(() => {
    if (checkViewAllSalesDataPermission()) {
      const fetchUsers = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          const usersData = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            email: doc.data().email || "Unknown",
            name: doc.data().name || "Unnamed",
          }));
          setUsers(usersData);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [permissions, role]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const salesRef = collection(db, "sales");
    let q;
    
    // Check if user has permission to view all sales data
    if (role === "admin" && selectedSeller) {
      q = query(salesRef, where("userId", "==", selectedSeller));
    } else if (checkViewAllSalesDataPermission()) {
      // User with viewAllSalesData permission can see all sales or filter by selected user
      if (selectedUser) {
        q = query(salesRef, where("userId", "==", selectedUser));
      } else {
        q = query(salesRef); // Show all sales
      }
    } else {
      // Regular users without viewAllSalesData permission see only their own
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
  }, [selectedSeller, selectedUser, role, permissions]);

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const customerMatch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const itemMatch = itemSearchTerm === "" || 
      (Array.isArray(sale.items) && sale.items.some(item => 
        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
      ));
    
    return (
      customerMatch &&
      itemMatch &&
      (!selectedDay || saleDate.getDate() === Number(selectedDay)) &&
      (!selectedMonth || saleDate.getMonth() + 1 === Number(selectedMonth)) &&
      (!selectedYear || saleDate.getFullYear() === Number(selectedYear))
    );
  });

  // Function to get user name by userId
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.name || user.email) : "Unknown User";
  };

  const checkAdminAccess = () => {
    return role === "admin";
  };

  const checkViewAllSalesDataPermission = () => {
    return permissions?.viewAllSalesData || false;
  };

  const checkChangeVisitStatusPermission = () => {
    return permissions?.changeVisitStatus || false;
  };

  const checkChangePricePermission = () => {
    return permissions?.changePrice || false;
  };

  const checkChangeBonusPermission = () => {
    return permissions?.changeBonus || false;
  };

  const handleStatusChange = async (saleId, status) => {
    if (!checkChangeVisitStatusPermission()) return;

    const saleRef = doc(db, "sales", saleId);
    const newStatus = status === "visited" ? "visited" : "not-visited";
    try {
      await updateDoc(saleRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleBonusChange = async (saleId, itemIndex, newBonus) => {
    if (!checkChangeBonusPermission()) return;

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
    if (!checkChangePricePermission()) return;

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
    if (!checkChangePricePermission()) return;

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
    if (!checkAdminAccess()) return;

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
      <div className="ios-glassy-container">
        <h2 style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          color: "var(--dark)",
          textAlign: "center"
        }}>
          Sales Data
        </h2>
        
        <div className="ios-filters">
          <input
            className="ios-input"
            type="text"
            placeholder="Search by customer name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <input
            className="ios-input"
            type="text"
            placeholder="Search by item name"
            value={itemSearchTerm}
            onChange={(e) => setItemSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          {checkViewAllSalesDataPermission() && (
            <select
              className="ios-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          )}
          <select
            className="ios-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{ minWidth: "120px" }}
          >
            <option value="">All Days</option>
            {[...Array(31)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{`Day ${i + 1}`}</option>
            ))}
          </select>
          <select
            className="ios-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ minWidth: "120px" }}
          >
            <option value="">All Months</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{`Month ${i + 1}`}</option>
            ))}
          </select>
          <select
            className="ios-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ minWidth: "120px" }}
          >
            <option value="">All Years</option>
            {[...Array(5)].map((_, i) => (
              <option key={i} value={new Date().getFullYear() - 2 + i}>
                {new Date().getFullYear() - 2 + i}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="ios-grid ios-grid-1">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              id={`sale-card-${sale.id}`}
              className="ios-card"
              style={{ position: "relative" }}
            >
              <div
                className={`ios-status-circle ${
                  sale.status === "visited" ? "visited" : "not-visited"
                }`}
              ></div>
              
              <h3 style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "var(--dark)"
              }}>
                {sale.customerName}
              </h3>
              
              {/* Show user name if viewing all users' data */}
              {checkViewAllSalesDataPermission() && (
                <div style={{
                  fontSize: "0.875rem",
                  color: "var(--primary)",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  background: "rgba(60, 80, 224, 0.1)",
                  borderRadius: "8px",
                  display: "inline-block"
                }}>
                  Sales by: {getUserName(sale.userId)}
                </div>
              )}
              
              <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
                <table className="ios-table">
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
                          <td style={{ fontWeight: "500" }}>{item.name}</td>
                          <td>
                            <div className="ios-input-group">
                              <input
                                className="ios-input ios-input-small"
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  handlePriceChange(sale.id, i, e.target.value)
                                }
                                min="0"
                                step="0.01"
                                readOnly={!checkChangePricePermission()}
                                style={{
                                  background: !checkChangePricePermission() ? "rgba(0, 0, 0, 0.05)" : "inherit",
                                  cursor: !checkChangePricePermission() ? "not-allowed" : "text"
                                }}
                              />
                              <span style={{ fontSize: "0.875rem", color: "var(--body)" }}>{currency}</span>
                            </div>
                          </td>
                          <td>
                            <input
                              className="ios-input ios-input-small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(sale.id, i, e.target.value)
                              }
                              min="1"
                              readOnly={!checkChangePricePermission()}
                              style={{
                                background: !checkChangePricePermission() ? "rgba(0, 0, 0, 0.05)" : "inherit",
                                cursor: !checkChangePricePermission() ? "not-allowed" : "text"
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="ios-input ios-input-small"
                              type="number"
                              value={item.bonus || 0}
                              onChange={(e) =>
                                handleBonusChange(sale.id, i, e.target.value)
                              }
                              readOnly={!checkChangeBonusPermission()}
                              style={{
                                background: !checkChangeBonusPermission() ? "rgba(0, 0, 0, 0.05)" : "inherit",
                                cursor: !checkChangeBonusPermission() ? "not-allowed" : "text"
                              }}
                            />
                          </td>
                          <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                            {priceDisplay(item.quantity * item.price).toLocaleString()} {currency}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{
                background: "rgba(60, 80, 224, 0.05)",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem"
              }}>
                <div style={{
                  fontSize: "1.125rem",
                  fontWeight: "700",
                  color: "var(--primary)",
                  marginBottom: "0.5rem"
                }}>
                  Total: {priceDisplay(
                    sale.totalPrice ||
                      sale.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                  ).toLocaleString()} {currency}
                </div>
                <div style={{
                  fontSize: "0.875rem",
                  color: "var(--body)",
                  marginBottom: "0.25rem"
                }}>
                  Date: {new Date(sale.date).toLocaleString()}
                </div>
                {sale.note && (
                  <div style={{
                    fontSize: "0.875rem",
                    color: "var(--body)",
                    fontStyle: "italic"
                  }}>
                    Note: {sale.note}
                  </div>
                )}
              </div>
              
              <div className="ios-input-group" style={{ justifyContent: "space-between" }}>
                {checkChangeVisitStatusPermission() ? (
                  <select
                    className="ios-select"
                    value={sale.status || "not-visited"}
                    onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                    style={{ minWidth: "140px" }}
                  >
                    <option value="not-visited">Not Visited</option>
                    <option value="visited">Visited</option>
                  </select>
                ) : (
                  <div style={{
                    padding: "0.75rem 1rem",
                    background: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "12px",
                    color: "var(--body)",
                    fontSize: "0.875rem",
                    minWidth: "140px",
                    textAlign: "center"
                  }}>
                    {sale.status === "visited" ? "Visited" : "Not Visited"}
                  </div>
                )}
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {role === "admin" && (
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="ios-button ios-button-danger"
                      style={{
                        padding: "0.5rem",
                        fontSize: "1.2rem",
                        minWidth: "auto"
                      }}
                      title="Delete Sale"
                    >
                      🗑️
                    </button>
                  )}
                  <button
                    onClick={() => handleExportSalePDF(sale.id)}
                    disabled={exportLoading[sale.id]}
                    className={`ios-button ${exportLoading[sale.id] ? '' : 'ios-button-success'}`}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      opacity: exportLoading[sale.id] ? 0.6 : 1,
                      cursor: exportLoading[sale.id] ? "not-allowed" : "pointer"
                    }}
                  >
                    {exportLoading[sale.id] ? "Exporting..." : "Export PDF"}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="ios-card" style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{
              fontSize: "1.125rem",
              color: "var(--body)",
              fontWeight: "500"
            }}>
              No sales found for the selected filters.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesData;
