import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sequelize } from './config/database.js';
import clientRoutes from './routes/clients.js';
import bikeRoutes from './routes/bikes.js';
import workOrderRoutes from './routes/workOrders.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/work-orders', workOrderRoutes);

// Ruta de salud
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Taller de Motos API funcionando correctamente' });
});

// Middleware de errores (debe ir al final)
app.use(errorHandler);

// Conexion a BD y arranque del servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexion a MySQL establecida correctamente.');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: false });
    console.log('Modelos sincronizados con la base de datos.');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
};

startServer();
