import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import WorkOrderList from './pages/WorkOrderList';
import WorkOrderCreate from './pages/WorkOrderCreate';
import WorkOrderDetail from './pages/WorkOrderDetail';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Routes>
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
