import React, { useState, useEffect, useCallback } from "react";
import { usersAPI, authAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import "./UserManagement.css";

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "MECANICO",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      await authAPI.register(formData);
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "", role: "MECANICO" });
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await usersAPI.toggleActive(userId);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-management">
      <div className="page-header">
        <h2>Gestion de Usuarios</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Nuevo Usuario
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.active ? "inactive-row" : ""}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === currentUser.id}
                    className={`role-select role-${user.role.toLowerCase()}`}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MECANICO">MECANICO</option>
                  </select>
                </td>
                <td>
                  <span className={`user-status ${user.active ? "active" : "inactive"}`}>
                    {user.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  {user.id !== currentUser.id && (
                    <button
                      className={`btn btn-sm ${user.active ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleToggleActive(user.id)}
                    >
                      {user.active ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Usuario">
        <form onSubmit={handleCreate}>
          {formError && <div className="error-message">{formError}</div>}
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contrasena (min 6 caracteres)</label>
            <input
              type="password" required minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="MECANICO">MECANICO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={formLoading}>
            {formLoading ? "Creando..." : "Crear Usuario"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default UserManagement;