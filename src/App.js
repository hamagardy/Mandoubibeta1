import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Menu from "./components/Menu";
import DailySalesEntry from "./components/DailySalesEntry";
import SalesData from "./components/SalesData";
import SalesReports from "./components/SalesReports";
import Items from "./components/Items";
import SalesSummary from "./components/SalesSummary";
import Settings from "./components/Settings";
import SalesForecasting from "./components/SalesForecasting";
import AdminMembersList from "./components/AdminMembersList";
import FollowUp from "./components/FollowUp";
import PharmaLocations from "./components/PharmaLocations";
import Brochure from "./components/Brochure";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import { LanguageProvider } from "./components/LanguageContext";
import { SellerProvider } from "./components/SellerContext";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

const AppContent = ({
  user,
  role,
  permissions,
  setUser,
  setRole,
  currency,
  exchangeRate,
  monthlyTargetPrices,
  resetAllSales,
  changeCurrency,
  updateTargetPrice,
  setMonthlyTargetPrices,
  selectedBrochureItems,
  setSelectedBrochureItems,
}) => {
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  useEffect(() => {
    // Reset hasRedirected when user changes to allow redirect on logout
    setHasRedirected(false);
  }, [user]);

  useEffect(() => {
    if (!hasRedirected) {
      if (user) {
        // Redirect to Sales Summary after login
        navigate("/");
        setHasRedirected(true);
      } else {
        // Redirect to login if no user (after logout)
        navigate("/login");
        setHasRedirected(true);
      }
    }
  }, [user, navigate, hasRedirected]);

  const isLoginPage = window.location.pathname === "/login";

  return (
    <div className="app-container">
      {!isLoginPage && user && <Menu role={role} permissions={permissions} />}
      <main
        className="content"
        style={{ paddingTop: !isLoginPage && user ? "120px" : "20px" }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <SalesSummary
                role={role}
                currency={currency}
                exchangeRate={exchangeRate}
                monthlyTargetPrices={monthlyTargetPrices}
                updateTargetPrice={updateTargetPrice}
                setMonthlyTargetPrices={setMonthlyTargetPrices}
              />
            }
          />
          <Route
            path="/daily-sales"
            element={
              <DailySalesEntry
                currency={currency}
                exchangeRate={exchangeRate}
                selectedBrochureItems={selectedBrochureItems} // Pass to all users
                setSelectedBrochureItems={setSelectedBrochureItems}
              />
            }
          />
          <Route
            path="/sales-data"
            element={
              <SalesData
                role={role}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            }
          />
          <Route
            path="/reports"
            element={
              <SalesReports
                role={role}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            }
          />
          <Route
            path="/items"
            element={
              <ProtectedRoute requiredRole="admin" userRole={role}>
                <Items currency={currency} exchangeRate={exchangeRate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                role={role}
                currency={currency}
                changeCurrency={changeCurrency}
                monthlyTargetPrices={monthlyTargetPrices}
                updateTargetPrice={updateTargetPrice}
                resetAllSales={resetAllSales}
              />
            }
          />
          <Route
            path="/sales-forecast"
            element={
              <SalesForecasting
                role={role}
                currency={currency}
                exchangeRate={exchangeRate}
              />
            }
          />
          <Route
            path="/admin-members"
            element={
              <ProtectedRoute requiredRole="admin" userRole={role}>
                <AdminMembersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow-up"
            element={
              <ProtectedRoute requiredRole="admin" userRole={role}>
                <FollowUp currency={currency} exchangeRate={exchangeRate} />
              </ProtectedRoute>
            }
          />
          <Route path="/pharma-locations" element={<PharmaLocations />} />
          <Route
            path="/brochure"
            element={
              <Brochure
                selectedBrochureItems={selectedBrochureItems}
                setSelectedBrochureItems={setSelectedBrochureItems}
              />
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>
          Mandoubi App Beta 1 powered by{" "}
          <a
            href="https://hamagardy.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            @hamagardy
          </a>
        </p>
      </footer>
    </div>
  );
};

function App() {
  const [currency, setCurrency] = React.useState("IQD");
  const [exchangeRate, setExchangeRate] = React.useState(1550);
  const [monthlyTargetPrices, setMonthlyTargetPrices] = React.useState(null);
  const [role, setRole] = React.useState(null);
  const [permissions, setPermissions] = React.useState({});
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedBrochureItems, setSelectedBrochureItems] = React.useState([]);

  // Removed role-based clearing of selectedBrochureItems
  // useEffect(() => {
  //   if (role && role !== "admin") {
  //     setSelectedBrochureItems([]);
  //   }
  // }, [role]);

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        if (monthlyTargetPrices === null) setMonthlyTargetPrices({});
      }
    }, 10000);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const unsubscribeFirestore = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const userData = docSnap.data();
                setRole(userData.role || "member");
                setPermissions(
                  userData.role === "admin"
                    ? {
                        salesSummary: true,
                        dailySales: true,
                        salesData: true,
                        salesReports: true,
                        items: true,
                        settings: true,
                        salesForecast: true,
                        adminMembers: true,
                        followUp: true,
                        pharmaLocations: true,
                        brochure: true,
                      }
                    : userData.permissions || {}
                );
                setMonthlyTargetPrices(userData.monthlyTargetPrices || {});
              } else {
                const defaultRole =
                  currentUser.uid === "qBnUF4aOaYPxHP2VlDdQOq2sEKl2"
                    ? "admin"
                    : "member";
                const defaultPermissions = {
                  salesSummary: true,
                  dailySales: true,
                  salesData: true,
                  salesReports: true,
                  items: defaultRole === "admin",
                  settings: defaultRole === "admin",
                  salesForecast: true,
                  adminMembers: defaultRole === "admin",
                  followUp: defaultRole === "admin",
                  pharmaLocations: true,
                  brochure: true,
                };
                setRole(defaultRole);
                setPermissions(
                  defaultRole === "admin"
                    ? {
                        salesSummary: true,
                        dailySales: true,
                        salesData: true,
                        salesReports: true,
                        items: true,
                        settings: true,
                        salesForecast: true,
                        adminMembers: true,
                        followUp: true,
                        pharmaLocations: true,
                        brochure: true,
                      }
                    : defaultPermissions
                );
                setDoc(userRef, {
                  email: currentUser.email,
                  role: defaultRole,
                  permissions: defaultPermissions,
                  monthlyTargetPrices: {},
                });
              }
              setLoading(false);
            },
            (error) => {
              console.error("Firestore error:", error.code, error.message);
              setMonthlyTargetPrices({});
              setLoading(false);
            }
          );
          return () => unsubscribeFirestore();
        } else {
          setRole(null);
          setPermissions({});
          setMonthlyTargetPrices({});
          setLoading(false);
        }
      },
      (error) => {
        console.error("Auth error:", error.code, error.message);
        setMonthlyTargetPrices({});
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribeAuth();
    };
  }, []);

  const resetAllSales = async () => {
    if (role !== "admin" || !window.confirm("Reset all sales data?")) return;
    const salesRef = collection(db, "sales");
    const snapshot = await getDocs(salesRef);
    await Promise.all(snapshot.docs.map((doc) => deleteDoc(doc.ref)));
    localStorage.removeItem("sales");
    window.location.reload();
  };

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency === "USD" ? "USD" : "IQD");
    setExchangeRate(newCurrency === "USD" ? 1 : 1550);
  };

  const updateTargetPrice = async (newTarget, month) => {
    const numericTarget = Number(newTarget);
    const updatedTargets = { ...monthlyTargetPrices, [month]: numericTarget };
    setMonthlyTargetPrices(updatedTargets);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { monthlyTargetPrices: updatedTargets });

      if (role === "admin") {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        await Promise.all(
          snapshot.docs
            .filter((doc) => doc.id !== user.uid)
            .map((doc) =>
              updateDoc(doc.ref, {
                monthlyTargetPrices: {
                  ...doc.data().monthlyTargetPrices,
                  [month]: numericTarget,
                },
              })
            )
        );
      }
    }
  };

  if (loading || monthlyTargetPrices === null) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
    );
  }

  return (
    <LanguageProvider>
      <SellerProvider>
        <Router>
          <AppContent
            user={user}
            role={role}
            permissions={permissions}
            setUser={setUser}
            setRole={setRole}
            currency={currency}
            exchangeRate={exchangeRate}
            monthlyTargetPrices={monthlyTargetPrices}
            resetAllSales={resetAllSales}
            changeCurrency={changeCurrency}
            updateTargetPrice={updateTargetPrice}
            setMonthlyTargetPrices={setMonthlyTargetPrices}
            selectedBrochureItems={selectedBrochureItems}
            setSelectedBrochureItems={setSelectedBrochureItems}
          />
        </Router>
      </SellerProvider>
    </LanguageProvider>
  );
}

export default App;
