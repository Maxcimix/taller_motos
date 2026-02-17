import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import './UserManagement.css';

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  MECANICO: 'Mecanico',
};

function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modal de crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MECANICO',
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/ordenes');
      return;
    }
    fetchUsers();
  }, [fetchUsers, isAdmin, navigate]);

  const handleToggleActive = async (userId) => {
    if (userId === currentUser.id) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }
    setActionLoading(userId);
    try {
      await usersAPI.toggleActive(userId);
      await fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (userId === currentUser.id) {
      alert('No puedes cambiar tu propio rol.');
      return;
    }
    setActionLoading(userId);
    try {
      await usersAPI.updateRole(userId, newRole);
      await fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await authAPI.register(createForm);
      setCreateForm({ name: '', email: '', password: '', role: 'MECANICO' });
      setShowCreateModal(false);
      await fetchUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Cargando usuarios..." />;

  return (
    <div className="user-management">
      <div className="um-header">
        <h1 className="page-title">Gestion de Usuarios</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="um-stats">
        <div className="um-stat-card">
          <span className="um-stat-number">{users.length}</span>
          <span className="um-stat-label">Total Usuarios</span>
        </div>
        <div className="um-stat-card">
          <span className="um-stat-number">
            {users.filter((u) => u.role === 'ADMIN').length}
          </span>
          <span className="um-stat-label">Administradores</span>
        </div>
        <div className="um-stat-card">
          <span className="um-stat-number">
            {users.filter((u) => u.role === 'MECANICO').length}
          </span>
          <span className="um-stat-label">Mecanicos</span>
        </div>
        <div className="um-stat-card">
          <span className="um-stat-number">
            {users.filter((u) => u.active).length}
          </span>
          <span className="um-stat-label">Activos</span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.active ? 'row-inactive' : ''}>
                  <td>{u.id}</td>
                  <td>
                    <div className="um-user-name">
                      {u.name}
                      {u.id === currentUser.id && (
                        <span className="um-you-badge">Tu</span>
                      )}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="um-role-select"
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      disabled={u.id === currentUser.id || actionLoading === u.id}
                    >
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                      <option value="MECANICO">{ROLE_LABELS.MECANICO}</option>
                    </select>
                  </td>
                  <td>
                    <span className={`um-status-badge ${u.active ? 'active' : 'inactive'}`}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {new Date(u.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    {u.id !== currentUser.id && (
                      <button
                        className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleActive(u.id)}
                        disabled={actionLoading === u.id}
                      >
                        {actionLoading === u.id
                          ? '...'
                          : u.active
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear usuario */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Crear Nuevo Usuario">
          <form onSubmit={handleCreateUser} className="um-create-form">
            {createError && <div className="alert alert-error">{createError}</div>}

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                className="form-control"
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Nombre completo"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-control"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contrasena * (min. 6 caracteres)</label>
              <input
                className="form-control"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Minimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rol *</label>
              <select
                className="form-control"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                <option value="MECANICO">Mecanico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div className="um-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createLoading}
              >
                {createLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default UserManagement;