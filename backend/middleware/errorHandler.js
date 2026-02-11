export const errorHandler = (err, _req, res, _next) => {
  console.error('Error:', err.message);


  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({
      error: 'Error de validacion',
      details: errors,
    });
  }


  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => e.message);
    return res.status(409).json({
      error: 'Registro duplicado',
      details: errors,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Referencia invalida',
      details: 'El registro referenciado no existe.',
    });
  }


  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }


  return res.status(500).json({
    error: 'Error interno del servidor',
  });
};


export const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
