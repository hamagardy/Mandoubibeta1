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
      <form onSubmit={handleSubmit} className="card">
        <h2 className="text-xl font-semibold mb-6">
          {translations[language].saveSale}
        </h2>
        <div className="relative mb-4">
          <label className="block mb-2 font-medium">
            {translations[language].customerName}
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={translations[language].customerName}
            required
          />
          {showSuggestions && (
            <div className="absolute mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredCustomers.map((customer, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  {customer}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {translations[language].selectItem}
          </label>
          <select
            onChange={(e) =>
              e.target.value && addItemToSale(JSON.parse(e.target.value))
            }
            value={selectedItem ? JSON.stringify(selectedItem) : ""}
          >
            <option value="">{translations[language].selectItem}</option>
            {items.map((item) => (
              <option key={item.id} value={JSON.stringify(item)}>
                {item.name} - {priceDisplay(item.price)} {currency}{" "}
                {item.verified
                  ? `(${translations[language].verified})`
                  : `(${translations[language].notVerified})`}
              </option>
            ))}
          </select>
        </div>
        <ul className="mb-4 sale-items-list">
          {saleItems.map((item) => (
            <li
              key={item.id}
              className="sale-item flex items-center justify-between p-2 border-b"
            >
              <div className="flex items-center">
                <span className="font-medium mr-2">{item.name}</span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    item.verified
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {item.verified
                    ? translations[language].verified
                    : translations[language].notVerified}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, e.target.value)}
                  min="1"
                  className="quantity-input w-16"
                />
                <span>
                  x {priceDisplay(item.price)} ={" "}
                  {priceDisplay(item.quantity * item.price)} {currency}
                </span>
                <label className="bonus-label">
                  Bonus:
                  <input
                    type="number"
                    value={item.bonus || ""}
                    onChange={(e) => updateBonus(item.id, e.target.value)}
                    min="0"
                    step="0.01"
                    className="bonus-input w-16"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItemFromSale(item.id)}
                  className="remove-btn text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mb-4 text-lg font-semibold">
          {translations[language].total}: {totalDisplay()} {currency}
        </p>
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {translations[language].saleDate}
          </label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {translations[language].note}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={translations[language].note}
            rows="3"
          />
          {selectedBrochureItems.length > 0 && (
            <p className="brochure-note mt-2 text-sm text-[#67748e]">
              <strong>Brochure Items:</strong>{" "}
              {selectedBrochureItems.map((item) => item.name).join(", ")}
            </p>
          )}
        </div>
        <button type="submit" className="w-full">
          {translations[language].saveSale}
        </button>
      </form>
    </div>
  );
};

export default DailySalesEntry;
