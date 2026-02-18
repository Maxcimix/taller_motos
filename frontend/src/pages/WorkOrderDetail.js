import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workOrdersAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import './WorkOrderDetail.css';
import { useAuth } from '../context/AuthContext';

const STATUS_TRANSITIONS = {
  RECIBIDA:   ['DIAGNOSTICO', 'CANCELADA'],
  DIAGNOSTICO: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO:  ['LISTA', 'CANCELADA'],
  LISTA:       ['ENTREGADA', 'CANCELADA'],
  ENTREGADA:   [],
  CANCELADA:   [],
};

const VEHICLE_TYPE_LABELS = {
  MOTORCYCLE: 'Motocicleta',
  CAR:        'Automovil',
  TRUCK:      'Camion',
  VAN:        'Van',
  BUS:        'Bus',
  OTHER:      'Otro',
};

function WorkOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError]     = useState('');

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    type: 'MANO_OBRA', description: '', count: 1, unit_value: '',
  });
  const [itemLoading, setItemLoading]   = useState(false);
  const [itemError, setItemError]       = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage]       = useState(1);
  const [historyPagination, setHistoryPagination] = useState(null);

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

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await workOrdersAPI.getHistory(id, page);
      setHistory(res.data || []);
      setHistoryPagination(res.pagination || null);
      setHistoryPage(page);
    } catch (err) {
      console.error('Error cargando historial:', err.message);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchHistory();
  }, [fetchOrder, fetchHistory]);

  const handleStatusChange = async (newStatus) => {
    const note = window.prompt('Nota del cambio de estado (opcional):') || '';
    setStatusLoading(true);
    setStatusError('');
    try {
      await workOrdersAPI.updateStatus(id, newStatus, note);
      await fetchOrder();
      await fetchHistory();
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
        type:        itemForm.type,
        description: itemForm.description,
        count:       parseInt(itemForm.count),
        unit_value:  parseFloat(itemForm.unit_value),
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
    setItemError('');
    try {
      await workOrdersAPI.deleteItem(id, itemId);
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0,
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

  // Usar vehicle en lugar de bike
  const vehicle = order.vehicle;
  const client  = vehicle?.client;

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
        {/* Informacion del vehiculo */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Informacion del Vehiculo</h2>
          </div>
          <div className="card-body">
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Placa</span>
                <span className="info-value">
                  <span className="plate-badge">{vehicle?.plate || '-'}</span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Tipo</span>
                <span className="info-value">
                  {VEHICLE_TYPE_LABELS[vehicle?.type_vehicle] || vehicle?.type_vehicle || '-'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Marca</span>
                <span className="info-value">{vehicle?.brand || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Modelo</span>
                <span className="info-value">{vehicle?.model || '-'}</span>
              </div>
              {vehicle?.cylinder && (
                <div className="info-item">
                  <span className="info-label">Cilindraje</span>
                  <span className="info-value">{vehicle.cylinder}cc</span>
                </div>
              )}
              {vehicle?.operating_hours !== undefined && vehicle?.operating_hours !== null && (
                <div className="info-item">
                  <span className="info-label">Horas de funcionamiento</span>
                  <span className="info-value">{vehicle.operating_hours} hrs</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informacion del cliente */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Informacion del Cliente</h2>
          </div>
          <div className="card-body">
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Nombre</span>
                <span className="info-value">{client?.name || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Telefono</span>
                <span className="info-value">{client?.phone || '-'}</span>
              </div>
              {client?.email && (
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{client.email}</span>
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
          <p className="fault-description">{order.fault_description}</p>
        </div>
      </div>

      {/* Cambio de estado */}
      {isEditable && allowedTransitions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Cambiar Estado</h2>
          </div>
          <div className="card-body">
            <div className="status-actions">
              {allowedTransitions.map((s) => (
                <button
                  key={s}
                  className="btn btn-secondary"
                  onClick={() => handleStatusChange(s)}
                  disabled={statusLoading}
                  type="button"
                >
                  {statusLoading ? 'Cambiando...' : `→ ${s.replace('_', ' ')}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Items de la orden */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Items de la Orden</h2>
          {isEditable && (
            <button
              type="button"
              className={`btn btn-sm ${showItemForm ? 'btn-secondary' : 'btn-primary'}`}
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
                  <button type="submit" className="btn btn-success" disabled={itemLoading}>
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
                            type="button"
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
                type="button"
              >
                Agregar primer item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Historial de Cambios de Estado */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Historial de Cambios de Estado</h2>
        </div>
        <div className="card-body">
          {historyLoading ? (
            <LoadingSpinner text="Cargando historial..." />
          ) : history.length > 0 ? (
            <>
              <div className="history-timeline">
                {history.map((entry, index) => (
                  <div key={entry.id} className="history-entry">
                    <div className="history-dot" />
                    {index < history.length - 1 && <div className="history-line" />}
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-user">
                          {entry.changedBy?.name || 'Usuario desconocido'}
                        </span>
                        <span className="history-date">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </div>
                      <div className="history-status-change">
                        {entry.from_status ? (
                          <>
                            <StatusBadge status={entry.from_status} />
                            <span className="history-arrow">&rarr;</span>
                            <StatusBadge status={entry.to_status} />
                          </>
                        ) : (
                          <>
                            <span>Orden creada como</span>
                            <StatusBadge status={entry.to_status} />
                          </>
                        )}
                      </div>
                      {entry.note && (
                        <div className="history-note">
                          <strong>Nota:</strong> {entry.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {historyPagination && historyPagination.totalPages > 1 && (
                <div className="history-pagination">
                  <button
                    className="btn btn-sm btn-secondary"
                    disabled={historyPage <= 1}
                    onClick={() => fetchHistory(historyPage - 1)}
                    type="button"
                  >
                    Anterior
                  </button>
                  <span className="history-pagination-info">
                    Pagina {historyPage} de {historyPagination.totalPages}
                  </span>
                  <button
                    className="btn btn-sm btn-secondary"
                    disabled={historyPage >= historyPagination.totalPages}
                    onClick={() => fetchHistory(historyPage + 1)}
                    type="button"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="table-empty">
              <p>No hay registros de cambios de estado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkOrderDetail;