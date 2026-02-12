/*import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import WorkOrderList from "./pages/WorkOrderList";
import WorkOrderCreate from "./pages/WorkOrderCreate";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("list");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Restaurar sesion si existe
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage("list");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("list");
  };

  const navigateTo = (page, orderId = null) => {
    setCurrentPage(page);
    if (orderId) setSelectedOrderId(orderId);
  };

  // Si no hay usuario, mostrar login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "create":
        return <WorkOrderCreate onNavigate={navigateTo} currentUser={user} />;
      case "detail":
        return (
          <WorkOrderDetail
            orderId={selectedOrderId}
            onNavigate={navigateTo}
            currentUser={user}
          />
        );
      case "users":
        return user.role === "ADMIN" ? (
          <UserManagement currentUser={user} />
        ) : (
          <WorkOrderList onNavigate={navigateTo} />
        );
      default:
        return <WorkOrderList onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="app">
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;*/
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import WorkOrderList from './pages/WorkOrderList';
import WorkOrderCreate from './pages/WorkOrderCreate';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/ordenes" replace />} />
            <Route path="/ordenes" element={<WorkOrderList />} />
            <Route path="/ordenes/nueva" element={<WorkOrderCreate />} />
            <Route path="/ordenes/:id" element={<WorkOrderDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;


