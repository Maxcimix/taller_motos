'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { workOrdersAPI, clientsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import './WorkOrderList.css';

const STATUSES = ['RECIBIDA', 'DIAGNOSTICO', 'EN_PROCESO', 'LISTA', 'ENTREGADA', 'CANCELADA'];

function WorkOrderList() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', plate: '', client: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientsAPI.getAll();
        const list = Array.isArray(data) ? data : (data?.clients || data?.data || []);
        setClients(list);
      } catch (err) {
        console.error('Error cargando clientes:', err);
      }
    };
    fetchClients();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workOrdersAPI.getAll({
        status: filters.status,
        plate: filters.plate,
        page: filters.page,
        pageSize: 10,
      });

      // Filtrar por cliente en el frontend usando vehicle.client
      let filteredData = res.data || [];
      if (filters.client) {
        filteredData = filteredData.filter((order) =>
          order.vehicle?.client?.name
            ?.toLowerCase()
            .includes(filters.client.toLowerCase())
        );
      }

      setOrders(filteredData);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: filteredData.length });
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

  const handleClearFilters = () => {
    setFilters({ status: '', plate: '', client: '', page: 1 });
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

  const hasActiveFilters = filters.status || filters.plate || filters.client;

  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Label del tipo de vehiculo
  const vehicleTypeLabel = (type) => {
    const labels = {
      MOTORCYCLE: '🏍️', CAR: '🚗', TRUCK: '🚛',
      VAN: '🚐', BUS: '🚌', OTHER: '🚘',
    };
    return labels[type] || '';
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
        <div className="header-actions">
          <button
            className={`btn btn-secondary${showClientList ? ' btn-active' : ''}`}
            onClick={() => setShowClientList(!showClientList)}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Clientes ({clients.length})
          </button>
          <Link to="/ordenes/nueva" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Orden
          </Link>
        </div>
      </div>

      <div className={`wol-layout${showClientList ? ' with-sidebar' : ''}`}>
        <div className="wol-main">
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
                  placeholder="Buscar por plate..."
                  value={filters.plate}
                  onChange={(e) => handleFilterChange('plate', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="filter-client" className="filter-label">Cliente</label>
                <input
                  id="filter-client"
                  className="form-control"
                  type="text"
                  placeholder="Buscar por nombre de cliente..."
                  value={filters.client}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="filters-active">
                <span className="filter-active-label">Filtros activos:</span>
                {filters.status && (
                  <span className="filter-tag">
                    Estado: {filters.status.replace('_', ' ')}
                    <button onClick={() => handleFilterChange('status', '')} type="button">x</button>
                  </span>
                )}
                {filters.plate && (
                  <span className="filter-tag">
                    Placa: {filters.plate}
                    <button onClick={() => handleFilterChange('plate', '')} type="button">x</button>
                  </span>
                )}
                {filters.client && (
                  <span className="filter-tag">
                    Cliente: {filters.client}
                    <button onClick={() => handleFilterChange('client', '')} type="button">x</button>
                  </span>
                )}
                <button className="btn-clear-filters" onClick={handleClearFilters} type="button">
                  Limpiar todo
                </button>
              </div>
            )}
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
                {hasActiveFilters ? (
                  <button className="btn btn-secondary" onClick={handleClearFilters} style={{ marginTop: '12px' }} type="button">
                    Limpiar filtros
                  </button>
                ) : (
                  <Link to="/ordenes/nueva" className="btn btn-primary" style={{ marginTop: '12px' }}>
                    Crear primera orden
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Placa</th>
                        <th>Tipo</th>
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
                          <td><span className="plate-badge">{order.vehicle?.plate || '-'}</span></td>
                          <td>{vehicleTypeLabel(order.vehicle?.type_vehicle)}</td>
                          <td>
                            <span
                              className="client-name-link"
                              onClick={() => handleFilterChange('client', order.vehicle?.client?.name || '')}
                              title="Clic para filtrar por este cliente"
                            >
                              {order.vehicle?.client?.name || '-'}
                            </span>
                          </td>
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

        {showClientList && (
          <div className="wol-sidebar">
            <div className="card client-panel">
              <div className="client-panel-header">
                <h3 className="client-panel-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  Clientes Registrados
                </h3>
                <span className="client-count-badge">{clients.length}</span>
              </div>
              <div className="client-panel-search">
                <input
                  className="form-control"
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              <div className="client-list">
                {filteredClients.length === 0 ? (
                  <p className="client-empty">No se encontraron clientes</p>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`client-item${filters.client === client.name ? ' selected' : ''}`}
                      onClick={() => handleFilterChange('client', filters.client === client.name ? '' : client.name)}
                      title="Clic para filtrar ordenes de este cliente"
                    >
                      <div className="client-avatar">{client.name?.charAt(0).toUpperCase()}</div>
                      <div className="client-info">
                        <span className="client-item-name">{client.name}</span>
                        {client.phone && <span className="client-item-phone">{client.phone}</span>}
                        {client.email && <span className="client-item-email">{client.email}</span>}
                      </div>
                      {filters.client === client.name && (
                        <span className="client-active-indicator">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkOrderList;