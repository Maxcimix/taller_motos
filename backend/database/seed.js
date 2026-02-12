import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { User } from '../models/index.js';

const ADMIN_EMAIL = 'admin@pavas.com';
const ADMIN_PASSWORD = 'Admin123*';
const SALT_ROUNDS = 12;

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });

    const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log(`Usuario ADMIN (${ADMIN_EMAIL}) ya existe. Seed omitido.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    await User.create({
      name: 'Administrador',
      email: ADMIN_EMAIL,
      password_hash: hash,
      role: 'ADMIN',
      active: true,
    });

    console.log(`Usuario ADMIN creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error.message);
    process.exit(1);
  }
};

seed();
