import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "./LanguageContext";
import { db, auth } from "../firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

const translations = {
  en: {
    customerName: "Customer Name",
    selectItem: "Select Item",
    total: "Total",
    saleDate: "Sale Date",
    note: "Note",
    saveSale: "Save Sale",
    verified: "Sticker ✅",
    notVerified: "Sticker ❌",
  },
  ar: {
    customerName: "اسم العميل",
    selectItem: "اختر العنصر",
    total: "المجموع",
    saleDate: "تاريخ البيع",
    note: "ملاحظة",
    saveSale: "حفظ البيع",
    verified: "ستیکر ✅",
    notVerified: "❌ ستیکر",
  },
  ku: {
    customerName: "ناوی کڕیار",
    selectItem: "هەڵبژاردنی بەرهەم",
    total: "کۆی گشتی",
    saleDate: "ڕێکەوتی فرۆشتن",
    note: "تێبینی",
    saveSale: "پاشکەوتکردنی فرۆشتن",
    verified: "ستیکەر ✅",
    notVerified: "ستیکەر ❌",
  },
};

const DailySalesEntry = ({
  currency,
  exchangeRate,
  selectedBrochureItems = [],
  setSelectedBrochureItems,
}) => {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [saleItems, setSaleItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saleDate, setSaleDate] = useState("");
  const [note, setNote] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", currentUser.uid)
    );
    const salesUnsubscribe = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const itemsUnsubscribe = onSnapshot(collection(db, "items"), (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      salesUnsubscribe();
      itemsUnsubscribe();
    };
  }, []);

  useEffect(() => {
    const uniqueCustomers = [
      ...new Set(sales.map((sale) => sale.customerName)),
    ];
    setFilteredCustomers(
      uniqueCustomers.filter((customer) =>
        customer.toLowerCase().includes(customerName.toLowerCase())
      )
    );
    setShowSuggestions(customerName.length > 0 && filteredCustomers.length > 0);
  }, [customerName, sales]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (customerName && saleItems.length > 0) {
      const totalPrice = saleItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const brochureNote = selectedBrochureItems.length
        ? `Brochure Items: ${selectedBrochureItems
            .map((item) => item.name)
            .join(", ")}`
        : "";
      const fullNote = note
        ? `${note}${brochureNote ? `\n${brochureNote}` : ""}`
        : brochureNote;

      await addDoc(collection(db, "sales"), {
        customerName,
        items: saleItems,
        totalPrice,
        date: saleDate || new Date().toISOString(),
        note: fullNote,
        userId: auth.currentUser.uid,
      });

      setCustomerName("");
      setSaleItems([]);
      setSelectedItem(null);
      setSaleDate("");
      setNote("");
      if (setSelectedBrochureItems) {
        setSelectedBrochureItems([]); // Clear after submission
      }
      navigate("/");
    }
  };

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer);
    setShowSuggestions(false);
  };

  const addItemToSale = (item) => {
    const existingItem = saleItems.find((i) => i.id === item.id);
    setSaleItems(
      existingItem
        ? saleItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...saleItems, { ...item, quantity: 1, bonus: 0 }]
    );
    setSelectedItem(null);
  };

  const updateQuantity = (itemId, qty) =>
    setSaleItems(
      saleItems.map((item) =>
        item.id === itemId ? { ...item, quantity: parseInt(qty) || 1 } : item
      )
    );

  const updateBonus = (itemId, bonus) =>
    setSaleItems(
      saleItems.map((item) =>
        item.id === itemId ? { ...item, bonus: parseFloat(bonus) || 0 } : item
      )
    );

  const removeItemFromSale = (itemId) =>
    setSaleItems(saleItems.filter((item) => item.id !== itemId));

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

  const totalDisplay = () =>
    currency === "USD"
      ? (
          saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0) /
          exchangeRate
        ).toFixed(2)
      : saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container">
      <div className="ios-glassy-container">
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          color: "var(--dark)",
          textAlign: "center"
        }}>
          {translations[language].saveSale}
        </h2>
        
        <form onSubmit={handleSubmit} className="ios-grid ios-grid-1">
          <div className="ios-form-group">
            <label className="ios-label">
              {translations[language].customerName}
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="ios-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder={translations[language].customerName}
                required
              />
              {showSuggestions && filteredCustomers.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {filteredCustomers.map((customer, index) => (
                    <div
                      key={index}
                      onClick={() => handleCustomerSelect(customer)}
                      style={{
                        padding: "0.75rem 1rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        borderBottom: index < filteredCustomers.length - 1 ? "1px solid rgba(0, 0, 0, 0.05)" : "none"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(60, 80, 224, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                      }}
                    >
                      {customer}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ios-form-group">
            <label className="ios-label">
              {translations[language].selectItem}
            </label>
            <select
              className="ios-select"
              onChange={(e) =>
                e.target.value && addItemToSale(JSON.parse(e.target.value))
              }
              value={selectedItem ? JSON.stringify(selectedItem) : ""}
            >
              <option value="">{translations[language].selectItem}</option>
              {items
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <option key={item.id} value={JSON.stringify(item)}>
                    {item.name} - {priceDisplay(item.price)} {currency}{" "}
                    {item.verified
                      ? `(${translations[language].verified})`
                      : `(${translations[language].notVerified})`}
                  </option>
                ))}
            </select>
          </div>

          {saleItems.length > 0 && (
            <div className="ios-form-group">
              <label className="ios-label">Selected Items</label>
              <div className="ios-grid ios-grid-1" style={{ gap: "1rem" }}>
                {saleItems.map((item) => (
                  <div key={item.id} className="ios-card">
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1rem"
                    }}>
                      <div>
                        <div style={{
                          fontWeight: "600",
                          color: "var(--dark)",
                          marginBottom: "0.25rem"
                        }}>
                          {item.name}
                        </div>
                        <span style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "8px",
                          background: item.verified
                            ? "rgba(33, 150, 83, 0.1)"
                            : "rgba(211, 64, 83, 0.1)",
                          color: item.verified
                            ? "var(--success)"
                            : "var(--danger)"
                        }}>
                          {item.verified
                            ? translations[language].verified
                            : translations[language].notVerified}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItemFromSale(item.id)}
                        className="ios-button ios-button-danger"
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.875rem",
                          minWidth: "auto",
                          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                          color: "white",
                          border: "none",
                          boxShadow: "0 4px 16px rgba(220, 38, 38, 0.3)"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="ios-input-group">
                      <div style={{ flex: 1 }}>
                        <label className="ios-label" style={{ marginBottom: "0.25rem" }}>
                          Quantity
                        </label>
                        <input
                          className="ios-input ios-input-small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, e.target.value)}
                          min="1"
                        />
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        color: "var(--body)"
                      }}>
                        x {priceDisplay(item.price)} = {priceDisplay(item.quantity * item.price)} {currency}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="ios-label" style={{ marginBottom: "0.25rem" }}>
                          Bonus
                        </label>
                        <input
                          className="ios-input ios-input-small"
                          type="number"
                          value={item.bonus || ""}
                          onChange={(e) => updateBonus(item.id, e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ios-card" style={{
            background: "rgba(60, 80, 224, 0.05)",
            border: "1px solid rgba(60, 80, 224, 0.1)"
          }}>
            <div style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "var(--primary)",
              textAlign: "center"
            }}>
              {translations[language].total}: {totalDisplay()} {currency}
            </div>
          </div>

          <div className="ios-form-group">
            <label className="ios-label">
              {translations[language].saleDate}
            </label>
            <input
              className="ios-input"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>

          <div className="ios-form-group">
            <label className="ios-label">
              {translations[language].note}
            </label>
            <textarea
              className="ios-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={translations[language].note}
              rows="3"
              style={{ resize: "vertical" }}
            />
            {selectedBrochureItems.length > 0 && (
              <div style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: "rgba(33, 150, 83, 0.05)",
                borderRadius: "8px",
                fontSize: "0.875rem",
                color: "var(--success)"
              }}>
                <strong>Brochure Items:</strong>{" "}
                {selectedBrochureItems.map((item) => item.name).join(", ")}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="ios-button ios-button-success" 
            style={{ 
              width: "100%",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              fontSize: "1rem",
              fontWeight: "600",
              padding: "1rem",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)"
            }}
          >
            {translations[language].saveSale}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DailySalesEntry;
