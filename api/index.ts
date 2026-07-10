import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../backend/db.js';
import authRoutes from '../backend/routes/auth.js';
import registrationRoutes from '../backend/routes/registrations.js';
import sessionRoutes from '../backend/routes/sessions.js';
import toolRoutes from '../backend/routes/tools.js';
import keyRoutes from '../backend/routes/keys.js';
import sellerRoutes from '../backend/routes/sellers.js';
import dashboardRoutes from '../backend/routes/dashboard.js';

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
