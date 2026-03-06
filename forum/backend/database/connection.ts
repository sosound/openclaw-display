import { Pool, PoolClient } from 'pg';
import { config } from '../config/index.js';

export class Database {
  private pool: Pool;
  private connected: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();
      this.connected = true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.connected = false;
    console.log('Database connection closed');
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const db = new Database();
