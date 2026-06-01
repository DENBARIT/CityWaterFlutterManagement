import express from 'express';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import subcityAdminRoutes from './modules/subcityAdmin/subcityAdminRoutes.js';
import superAdminRoutes from './modules/superAdmin/superAdminRoutes.js';
import authRoutes from './modules/auth/authRoutes.js';
import locationRoutes from './modules/location/locationRoutes.js';
import SuperAdminService from './modules/superAdmin/superAdminService.js';
import cors from 'cors';
// Load environment variables from .env
config();

if (process.env.ENABLE_EMAIL_QUEUE === 'true') {
  await import('./queues/emailQueue.js');
}

connectDB();

const app = express();
// respect proxy headers when running behind a reverse proxy/load balancer
app.set('trust proxy', true);
// Middleware
app.use(cors());
// body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = Number(process.env.PORT || 5001);
// Routes

app.get('/health', (_req, res) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'ok',
    message: 'Backend is listening and responding',
  });
});

app.use('/auth', authRoutes);
app.use('/locations', locationRoutes);
app.use('/super-admin', superAdminRoutes);
app.use('/subcity-admin', subcityAdminRoutes);

let server = null;
const ocrLifecycleIntervalMs = Number(process.env.OCR_LIFECYCLE_INTERVAL_MS || 60 * 60 * 1000);
const billingLifecycleIntervalMs = Number(
  process.env.BILLING_LIFECYCLE_INTERVAL_MS || 6 * 60 * 60 * 1000
);
let ocrLifecycleTimer = null;
let billingLifecycleTimer = null;

const runOcrLifecycle = async () => {
  try {
    await SuperAdminService.processOcrWindowLifecycle();
  } catch (error) {
    console.error('OCR lifecycle processing failed:', error);
  }
};

const runBillingLifecycle = async () => {
  try {
    await SuperAdminService.processBillingPenaltyLifecycle();
  } catch (error) {
    console.error('Billing lifecycle processing failed:', error);
  }
};

server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  void runOcrLifecycle();
  void runBillingLifecycle();

  ocrLifecycleTimer = setInterval(() => {
    void runOcrLifecycle();
  }, ocrLifecycleIntervalMs);

  billingLifecycleTimer = setInterval(() => {
    void runBillingLifecycle();
  }, billingLifecycleIntervalMs);
});

// Graceful shutdown helper
const shutdown = async (code = 0, reason = 'shutdown') => {
  console.log(`Shutdown initiated (${reason}). Cleaning up...`);

  if (ocrLifecycleTimer) {
    clearInterval(ocrLifecycleTimer);
    ocrLifecycleTimer = null;
  }

  if (billingLifecycleTimer) {
    clearInterval(billingLifecycleTimer);
    billingLifecycleTimer = null;
  }

  // Close server first so no new requests are accepted
  if (server) {
    try {
      server.close(async (closeErr) => {
        if (closeErr) {
          console.error('Error closing server:', closeErr);
        }

        try {
          await disconnectDB();
        } catch (err) {
          console.error('Error disconnecting DB:', err);
        } finally {
          console.log('Shutdown complete, exiting.');
          process.exit(code);
        }
      });

      // Force exit if close hangs
      setTimeout(() => {
        console.warn('Forcing shutdown after timeout');
        process.exit(code);
      }, 10000).unref();
    } catch (err) {
      console.error('Error during server close:', err);
      try {
        await disconnectDB();
      } catch (dbErr) {
        console.error('Error disconnecting DB after close failure:', dbErr);
      }
      process.exit(code);
    }

    return;
  }

  // If no server instance, just disconnect DB and exit
  try {
    await disconnectDB();
  } catch (err) {
    console.error('Error disconnecting DB:', err);
  }

  process.exit(code);
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  void shutdown(1, 'unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  void shutdown(1, 'uncaughtException');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  void shutdown(0, 'SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  void shutdown(0, 'SIGINT');
});
