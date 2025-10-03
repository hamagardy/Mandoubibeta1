import React, { useState, useEffect, useContext } from "react";
import { LanguageContext } from "./LanguageContext";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

const translations = {
  en: {
    title: "Items Management",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    download: "Download",
    newItemNamePlaceholder: "New Item Name",
    pricePlaceholder: "Price (in IQD)",
    descriptionPlaceholder: "Description",
    imageUrlPlaceholder: "Image URL",
    groupPlaceholder: "Group (e.g., Syrian, Indian)",
    verified: "Sticker ✅",
    notVerified: "Sticker ❌",
  },
  ar: {
    title: "إدارة العناصر",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    download: "تنزيل",
    newItemNamePlaceholder: "اسم العنصر الجديد",
    pricePlaceholder: "السعر (بالدينار العراقي)",
    descriptionPlaceholder: "الوصف",
    imageUrlPlaceholder: "رابط الصورة",
    groupPlaceholder: "المجموعة (مثل سوري، هندي)",
    verified: "ستیکر ✅",
    notVerified: "❌ ستیکر",
  },
  ku: {
    title: "بەڕێوەبردنی کاڵاکان",
    edit: "دەستکاری",
    delete: "سڕینەوە",
    save: "پاشەکەوت",
    download: "داگرتن",
    newItemNamePlaceholder: "ناوی کاڵای نوێ",
    pricePlaceholder: "نرخ (بە دینار عێراقی)",
    descriptionPlaceholder: "وەسف",
    imageUrlPlaceholder: "بەستەری وێنە",
    groupPlaceholder: "گروپ (وەک سوری، ھیندی)",
    verified: "ستیکەر ✅",
    notVerified: "ستیکەر ❌",
  },
};

