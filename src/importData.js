import { db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";

const importData = async () => {
  // Items
  await setDoc(doc(db, "items", "item1"), { name: "Product X", price: 50000 });
  await setDoc(doc(db, "items", "item2"), { name: "Product Y", price: 75000 });

  // Sales
  await setDoc(doc(db, "sales", "sale1"), {
    customerName: "Customer A",
    date: "2025-03-22",
    items: [
      { id: "item1", name: "Product X", price: 50000, quantity: 1 },
      { id: "item2", name: "Product Y", price: 75000, quantity: 1 },
    ],
    note: "First sale",
    totalPrice: 125000,
    userId: "txQV8Y0ia1ehHEVQ2JMLJpMf4hr2",
  });

  // Users
  await setDoc(doc(db, "users", "qBnUF4aOaYPxHP2VlDdQOq2sEKl2"), {
    email: "admin@hamagardy.com",
    role: "admin",
  });
  await setDoc(doc(db, "users", "txQV8Y0ia1ehHEVQ2JMLJpMf4hr2"), {
    email: "hgardyy@gmail.com",
    role: "seller",
  });

  console.log("Data imported successfully!");
};

importData();
