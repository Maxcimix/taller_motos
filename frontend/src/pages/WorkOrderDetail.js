'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workOrdersAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import './WorkOrderDetail.css';

const STATUS_TRANSITIONS = {
  RECIBIDA: ['DIAGNOSTICO', 'CANCELADA'],
  DIAGNOSTICO: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['LISTA', 'CANCELADA'],
  LISTA: ['ENTREGADA', 'CANCELADA'],
  ENTREGADA: [],
  CANCELADA: [],
};

const STATUS_LABELS = {
  RECIBIDA: 'Recibida',
  DIAGNOSTICO: 'Diagnostico',
  EN_PROCESO: 'En Proceso',
  LISTA: 'Lista',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
};

function WorkOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Form para nuevo item
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    type: 'MANO_OBRA',
    description: '',
    count: 1,
    unit_value: '',
  });
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await workOrdersAPI.getById(id);
      setOrder(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    setStatusError('');
    try {
      await workOrdersAPI.updateStatus(id, newStatus);
      await fetchOrder();
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemLoading(true);
    setItemError('');
    try {
      await workOrdersAPI.addItem(id, {
        type: itemForm.type,
        description: itemForm.description,
        count: parseInt(itemForm.count),
        unit_value: parseFloat(itemForm.unit_value),
      });
      setItemForm({ type: 'MANO_OBRA', description: '', count: 1, unit_value: '' });
      setShowItemForm(false);
      await fetchOrder();
    } catch (err) {
      setItemError(err.message);
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {  
    if (!window.confirm('Esta seguro de eliminar este item?')) return;
    setDeleteLoading(itemId);
    try {
      await workOrdersAPI.deleteItem(id, itemId)
      await fetchOrder();
    } catch (err) {
      setItemError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  if (loading) return <LoadingSpinner text="Cargando orden..." />;

  if (error) {
    return (
      <div className="detail-error">
        <div className="alert alert-error">{error}</div>
        <Link to="/ordenes" className="btn btn-secondary">Volver al listado</Link>
      </div>
    );
  }

  if (!order) return null;

  const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
  const isEditable = !['ENTREGADA', 'CANCELADA'].includes(order.status);

  return (
    <div className="work-order-detail">
      {/* Encabezado */}
      <div className="detail-header">
        <div className="detail-header-left">
          <Link to="/ordenes" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </Link>
          <h1 className="page-title">Orden #{order.id}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="detail-header-right">
          <span className="detail-date">{formatDate(order.entry_date)}</span>
        </div>
      </div>

      {statusError && <div className="alert alert-error">{statusError}</div>}

      <div className="detail-grid">
        {/* Informacion del vehiculo y cliente */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Informacion del Vehiculo</h2>
          </div>
          <div className="card-body">
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Placa</span>
                <span className="info-value">
                  <span className="plate-badge">{order.bike?.placa}</span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Marca</span>
                <span className="info-value">{order.bike?.brand}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Modelo</span>
                <span className="info-value">{order.bike?.model}</span>
              </div>
              {order.bike?.cylinder && (
                <div className="info-item">
                  <span className="info-label">Cilindraje</span>
                  <span className="info-value">{order.bike.cylinder}cc</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Informacion del Cliente</h2>
          </div>
          <div className="card-body">
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Nombre</span>
                <span className="info-value">{order.bike?.client?.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Telefono</span>
                <span className="info-value">{order.bike?.client?.phone}</span>
              </div>
              {order.bike?.client?.email && (
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{order.bike.client.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Descripcion de la falla */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Descripcion de la Falla</h2>
        </div>
        <div className="card-body">
          <p className="fault-text">{order.fault_description}</p>
        </div>
      </div>

      {/* Cambio de estado */}
      {allowedTransitions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Cambiar Estado</h2>
          </div>
          <div className="card-body">
            <div className="status-flow">
              {['RECIBIDA', 'DIAGNOSTICO', 'EN_PROCESO', 'LISTA', 'ENTREGADA'].map((s, i, arr) => {
                const isCurrent = order.status === s;
                const isPast = arr.indexOf(order.status) > i;
                return (
                  <React.Fragment key={s}>
                    <div className={`status-step ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}>
                      <div className="status-dot" />
                      <span className="status-step-label">{STATUS_LABELS[s]}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`status-connector ${isPast ? 'past' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="status-actions">
              {allowedTransitions.filter(s => s !== 'CANCELADA').map((s) => (
                <button
                  key={s}
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStatusChange(s)}
                  disabled={statusLoading}
                >
                  {statusLoading ? 'Actualizando...' : `Avanzar a ${STATUS_LABELS[s]}`}
                </button>
              ))}
              {allowedTransitions.includes('CANCELADA') && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (window.confirm('Esta seguro de cancelar esta orden?')) {
                      handleStatusChange('CANCELADA');
                    }
                  }}
                  disabled={statusLoading}
                >
                  Cancelar Orden
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items de la orden */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Items de la Orden</h2>
          {isEditable && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowItemForm(!showItemForm)}
            >
              {showItemForm ? 'Cancelar' : 'Agregar Item'}
            </button>
          )}
        </div>

        {showItemForm && (
          <div className="item-form-wrapper">
            <form onSubmit={handleAddItem} className="item-form">
              {itemError && <div className="alert alert-error">{itemError}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="item-type" className="form-label">Tipo *</label>
                  <select
                    id="item-type"
                    className="form-control"
                    value={itemForm.type}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                  >
                    <option value="MANO_OBRA">Mano de Obra</option>
                    <option value="REPUESTO">Repuesto</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="item-desc" className="form-label">Descripcion *</label>
                  <input
                    id="item-desc"
                    className="form-control"
                    type="text"
                    placeholder="Descripcion del item..."
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="item-count" className="form-label">Cantidad *</label>
                  <input
                    id="item-count"
                    className="form-control"
                    type="number"
                    min="1"
                    value={itemForm.count}
                    onChange={(e) => setItemForm({ ...itemForm, count: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="item-value" className="form-label">Valor Unitario *</label>
                  <input
                    id="item-value"
                    className="form-control"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={itemForm.unit_value}
                    onChange={(e) => setItemForm({ ...itemForm, unit_value: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={itemLoading}
                  >
                    {itemLoading ? 'Agregando...' : 'Agregar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {order.items && order.items.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripcion</th>
                    <th>Cant.</th>
                    <th>V. Unitario</th>
                    <th>Subtotal</th>
                    {isEditable && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={`item-type-badge ${item.type === 'MANO_OBRA' ? 'type-labor' : 'type-part'}`}>
                          {item.type === 'MANO_OBRA' ? 'Mano de Obra' : 'Repuesto'}
                        </span>
                      </td>
                      <td>{item.description}</td>
                      <td>{item.count}</td>
                      <td>{formatCurrency(item.unit_value)}</td>
                      <td className="total-cell">{formatCurrency(item.count * item.unit_value)}</td>
                      {isEditable && (
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deleteLoading === item.id}
                          >
                            {deleteLoading === item.id ? '...' : 'Eliminar'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="order-total">
              <span className="total-label">Total de la Orden</span>
              <span className="total-amount">{formatCurrency(order.total)}</span>
            </div>
          </>
        ) : (
          <div className="table-empty">
            <p>No hay items registrados en esta orden.</p>
            {isEditable && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowItemForm(true)}
                style={{ marginTop: '8px' }}
              >
                Agregar primer item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkOrderDetail;