const Items = ({ currency, exchangeRate, setSelectedBrochureItems }) => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemGroup, setNewItemGroup] = useState(""); // New group field
  const [newItemVerified, setNewItemVerified] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
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

  const handleEdit = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemPrice(item.price);
    setNewItemDescription(item.description || "");
    setNewItemImageUrl(item.imageUrl || "");
    setNewItemGroup(item.group || ""); // Set group for editing
    setNewItemVerified(item.verified || false);
  };

  const handleSave = async () => {
    if (auth.currentUser.uid !== "qBnUF4aOaYPxHP2VlDdQOq2sEKl2") {
      alert("Only admin can modify items.");
      return;
    }

    const price = parseFloat(newItemPrice);
    if (!newItemName || isNaN(price)) {
      alert("Name and valid price are required.");
      return;
    }

    if (editingItem) {
      const itemRef = doc(db, "items", editingItem.id);
      await updateDoc(itemRef, {
        name: newItemName,
        price: price,
        description: newItemDescription,
        imageUrl: newItemImageUrl,
        group: newItemGroup, // Save group
        verified: newItemVerified,
      });
      console.log("Item updated:", editingItem.id);
      setEditingItem(null);
    } else {
      await addDoc(collection(db, "items"), {
        name: newItemName,
        price: price,
        description: newItemDescription,
        imageUrl: newItemImageUrl,
        group: newItemGroup, // Add group
        verified: newItemVerified,
      });
      console.log("New item added");
    }

    setNewItemName("");
    setNewItemPrice("");
    setNewItemDescription("");
    setNewItemImageUrl("");
    setNewItemGroup("");
    setNewItemVerified(false);
  };

  const handleDelete = async (itemId) => {
    if (auth.currentUser.uid !== "qBnUF4aOaYPxHP2VlDdQOq2sEKl2") {
      alert("Only admin can delete items.");
      return;
    }
    await deleteDoc(doc(db, "items", itemId));
    console.log("Item deleted:", itemId);
  };

  const handleDownload = (imageUrl, itemName) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${itemName}-image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const priceDisplay = (price) =>
    currency === "USD" ? (price / exchangeRate).toFixed(2) : price;

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
        
        {/* New Item Form */}
        <div className="ios-card" style={{
          background: "rgba(60, 80, 224, 0.05)",
          border: "1px solid rgba(60, 80, 224, 0.1)",
          marginBottom: "2rem"
        }}>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "var(--primary)"
          }}>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          
          <div className="ios-grid ios-grid-2">
            <div className="ios-form-group">
              <label className="ios-label">Item Name</label>
              <input
                className="ios-input"
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={translations[language].newItemNamePlaceholder}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Price (IQD)</label>
              <input
                className="ios-input"
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder={translations[language].pricePlaceholder}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Group</label>
              <input
                className="ios-input"
                type="text"
                value={newItemGroup}
                onChange={(e) => setNewItemGroup(e.target.value)}
                placeholder={translations[language].groupPlaceholder}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Image URL</label>
              <input
                className="ios-input"
                type="text"
                value={newItemImageUrl}
                onChange={(e) => setNewItemImageUrl(e.target.value)}
                placeholder={translations[language].imageUrlPlaceholder}
              />
            </div>
          </div>
          
          <div className="ios-form-group">
            <label className="ios-label">Description</label>
            <textarea
              className="ios-textarea"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder={translations[language].descriptionPlaceholder}
              rows="3"
            />
          </div>
          
          <div className="ios-form-group">
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <label className="ios-label" style={{ margin: 0 }}>Verified:</label>
              <div style={{
                position: "relative",
                display: "inline-block",
                width: "51px",
                height: "31px"
              }}>
                <input
                  type="checkbox"
                  checked={newItemVerified}
                  onChange={(e) => setNewItemVerified(e.target.checked)}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0
                  }}
                />
                <span style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: newItemVerified ? "#34c759" : "#e5e5ea",
                  borderRadius: "34px",
                  transition: "background-color 0.3s ease"
                }}>
                  <span style={{
                    position: "absolute",
                    content: "",
                    height: "27px",
                    width: "27px",
                    left: "2px",
                    bottom: "2px",
                    backgroundColor: "#ffffff",
                    borderRadius: "50%",
                    transition: "transform 0.3s ease",
                    transform: newItemVerified ? "translateX(20px)" : "translateX(0)",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
                  }}></span>
                </span>
              </div>
              <span style={{
                fontSize: "0.875rem",
                color: newItemVerified ? "var(--success)" : "var(--danger)"
              }}>
                {newItemVerified ? translations[language].verified : translations[language].notVerified}
              </span>
            </div>
          </div>
          
          {newItemImageUrl && (
            <div className="ios-form-group">
              <label className="ios-label">Preview</label>
              <img
                src={newItemImageUrl}
                alt="Preview"
                onClick={() => handleImageClick(newItemImageUrl)}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  cursor: "pointer",
                  border: "1px solid rgba(0, 0, 0, 0.1)"
                }}
              />
            </div>
          )}
          
          <div className="ios-input-group">
            <button
              onClick={handleSave}
              className="ios-button"
              style={{ flex: 1 }}
            >
              {editingItem ? 'Update Item' : translations[language].save}
            </button>
            {editingItem && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNewItemName("");
                  setNewItemPrice("");
                  setNewItemDescription("");
                  setNewItemImageUrl("");
                  setNewItemGroup("");
                  setNewItemVerified(false);
                }}
                className="ios-button ios-button-danger"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        
        {/* Items List - 2 Column Grid for iPhone 14 Pro Max */}
        <div className="ios-grid ios-grid-2" style={{ gap: "1rem" }}>
          {items.map((item) => (
            <div key={item.id} className="ios-card" style={{
              display: "flex",
              flexDirection: "column",
              height: "500px", // Optimized for iPhone 14 Pro Max
              overflow: "hidden"
            }}>
              {/* Large Image Section */}
              <div style={{
                width: "100%",
                height: "300px",
                overflow: "hidden",
                borderRadius: "12px",
                marginBottom: "1rem",
                cursor: "pointer",
                background: "#f8f9fa"
              }} onClick={() => item.imageUrl && handleImageClick(item.imageUrl)}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      transition: "transform 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)";
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--body)",
                    fontSize: "0.875rem"
                  }}>
                    No Image
                  </div>
                )}
              </div>
              
              {/* Item Details */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "var(--dark)",
                  marginBottom: "0.5rem",
                  lineHeight: "1.2",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  {item.name}
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
                    {item.verified ? "✅" : "❌"}
                  </span>
                </h3>
                
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "var(--primary)",
                  marginBottom: "0.75rem"
                }}>
                  {priceDisplay(item.price).toLocaleString()} {currency}
                </div>
                
                {item.group && (
                  <div style={{
                    fontSize: "0.875rem",
                    color: "var(--body)",
                    marginBottom: "0.5rem",
                    padding: "0.25rem 0.5rem",
                    background: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    {item.group}
                  </div>
                )}
                
                {item.description && (
                  <p style={{
                    fontSize: "0.875rem",
                    color: "var(--body)",
                    marginBottom: "1rem",
                    lineHeight: "1.4",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: "2",
                    WebkitBoxOrient: "vertical"
                  }}>
                    {item.description}
                  </p>
                )}
              </div>
              
              <div className="ios-input-group" style={{ justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleEdit(item)}
                  className="ios-button"
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem"
                  }}
                >
                  {translations[language].edit}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="ios-button ios-button-danger"
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem"
                  }}
                >
                  {translations[language].delete}
                </button>
                {item.imageUrl && (
                  <button
                    onClick={() => handleDownload(item.imageUrl, item.name)}
                    className="ios-button ios-button-success"
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem"
                    }}
                  >
                    {translations[language].download}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div onClick={closeModal} style={{
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
        }}>
          <div className="ios-glassy-container" style={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}>
            <img
              src={selectedImage}
              alt="Full view"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "12px"
              }}
            />
            <button
              onClick={closeModal}
              className="ios-button ios-button-danger"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
