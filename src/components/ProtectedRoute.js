import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole = "admin" }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminUid = "qBnUF4aOaYPxHP2VlDdQOq2sEKl2";
        setRole(currentUser.uid === adminUid ? "admin" : "member");
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (!user) {
    return null;
  }

  if (role === requiredRole) {
    return children;
  } else {
    return (
      <p className="text-center p-4">You do not have access to this page.</p>
    );
  }
};

export default ProtectedRoute;
