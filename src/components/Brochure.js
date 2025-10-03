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
    searchPlaceholder: "Search products...",
    noResults: "No products found",
  },
  ar: { 
    title: "المنتجات", 
    select: "اختر", 
    verified: "✅", 
    notVerified: "❌",
    searchPlaceholder: "البحث عن المنتجات...",
    noResults: "لم يتم العثور على منتجات",
  },
  ku: {
    title: "بەرهەمەکان",
    select: "ھەڵبژاردن",
    verified: "✅",
    notVerified: "❌",
    searchPlaceholder: "گەڕان بۆ بەرهەمەکان...",
    noResults: "هیچ بەرهەمێک نەدۆزرایەوە",
  },
};

const Brochure = ({ setSelectedBrochureItems, selectedBrochureItems = [] }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.group && item.group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    const group = item.group || "No Group";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

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
          {translations[language].title}
        </h2>
        
        {/* Search Input */}
        <div className="ios-form-group" style={{ marginBottom: "2rem" }}>
          <div style={{ position: "relative" }}>
            <input
              className="ios-input"
              type="text"
              placeholder={translations[language].searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                fontSize: "1rem",
                padding: "1rem",
                textAlign: language === 'ar' ? 'right' : 'left',
                paddingRight: searchTerm ? "3rem" : "1rem"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "var(--body)",
                  cursor: "pointer",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "none";
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {searchTerm && Object.keys(groupedItems).length > 0 && (
          <div style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            padding: "0.75rem",
            background: "rgba(60, 80, 224, 0.05)",
            borderRadius: "12px",
            color: "var(--primary)",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}>
            Found {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''} for "{searchTerm}"
          </div>
        )}
        
        {Object.keys(groupedItems).length === 0 && searchTerm && (
          <div className="ios-card" style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--body)"
          }}>
            <div style={{
              fontSize: "1.125rem",
              fontWeight: "500"
            }}>
              {translations[language].noResults}
            </div>
            <div style={{
              fontSize: "0.875rem",
              marginTop: "0.5rem",
              opacity: 0.7
            }}>
              Try searching with different keywords
            </div>
          </div>
        )}
        
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <div key={groupName} style={{ marginBottom: "2rem" }}>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "var(--white)",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              {groupName}
            </h3>
            
            <div className="ios-grid ios-grid-3">
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  className="ios-card"
                  onClick={() => handleCardClick(item)}
                  style={{
                    cursor: "pointer",
                    height: "350px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "var(--primary)",
                      marginBottom: "0.75rem"
                    }}>
                      {item.price.toLocaleString()} IQD
                    </div>
                    
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          marginBottom: "0.75rem"
                        }}
                      />
                    )}
                  </div>
                  
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <h4 style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "var(--dark)",
                      marginBottom: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}>
                      {item.name}
                      <span style={{
                        fontSize: "0.875rem"
                      }}>
                        {item.verified
                          ? translations[language].verified
                          : translations[language].notVerified}
                      </span>
                    </h4>
                  </div>
                  
                  <button
                    className={`ios-button ${
                      selectedBrochureItems.some((i) => i.id === item.id)
                        ? "ios-button-success"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                    style={{
                      width: "100%",
                      marginTop: "0.5rem"
                    }}
                  >
                    {selectedBrochureItems.some((i) => i.id === item.id)
                      ? "Selected ✓"
                      : translations[language].select}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }} onClick={closeModal}>
          <div className="ios-glassy-container" style={{
            maxWidth: "500px",
            width: "90%",
            textAlign: "center"
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "var(--dark)",
              marginBottom: "1rem"
            }}>
              {selectedItem.name}
            </h3>
            
            {selectedItem.imageUrl && (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  objectFit: "contain",
                  borderRadius: "12px",
                  marginBottom: "1rem"
                }}
              />
            )}
            
            <div style={{
              textAlign: "left",
              marginBottom: "1.5rem",
              fontSize: "0.95rem",
              lineHeight: "1.6"
            }}>
              <p><strong>Price:</strong> {selectedItem.price.toLocaleString()} IQD</p>
              <p><strong>Description:</strong> {selectedItem.description || "No description"}</p>
              <p><strong>Group:</strong> {selectedItem.group || "None"}</p>
              <p><strong>Verified:</strong> {selectedItem.verified ? "Yes" : "No"}</p>
            </div>
            
            <button 
              onClick={closeModal} 
              className="ios-button ios-button-danger"
              style={{ width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brochure;
