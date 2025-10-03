import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const AdminMembersList = () => {
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [editingMember, setEditingMember] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [editPassword, setEditPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      setMembers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, []);

  const handleAddMember = async () => {
    if (!newMemberEmail || !newMemberName || !newMemberPassword) {
      setError("Email, name, and password are required.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newMemberEmail,
        newMemberPassword
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: newMemberName });

      const defaultPermissions = {
        salesSummary: true,
        dailySales: true,
        salesData: true,
        salesReports: true,
        items: newMemberRole === "admin",
        settings: newMemberRole === "admin",
        salesForecast: true,
        adminMembers: newMemberRole === "admin",
        followUp: newMemberRole === "admin",
        pharmaLocations: true,
        brochure: true,
        // New permission fields - regular users start with false, admin gets true
        viewAllSalesData: newMemberRole === "admin",
        changeVisitStatus: false, // Regular users can be granted this
        changePermissions: newMemberRole === "admin",
        changePrice: false, // Regular users can be granted this
        changeBonus: false, // Regular users can be granted this
      };

      const newMemberData = {
        email: newMemberEmail,
        name: newMemberName, // Always defined here
        role: newMemberRole,
        permissions:
          newMemberRole === "admin"
            ? {
                ...defaultPermissions,
                items: true,
                settings: true,
                adminMembers: true,
                followUp: true,
                brochure: true,
                // Admin gets all new permissions
                viewAllSalesData: true,
                changeVisitStatus: true,
                changePermissions: true,
                changePrice: true,
                changeBonus: true,
              }
            : defaultPermissions,
        monthlyTargetPrices: {},
      };

      await setDoc(doc(db, "users", user.uid), newMemberData);
      setMembers([...members, { id: user.uid, ...newMemberData }]);
      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberPassword("");
      setNewMemberRole("member");
      setError("");
    } catch (error) {
      console.error("Error adding member:", error);
      setError(error.message);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember({
      ...member,
      name: member.name || "", // Default to empty string if undefined
    });
    setPermissions(
      member.role === "admin"
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
            // Admin gets all new permissions
            viewAllSalesData: true,
            changeVisitStatus: true,
            changePermissions: true,
            changePrice: true,
            changeBonus: true,
          }
        : member.permissions || {}
    );
    setEditPassword("");
  };

  const handleSavePermissions = async () => {
    if (!editingMember) return;
    const memberRef = doc(db, "users", editingMember.id);
    const updatedPermissions =
      editingMember.role === "admin"
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
            // Admin gets all new permissions
            viewAllSalesData: true,
            changeVisitStatus: true,
            changePermissions: true,
            changePrice: true,
            changeBonus: true,
          }
        : permissions;

    const updatedData = {
      permissions: updatedPermissions,
      role: editingMember.role,
      name: editingMember.name || "", // Default to empty string if undefined
    };

    try {
      await updateDoc(memberRef, updatedData);
      setMembers(
        members.map((m) =>
          m.id === editingMember.id ? { ...m, ...updatedData } : m
        )
      );
      setEditingMember(null);
      setEditPassword("");
      alert("Permissions updated successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      setError(error.message);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    await deleteDoc(doc(db, "users", id));
    setMembers(members.filter((m) => m.id !== id));
  };

  const togglePermission = (key) => {
    // Allow toggling for all users, but admin permissions are locked to true
    if (editingMember?.role === "admin" && [
      'items', 'settings', 'adminMembers', 'followUp', 
      'viewAllSalesData', 'changePermissions'
    ].includes(key)) {
      return; // These are locked for admin
    }
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuPermissions = {
    salesSummary: "Home",
    dailySales: "Daily Sales",
    salesData: "Sales Data",
    salesReports: "Reports",
    items: "Items",
    settings: "Settings",
    salesForecast: "Sales Forecast",
    adminMembers: "Admin Members",
    followUp: "Follow Up",
    pharmaLocations: "Pharma Locations",
    brochure: "Brochure",
  };

  const salesDataPermissions = {
    viewAllSalesData: "View All Users Sales Data",
    changeVisitStatus: "Change Visit Status",
    changePermissions: "Change User Permissions",
    changePrice: "Change Price",
    changeBonus: "Change Bonus",
  };

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
          Admin Members List
        </h2>
        
        {error && (
          <div className="ios-card" style={{
            background: "rgba(211, 64, 83, 0.05)",
            border: "1px solid rgba(211, 64, 83, 0.1)",
            marginBottom: "1.5rem"
          }}>
            <div style={{
              color: "var(--danger)",
              fontWeight: "500"
            }}>
              {error}
            </div>
          </div>
        )}
        
        {/* Add New Member Form */}
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
            Add New Member
          </h3>
          
          <div className="ios-grid ios-grid-2">
            <div className="ios-form-group">
              <label className="ios-label">Email</label>
              <input
                className="ios-input"
                type="email"
                placeholder="Enter member email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Name</label>
              <input
                className="ios-input"
                type="text"
                placeholder="Enter member name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Password</label>
              <input
                className="ios-input"
                type="password"
                placeholder="Enter password"
                value={newMemberPassword}
                onChange={(e) => setNewMemberPassword(e.target.value)}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Role</label>
              <select
                className="ios-select"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleAddMember}
            className="ios-button"
            style={{ width: "100%" }}
          >
            Add Member
          </button>
        </div>
        
        {/* Members List */}
        <div className="ios-grid ios-grid-1">
          {members.map((member) => (
            <div key={member.id} className="ios-card">
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "var(--dark)",
                    marginBottom: "0.5rem"
                  }}>
                    {member.name || "Unnamed"}
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: "var(--body)",
                    marginBottom: "0.25rem"
                  }}>
                    <strong>Email:</strong> {member.email}
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: "var(--body)"
                  }}>
                    <strong>Role:</strong> 
                    <span style={{
                      marginLeft: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: member.role === "admin" 
                        ? "rgba(60, 80, 224, 0.1)" 
                        : "rgba(33, 150, 83, 0.1)",
                      color: member.role === "admin" 
                        ? "var(--primary)" 
                        : "var(--success)"
                    }}>
                      {member.role}
                    </span>
                  </div>
                </div>
                
                <div className="ios-input-group">
                  <button
                    onClick={() => handleEditMember(member)}
                    className="ios-button"
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      background: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="ios-button ios-button-danger"
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
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
        }}>
          <div className="ios-glassy-container" style={{
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "var(--dark)",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              Edit {editingMember.name || editingMember.email}
            </h3>
            
            <div className="ios-form-group">
              <label className="ios-label">Name</label>
              <input
                className="ios-input"
                type="text"
                placeholder="Update name"
                value={editingMember.name || ""}
                onChange={(e) =>
                  setEditingMember({ ...editingMember, name: e.target.value })
                }
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Password (Optional)</label>
              <input
                className="ios-input"
                type="password"
                placeholder="Update password (optional)"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Menu Permissions</label>
              <div className="ios-grid ios-grid-2" style={{ gap: "0.75rem" }}>
                {Object.keys(menuPermissions).map((key) => (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 0, 0, 0.05)"
                  }}>
                    <span style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--dark)"
                    }}>
                      {menuPermissions[key]}
                    </span>
                    <label className="ios-switch">
                      <input
                        type="checkbox"
                        checked={permissions[key] || false}
                        onChange={() => togglePermission(key)}
                        disabled={editingMember.role === "admin"}
                      />
                      <span className="ios-switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
              
              {editingMember.role === "admin" && (
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "rgba(60, 80, 224, 0.05)",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  color: "var(--primary)",
                  fontStyle: "italic"
                }}>
                  Admin menu permissions are locked to full access.
                </div>
              )}
            </div>
            
            <div className="ios-form-group">
              <label className="ios-label">Sales Data Permissions</label>
              <div className="ios-grid ios-grid-1" style={{ gap: "0.75rem" }}>
                {Object.keys(salesDataPermissions).map((key) => (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 0, 0, 0.05)"
                  }}>
                    <span style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--dark)"
                    }}>
                      {salesDataPermissions[key]}
                    </span>
                    <label className="ios-switch">
                      <input
                        type="checkbox"
                        checked={permissions[key] || false}
                        onChange={() => togglePermission(key)}
                        disabled={editingMember.role === "admin"}
                      />
                      <span className="ios-switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
              
              {editingMember.role === "admin" && (
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "rgba(60, 80, 224, 0.05)",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  color: "var(--primary)",
                  fontStyle: "italic"
                }}>
                  Admin sales data permissions are locked to full access.
                </div>
              )}
            </div>
            
            <div className="ios-input-group" style={{ marginTop: "1.5rem" }}>
              <button
                onClick={handleSavePermissions}
                className="ios-button ios-button-success"
                style={{ flex: 1 }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingMember(null)}
                className="ios-button ios-button-danger"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembersList;
