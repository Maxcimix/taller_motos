import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import WorkOrderList from './pages/WorkOrderList';
import WorkOrderCreate from './pages/WorkOrderCreate';
import WorkOrderDetail from './pages/WorkOrderDetail';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Componente para proteger rutas que requieren autenticacion
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Cargando..." />;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Componente para proteger rutas que requieren rol ADMIN
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Cargando..." />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin()) return <Navigate to="/ordenes" />;
  return children;
}

// Redirigir si ya esta logueado
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Cargando..." />;
  return isAuthenticated ? <Navigate to="/ordenes" /> : children;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Iniciando..." />;

  return (
    <div className="App">
      {isAuthenticated && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/ordenes" element={
            <PrivateRoute><WorkOrderList /></PrivateRoute>
          } />
          <Route path="/ordenes/nueva" element={
            <PrivateRoute><WorkOrderCreate /></PrivateRoute>
          } />
          <Route path="/ordenes/:id" element={
            <PrivateRoute><WorkOrderDetail /></PrivateRoute>
          } />
          <Route path="/admin/usuarios" element={
            <AdminRoute><UserManagement /></AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/ordenes" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;