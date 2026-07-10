import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import registrationRoutes from './routes/registrations';
import sessionRoutes from './routes/sessions';
import toolRoutes from './routes/tools';
import keyRoutes from './routes/keys';
import sellerRoutes from './routes/sellers';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());

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
