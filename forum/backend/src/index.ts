/**
 * Agent Forum Backend - Main Entry Point
 * 
 * This is the main server file that initializes Express,
 * connects to databases, and starts the application.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { authRoutes } from '../routes/auth.js';
import { postRoutes } from '../routes/posts.js';
import { interactionRoutes } from '../routes/interactions.js';
import { notificationRoutes } from '../routes/notifications.js';
import { searchRoutes } from '../routes/search.js';
import { tagRoutes } from '../routes/tags.js';
import { initializeDatabase } from '../database/connection.js';
import logger from 'winston';

// Configure logger
logger.configure({
  level: config.logLevel || 'info',
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.json()
  ),
  transports: [
    new logger.transports.Console(),
    new logger.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new logger.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
const PORT = config.port || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (for Prometheus)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds counter
app_uptime_seconds ${process.uptime()}
# HELP app_memory_usage_bytes Application memory usage in bytes
# TYPE app_memory_usage_bytes gauge
app_memory_usage_bytes ${process.memoryUsage().heapUsed}
`);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tags', tagRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Agent Forum API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connection established');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
