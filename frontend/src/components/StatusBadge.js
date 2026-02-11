import React from 'react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  RECIBIDA: { label: 'Recibida', className: 'badge-info' },
  DIAGNOSTICO: { label: 'Diagnostico', className: 'badge-warning' },
  EN_PROCESO: { label: 'En Proceso', className: 'badge-primary' },
  LISTA: { label: 'Lista', className: 'badge-success' },
  ENTREGADA: { label: 'Entregada', className: 'badge-neutral' },
  CANCELADA: { label: 'Cancelada', className: 'badge-danger' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-neutral' };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
