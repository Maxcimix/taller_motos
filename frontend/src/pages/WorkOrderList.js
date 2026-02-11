'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { workOrderService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import './WorkOrderList.css';

const STATUSES = ['RECIBIDA', 'DIAGNOSTICO', 'EN_PROCESO', 'LISTA', 'ENTREGADA', 'CANCELADA'];

function WorkOrderList() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', plate: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workOrderService.getAll({
        status: filters.status,
        plate: filters.plate,
        page: filters.page,
        pageSize: 10,
      });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="work-order-list">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ordenes de Trabajo</h1>
          <p className="page-subtitle">
            {pagination.total} {pagination.total === 1 ? 'orden encontrada' : 'ordenes encontradas'}
          </p>
        </div>
        <Link to="/ordenes/nueva" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva Orden
        </Link>
      </div>

      <div className="card filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="filter-status" className="filter-label">Estado</label>
            <select
              id="filter-status"
              className="form-control"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-plate" className="filter-label">Placa</label>
            <input
              id="filter-plate"
              className="form-control"
              type="text"
              placeholder="Buscar por placa..."
              value={filters.plate}
              onChange={(e) => handleFilterChange('plate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <LoadingSpinner text="Cargando ordenes..." />
        ) : error ? (
          <div className="card-body">
            <div className="alert alert-error">{error}</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="table-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>No se encontraron ordenes de trabajo.</p>
            <Link to="/ordenes/nueva" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Crear primera orden
            </Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Placa</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td><span className="order-id">#{order.id}</span></td>
                      <td><span className="plate-badge">{order.bike?.placa || '-'}</span></td>
                      <td>{order.bike?.client?.name || '-'}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>{formatDate(order.entry_date)}</td>
                      <td className="total-cell">{formatCurrency(order.total)}</td>
                      <td>
                        <Link to={`/ordenes/${order.id}`} className="btn btn-sm btn-secondary">
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default WorkOrderList;
