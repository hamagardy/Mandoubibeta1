import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

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
          }
        : permissions;

    const updatedData = {
      permissions: updatedPermissions,
      role: editingMember.role,
      name: editingMember.name || "", // Default to empty string if undefined
    };

    try {
      await setDoc(memberRef, updatedData, { merge: true });
      setMembers(
        members.map((m) =>
          m.id === editingMember.id ? { ...m, ...updatedData } : m
        )
      );
      setEditingMember(null);
      setEditPassword("");
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
    if (editingMember?.role === "admin") return;
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

  return (
    <div className="container admin-members-container">
      <div className="card admin-members-card">
        <h2 className="settings-form h2">Admin Members List</h2>
        <div className="filters mb-6">
          <input
            type="email"
            placeholder="Enter member email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Enter member name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Enter member password"
            value={newMemberPassword}
            onChange={(e) => setNewMemberPassword(e.target.value)}
            className="input-field"
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
            className="select-field"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleAddMember}
            className="navbar-btn navbar-logout-btn"
          >
            Add Member
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <ul className="space-y-4">
          {members.map((member) => (
            <li
              key={member.id}
              className="daily-sales-form li flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-[#1f2a44]">
                  <strong>Name:</strong> {member.name || "Unnamed"}
                </p>
                <p className="text-[#67748e]">
                  <strong>Email:</strong> {member.email}
                </p>
                <p className="text-[#67748e]">
                  <strong>Role:</strong> {member.role}
                </p>
              </div>
              <div className="navbar-buttons">
                <button
                  onClick={() => handleEditMember(member)}
                  className="navbar-btn"
                  style={{ backgroundColor: "#f1c40f", color: "#fff" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="navbar-btn"
                  style={{ backgroundColor: "#e74c3c" }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editingMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              Edit {editingMember.name || editingMember.email}
            </h3>
            <input
              type="text"
              placeholder="Update name"
              value={editingMember.name || ""}
              onChange={(e) =>
                setEditingMember({ ...editingMember, name: e.target.value })
              }
              className="input-field mb-3"
            />
            <input
              type="password"
              placeholder="Update password (optional)"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="input-field mb-3"
            />
            <div className="space-y-3">
              {Object.keys(menuPermissions).map((key) => (
                <div key={key} className="toggle-container">
                  <span className="toggle-label">{menuPermissions[key]}</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={permissions[key] || false}
                      onChange={() => togglePermission(key)}
                      disabled={editingMember.role === "admin"}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>
            {editingMember.role === "admin" && (
              <p className="text-[#67748e] mt-2">
                Admin permissions are locked to full access.
              </p>
            )}
            <div className="modal-actions">
              <button
                onClick={handleSavePermissions}
                className="navbar-btn"
                style={{ backgroundColor: "#10b981" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingMember(null)}
                className="navbar-btn"
                style={{ backgroundColor: "#67748e" }}
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