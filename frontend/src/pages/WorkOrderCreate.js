import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bikesAPI, clientsAPI, workOrdersAPI } from "../services/api";
import Modal from '../components/Modal';
import './WorkOrderCreate.css';

function WorkOrderCreate() {
  const navigate = useNavigate();

  const [plateSearch, setPlateSearch] = useState('');
  const [selectedBike, setSelectedBike] = useState(null);
  const [bikeResults, setBikeResults] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [faultDescription, setFaultDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Modal registro nuevo cliente + moto
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    bikePlaca: '',
    bikeBrand: '',
    bikeModel: '',
    bikeCylinder: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Modal asociar moto a cliente existente
  const [showExistingClientModal, setShowExistingClientModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [existingBikeForm, setExistingBikeForm] = useState({
    bikePlaca: '',
    bikeBrand: '',
    bikeModel: '',
    bikeCylinder: '',
  });
  const [existingBikeLoading, setExistingBikeLoading] = useState(false);
  const [existingBikeError, setExistingBikeError] = useState('');
  const [clientsLoading, setClientsLoading] = useState(false);

  // Cargar clientes al abrir modal de cliente existente
  useEffect(() => {
    if (showExistingClientModal) {
      const fetchClients = async () => {
        setClientsLoading(true);
        try {
          const data = await clientsAPI.getAll();
          const list = Array.isArray(data) ? data : (data?.clients || data?.data || []);
          setClients(list);
        } catch (err) {
          console.error('Error cargando clientes:', err);
        } finally {
          setClientsLoading(false);
        }
      };
      fetchClients();
    }
  }, [showExistingClientModal]);

  const searchBike = async () => {
    if (!plateSearch.trim()) return;
    setSearchLoading(true);
    setError('');
    setSearchDone(false);
    try {
      const bikes = await bikesAPI.getAll(plateSearch.trim());
      setBikeResults(Array.isArray(bikes) ? bikes : []);
      setSearchDone(true);
      if (Array.isArray(bikes) && bikes.length === 1) {
        setSelectedBike(bikes[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBike();
    }
  };

  const handleRegisterChange = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setRegisterError('');
    setRegisterForm({
      clientName: '', clientPhone: '', clientEmail: '',
      bikePlaca: '', bikeBrand: '', bikeModel: '', bikeCylinder: '',
    });
  };

  const handleCloseExistingModal = () => {
    setShowExistingClientModal(false);
    setExistingBikeError('');
    setSelectedClient(null);
    setClientSearch('');
    setExistingBikeForm({ bikePlaca: '', bikeBrand: '', bikeModel: '', bikeCylinder: '' });
  };

  // Registrar nuevo cliente + moto
  const handleQuickRegister = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRegisterLoading(true);
    setRegisterError('');

    try {
      const clientRes = await clientsAPI.create({
        name: registerForm.clientName,
        phone: registerForm.clientPhone,
        email: registerForm.clientEmail || undefined,
      });

      const bikeRes = await bikesAPI.create({
        placa: registerForm.bikePlaca,
        brand: registerForm.bikeBrand,
        model: registerForm.bikeModel,
        cylinder: registerForm.bikeCylinder ? parseInt(registerForm.bikeCylinder) : undefined,
        client_id: clientRes.id,
      });

      const fullBike = { ...bikeRes, client: clientRes };
      setSelectedBike(fullBike);
      setPlateSearch(registerForm.bikePlaca);
      handleCloseRegisterModal();
    } catch (err) {
      setRegisterError(err.message || 'Error al registrar. Verifica los datos.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Registrar moto para cliente existente
  const handleExistingClientBike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedClient) {
      setExistingBikeError('Debes seleccionar un cliente.');
      return;
    }

    setExistingBikeLoading(true);
    setExistingBikeError('');

    try {
      const bikeRes = await bikesAPI.create({
        placa: existingBikeForm.bikePlaca,
        brand: existingBikeForm.bikeBrand,
        model: existingBikeForm.bikeModel,
        cylinder: existingBikeForm.bikeCylinder ? parseInt(existingBikeForm.bikeCylinder) : undefined,
        client_id: selectedClient.id,
      });

      const fullBike = { ...bikeRes, client: selectedClient };
      setSelectedBike(fullBike);
      setPlateSearch(existingBikeForm.bikePlaca);
      handleCloseExistingModal();
    } catch (err) {
      setExistingBikeError(err.message || 'Error al registrar la moto.');
    } finally {
      setExistingBikeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBike || !selectedBike.id) {
      setError('Debe seleccionar una moto válida.');
      return;
    }

    if (!faultDescription.trim()) {
      setError('La descripcion de la falla es obligatoria.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await workOrdersAPI.create({
        moto_id: selectedBike.id,
        entry_date: entryDate,
        fault_description: faultDescription,
      });
      navigate(`/ordenes/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clientes filtrados por búsqueda en modal
  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="work-order-create">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Orden de Trabajo</h1>
          <p className="page-subtitle">Registre una nueva orden para el taller</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* PASO 1: Seleccionar Moto */}
        <div className="card create-section">
          <div className="card-header">
            <h2 className="card-title">
              <span className="step-number">1</span>
              Seleccionar Moto
            </h2>
          </div>
          <div className="card-body">
            <div className="search-row">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="plate-search" className="form-label">Buscar por placa</label>
                <input
                  id="plate-search"
                  className="form-control"
                  type="text"
                  placeholder="Ej: ABC123"
                  value={plateSearch}
                  onChange={(e) => {
                    setPlateSearch(e.target.value.toUpperCase());
                    setSearchDone(false);
                    setSelectedBike(null);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary search-btn"
                onClick={searchBike}
                disabled={searchLoading || !plateSearch.trim()}
              >
                {searchLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchDone && bikeResults.length === 0 && (
              <div className="no-results">
                <p>No se encontro ninguna moto con la placa "{plateSearch}".</p>
                <div className="no-results-actions">
                  <button
                    type="button"
                    className="btn btn-new-client"
                    onClick={() => {
                      setRegisterForm((prev) => ({ ...prev, bikePlaca: plateSearch }));
                      setShowRegisterModal(true);
                    }}
                  >
                    + Registrar nuevo cliente y moto
                  </button>
                  <button
                    type="button"
                    className="btn btn-existing-client"
                    onClick={() => {
                      setExistingBikeForm((prev) => ({ ...prev, bikePlaca: plateSearch }));
                      setShowExistingClientModal(true);
                    }}
                  >
                    Asociar a cliente existente
                  </button>
                </div>
              </div>
            )}

            {searchDone && bikeResults.length > 1 && !selectedBike && (
              <div className="bike-results">
                <p className="results-title">Se encontraron {bikeResults.length} resultados:</p>
                {bikeResults.map((bike) => (
                  <button
                    key={bike.id}
                    type="button"
                    className="bike-result-item"
                    onClick={() => setSelectedBike(bike)}
                  >
                    <span className="plate-badge">{bike.placa}</span>
                    <span>{bike.brand} {bike.model}</span>
                    <span className="result-client">{bike.client?.name}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedBike && (
              <div className="selected-bike">
                <div className="selected-bike-header">
                  <span className="selected-label">Moto seleccionada</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setSelectedBike(null);
                      setPlateSearch('');
                      setSearchDone(false);
                      setBikeResults([]);
                    }}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="selected-bike-info">
                  <div className="info-item">
                    <span className="info-label">Placa</span>
                    <span className="info-value plate-badge">{selectedBike.placa}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Marca/Modelo</span>
                    <span className="info-value">{selectedBike.brand} {selectedBike.model}</span>
                  </div>
                  {selectedBike.cylinder && (
                    <div className="info-item">
                      <span className="info-label">Cilindraje</span>
                      <span className="info-value">{selectedBike.cylinder}cc</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Cliente</span>
                    <span className="info-value">{selectedBike.client?.name || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {!searchDone && !selectedBike && (
              <p className="helper-text">
                Busque la moto por placa,{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowRegisterModal(true)}
                >
                  registre un nuevo cliente y moto
                </button>
                {' '}o{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowExistingClientModal(true)}
                >
                  asocie una moto a un cliente existente
                </button>.
              </p>
            )}
          </div>
        </div>

        {/* PASO 2: Datos de la Orden */}
        <div className="card create-section">
          <div className="card-header">
            <h2 className="card-title">
              <span className="step-number">2</span>
              Datos de la Orden
            </h2>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="entry-date" className="form-label">Fecha de ingreso</label>
                <input
                  id="entry-date"
                  className="form-control"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="fault-description" className="form-label">Descripcion de la falla</label>
              <textarea
                id="fault-description"
                className="form-control"
                placeholder="Describa la falla o el motivo de ingreso de la moto..."
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/ordenes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !selectedBike || !faultDescription.trim()}
          >
            {loading ? 'Creando orden...' : 'Crear Orden de Trabajo'}
          </button>
        </div>
      </form>

      {/* ============ MODAL: Nuevo cliente + moto ============ */}
      <Modal
        isOpen={showRegisterModal}
        onClose={handleCloseRegisterModal}
        title="Registro rapido - Cliente y Moto"
      >
        <form onSubmit={handleQuickRegister} onClick={(e) => e.stopPropagation()}>
          {registerError && <div className="alert alert-error">{registerError}</div>}

          <h4 className="modal-section-title">Datos del Cliente</h4>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              className="form-control"
              type="text"
              placeholder="Nombre completo"
              value={registerForm.clientName}
              onChange={(e) => handleRegisterChange('clientName', e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefono *</label>
              <input
                className="form-control"
                type="text"
                placeholder="3001234567"
                value={registerForm.clientPhone}
                onChange={(e) => handleRegisterChange('clientPhone', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                placeholder="correo@ejemplo.com"
                value={registerForm.clientEmail}
                onChange={(e) => handleRegisterChange('clientEmail', e.target.value)}
              />
            </div>
          </div>

          <h4 className="modal-section-title">Datos de la Moto</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Placa *</label>
              <input
                className="form-control"
                type="text"
                placeholder="ABC123"
                value={registerForm.bikePlaca}
                onChange={(e) => handleRegisterChange('bikePlaca', e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Marca *</label>
              <input
                className="form-control"
                type="text"
                placeholder="Yamaha, Honda..."
                value={registerForm.bikeBrand}
                onChange={(e) => handleRegisterChange('bikeBrand', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Modelo *</label>
              <input
                className="form-control"
                type="text"
                placeholder="FZ 2.0, CB 160..."
                value={registerForm.bikeModel}
                onChange={(e) => handleRegisterChange('bikeModel', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cilindraje</label>
              <input
                className="form-control"
                type="number"
                placeholder="150"
                value={registerForm.bikeCylinder}
                onChange={(e) => handleRegisterChange('bikeCylinder', e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseRegisterModal}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={registerLoading}>
              {registerLoading ? 'Registrando...' : 'Registrar y Seleccionar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============ MODAL: Cliente existente + nueva moto ============ */}
      <Modal
        isOpen={showExistingClientModal}
        onClose={handleCloseExistingModal}
        title="Asociar nueva moto a cliente existente"
      >
        <form onSubmit={handleExistingClientBike} onClick={(e) => e.stopPropagation()}>
          {existingBikeError && <div className="alert alert-error">{existingBikeError}</div>}

          {/* Seleccionar cliente */}
          <h4 className="modal-section-title">Seleccionar Cliente</h4>
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              placeholder="Buscar por nombre, telefono o email..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>

          {clientsLoading ? (
            <p className="modal-loading">Cargando clientes...</p>
          ) : (
            <div className="existing-clients-list">
              {filteredClients.length === 0 ? (
                <p className="no-clients-msg">No se encontraron clientes</p>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`existing-client-item${selectedClient?.id === client.id ? ' selected' : ''}`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="ec-avatar">
                      {client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="ec-info">
                      <span className="ec-name">{client.name}</span>
                      {client.phone && <span className="ec-detail">{client.phone}</span>}
                      {client.email && <span className="ec-detail">{client.email}</span>}
                    </div>
                    {selectedClient?.id === client.id && (
                      <span className="ec-check">✓</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Datos de la nueva moto */}
          {selectedClient && (
            <>
              <h4 className="modal-section-title" style={{ marginTop: '20px' }}>
                Nueva Moto para <strong>{selectedClient.name}</strong>
              </h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="ABC123"
                    value={existingBikeForm.bikePlaca}
                    onChange={(e) => setExistingBikeForm(p => ({ ...p, bikePlaca: e.target.value.toUpperCase() }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Marca *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Yamaha, Honda..."
                    value={existingBikeForm.bikeBrand}
                    onChange={(e) => setExistingBikeForm(p => ({ ...p, bikeBrand: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Modelo *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="FZ 2.0, CB 160..."
                    value={existingBikeForm.bikeModel}
                    onChange={(e) => setExistingBikeForm(p => ({ ...p, bikeModel: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cilindraje</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="150"
                    value={existingBikeForm.bikeCylinder}
                    onChange={(e) => setExistingBikeForm(p => ({ ...p, bikeCylinder: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseExistingModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={existingBikeLoading || !selectedClient}
            >
              {existingBikeLoading ? 'Registrando...' : 'Registrar Moto y Seleccionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default WorkOrderCreate;