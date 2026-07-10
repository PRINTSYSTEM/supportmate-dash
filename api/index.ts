import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import registrationRoutes from './routes/registrations.js';
import sessionRoutes from './routes/sessions.js';
import toolRoutes from './routes/tools.js';
import keyRoutes from './routes/keys.js';
import sellerRoutes from './routes/sellers.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ensure MongoDB connection for every request (cached, only connects once)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    _res.status(500).json({ message: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vercel serverless: chỉ chạy listen khi không ở môi trường serverless
const PORT = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
}

export default app;
