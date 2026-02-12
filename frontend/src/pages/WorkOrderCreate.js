import React, { useState } from 'react';
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

  const handleQuickRegister = async (e) => {
    e.preventDefault();
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
      setShowRegisterModal(false);


      setRegisterForm({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        bikePlaca: '',
        bikeBrand: '',
        bikeModel: '',
        bikeCylinder: '',
      });
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
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

        { }
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
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    setRegisterForm((prev) => ({ ...prev, bikePlaca: plateSearch }));
                    setShowRegisterModal(true);
                  }}
                >
                  Registrar cliente y moto
                </button>
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
                Busque la moto por placa o{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowRegisterModal(true)}
                >
                  registre un nuevo cliente y moto
                </button>.
              </p>
            )}
          </div>
        </div>

        { }
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

        { }
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

      { }
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Registro rapido - Cliente y Moto"
      >
        <form onSubmit={handleQuickRegister}>
          {registerError && <div className="alert alert-error">{registerError}</div>}

          <h4 className="modal-section-title">Datos del Cliente</h4>
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">Nombre *</label>
            <input
              id="reg-name"
              className="form-control"
              type="text"
              placeholder="Nombre completo"
              value={registerForm.clientName}
              onChange={(e) => handleRegisterChange('clientName', e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-phone" className="form-label">Telefono *</label>
              <input
                id="reg-phone"
                className="form-control"
                type="text"
                placeholder="3001234567"
                value={registerForm.clientPhone}
                onChange={(e) => handleRegisterChange('clientPhone', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-placa" className="form-label">Placa *</label>
              <input
                id="reg-placa"
                className="form-control"
                type="text"
                placeholder="ABC123"
                value={registerForm.bikePlaca}
                onChange={(e) => handleRegisterChange('bikePlaca', e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-brand" className="form-label">Marca *</label>
              <input
                id="reg-brand"
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
              <label htmlFor="reg-model" className="form-label">Modelo *</label>
              <input
                id="reg-model"
                className="form-control"
                type="text"
                placeholder="FZ 2.0, CB 160..."
                value={registerForm.bikeModel}
                onChange={(e) => handleRegisterChange('bikeModel', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-cylinder" className="form-label">Cilindraje</label>
              <input
                id="reg-cylinder"
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
              onClick={() => setShowRegisterModal(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={registerLoading}
            >
              {registerLoading ? 'Registrando...' : 'Registrar y Seleccionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default WorkOrderCreate;
