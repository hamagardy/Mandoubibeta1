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
    <div className="items-page">
      <h2>{translations[language].title}</h2>
      <ul className="items-list">
        {items.map((item) => (
          <li key={item.id} className="item-card">
            {editingItem && editingItem.id === item.id ? (
              <div className="item-form">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={translations[language].newItemNamePlaceholder}
                />
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder={translations[language].pricePlaceholder}
                />
                <textarea
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder={translations[language].descriptionPlaceholder}
                />
                <input
                  type="text"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  placeholder={translations[language].imageUrlPlaceholder}
                />
                <input
                  type="text"
                  value={newItemGroup}
                  onChange={(e) => setNewItemGroup(e.target.value)}
                  placeholder={translations[language].groupPlaceholder}
                />
                {newItemImageUrl && (
                  <img
                    src={newItemImageUrl}
                    alt="Preview"
                    className="form-image-preview"
                    onClick={() => handleImageClick(newItemImageUrl)}
                  />
                )}
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={newItemVerified}
                      onChange={(e) => setNewItemVerified(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span>
                    {newItemVerified
                      ? translations[language].verified
                      : translations[language].notVerified}
                  </span>
                </div>
              </div>
            ) : (
              <div className="item-content">
                <div className="flex items-center">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="item-image"
                      onClick={() => handleImageClick(item.imageUrl)}
                    />
                  )}
                  <div className="item-info">
                    <div className="item-name">
                      <span>{item.name}</span>
                      <span
                        className={`verification-badge ${
                          item.verified ? "verified" : "not-verified"
                        }`}
                      >
                        {item.verified
                          ? translations[language].verified
                          : translations[language].notVerified}
                      </span>
                    </div>
                    <p className="item-price">
                      {priceDisplay(item.price)} {currency}
                    </p>
                    <p className="item-description">
                      {item.description || "No description"}
                    </p>
                    <p className="item-group">
                      <strong>Group:</strong> {item.group || "None"}
                    </p>
                  </div>
                </div>
                <div className="item-actions">
                  {item.imageUrl && (
                    <button
                      onClick={() => handleDownload(item.imageUrl, item.name)}
                      className="btn btn-download"
                    >
                      {translations[language].download}
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(item)}
                    className="btn btn-edit"
                  >
                    {translations[language].edit}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-delete"
                  >
                    {translations[language].delete}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="new-item-form">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={translations[language].newItemNamePlaceholder}
        />
        <input
          type="number"
          value={newItemPrice}
          onChange={(e) => setNewItemPrice(e.target.value)}
          placeholder={translations[language].pricePlaceholder}
        />
        <textarea
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          placeholder={translations[language].descriptionPlaceholder}
        />
        <input
          type="text"
          value={newItemImageUrl}
          onChange={(e) => setNewItemImageUrl(e.target.value)}
          placeholder={translations[language].imageUrlPlaceholder}
        />
        <input
          type="text"
          value={newItemGroup}
          onChange={(e) => setNewItemGroup(e.target.value)}
          placeholder={translations[language].groupPlaceholder}
        />
        {newItemImageUrl && (
          <img
            src={newItemImageUrl}
            alt="Preview"
            className="form-image-preview"
            onClick={() => handleImageClick(newItemImageUrl)}
          />
        )}
        <div className="toggle-container">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={newItemVerified}
              onChange={(e) => setNewItemVerified(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>
            {newItemVerified
              ? translations[language].verified
              : translations[language].notVerified}
          </span>
        </div>
        <button onClick={handleSave} className="btn btn-save">
          {translations[language].save}
        </button>
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full Size" className="full-image" />
            <button onClick={closeModal} className="btn btn-close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
