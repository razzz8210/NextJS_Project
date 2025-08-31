import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DataSource } from 'typeorm'; 
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes (add later)
// app.use('/api/auth', authRoutes);

// Database Connection
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/entities/*.entity{.ts,.js}'],
  synchronize: true, 
});

AppDataSource.initialize()
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database error:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));