import React, { useState, useEffect, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const translations = {
  en: {
    title: "Products",
    select: "Select",
    verified: "✅",
    notVerified: "❌",
  },
  ar: { title: "المنتجات", select: "اختر", verified: "✅", notVerified: "❌" },
  ku: {
    title: "بەرهەمەکان",
    select: "ھەڵبژاردن",
    verified: "✅",
    notVerified: "❌",
  },
};

const Brochure = ({ setSelectedBrochureItems, selectedBrochureItems = [] }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "items"),
      (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsData);
      },
      (error) => {
        console.error("Error fetching items:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSelect = (item) => {
    const isSelected = selectedBrochureItems.some((i) => i.id === item.id);
    const updatedSelection = isSelected
      ? selectedBrochureItems.filter((i) => i.id !== item.id)
      : [...selectedBrochureItems, item];
    setSelectedBrochureItems(updatedSelection);
  };

  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const groupedItems = items.reduce((acc, item) => {
    const group = item.group || "No Group";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div className="brochure-page">
      <h2>{translations[language].title}</h2>
      {Object.entries(groupedItems).map(([groupName, groupItems]) => (
        <div key={groupName} className="group-section">
          <h3 className="group-title">{groupName}</h3>
          <div className="brochure-container">
            {groupItems.map((item) => (
              <div
                key={item.id}
                className="brochure-card"
                onClick={() => handleCardClick(item)}
              >
                <div className="card-top">
                  <p className="card-price">{item.price} IQD</p>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="brochure-image"
                    />
                  )}
                </div>
                <div className="brochure-info">
                  <h3 className="brochure-name">
                    {item.name}{" "}
                    <span className="verification-status">
                      {item.verified
                        ? translations[language].verified
                        : translations[language].notVerified}
                    </span>
                  </h3>
                </div>
                <button
                  className={`btn btn-select ${
                    selectedBrochureItems.some((i) => i.id === item.id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(item);
                  }}
                >
                  {translations[language].select}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedItem && (
        <div className="brochure-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{selectedItem.name}</h3>
            {selectedItem.imageUrl && (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="modal-image"
              />
            )}
            <p>
              <strong>Price:</strong> {selectedItem.price} IQD
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {selectedItem.description || "No description"}
            </p>
            <p>
              <strong>Group:</strong> {selectedItem.group || "None"}
            </p>
            <p>
              <strong>Verified:</strong> {selectedItem.verified ? "Yes" : "No"}
            </p>
            <button onClick={closeModal} className="btn btn-close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brochure;
