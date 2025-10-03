import React, { useState, useEffect } from "react";
import { auth } from "../firebase";

const WelcomePopup = ({ user, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toDateString();
    const lastShownKey = `welcomePopup_${user.uid}`;
    const lastShown = localStorage.getItem(lastShownKey);

    // Show popup if it hasn't been shown today
    if (lastShown !== today) {
      setShow(true);
      localStorage.setItem(lastShownKey, today);
    }
  }, [user]);

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  if (!show || !user) return null;

  const getUserName = () => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)"
    }}>
      <div className="ios-glassy-container" style={{
        maxWidth: "400px",
        width: "90%",
        textAlign: "center",
        padding: "2rem",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)"
      }}>
        <div style={{
          fontSize: "3rem",
          marginBottom: "1rem"
        }}>
          👋
        </div>
        
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "var(--dark)",
          marginBottom: "0.5rem"
        }}>
          Welcome back!
        </h2>
        
        <p style={{
          fontSize: "1.125rem",
          color: "var(--primary)",
          fontWeight: "600",
          marginBottom: "1.5rem"
        }}>
          {getUserName()}
        </p>
        
        <p style={{
          fontSize: "0.95rem",
          color: "var(--body)",
          lineHeight: "1.5",
          marginBottom: "2rem"
        }}>
          Ready to make today productive? Let's achieve your sales goals together!
        </p>
        
        <button
          onClick={handleClose}
          className="ios-button"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1rem",
            fontWeight: "600"
          }}
        >
          Let's Get Started! 🚀
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup;