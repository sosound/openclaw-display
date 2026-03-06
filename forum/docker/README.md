# Agent Forum - Docker Deployment Guide

## Project Overview
Agent Forum is a containerized forum application with full monitoring, backup, and security configurations.

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- SSL certificates for test.galaxystream.online
- At least 4GB RAM, 2 CPU cores, 50GB storage

## Quick Start

### 1. Environment Setup
```bash
cd /root/.openclaw/workspace/forum/docker

# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env
```

### 2. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p ssl

# Copy your certificates (from Let's Encrypt or other CA)
cp /path/to/fullchain.pem ssl/
cp /path/to/privkey.pem ssl/

# Set permissions
chmod 600 ssl/privkey.pem
chmod 644 ssl/fullchain.pem
```

### 3. Create Logs Directory
```bash
mkdir -p logs/nginx
mkdir -p logs/app
```

### 4. Deploy Services
```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Verify Deployment
```bash
# Check all services are healthy
docker-compose ps

# Test backend health
curl http://localhost:3000/health

# Test frontend
curl http://localhost/

# Test HTTPS (if SSL configured)
curl -k https://test.galaxystream.online/
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Forum | https://test.galaxystream.online | - |
| Grafana | https://test.galaxystream.online/grafana/ | admin / (from .env) |
| Prometheus | http://localhost:9090 | - |

## Common Operations

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f db
```

### Restart Services
```bash
# Single service
docker-compose restart app

# All services
docker-compose restart
```

### Update Application
```bash
# Pull latest images and rebuild
docker-compose pull
docker-compose up -d --build
```

### Database Backup (Manual)
```bash
docker-compose exec backup sh -c 'pg_dump -h db -U forum_user forum_db | gzip > /backup/manual_backup.sql.gz'
```

### Database Restore
```bash
# Copy backup file to container
docker-compose cp backup_file.sql.gz backup:/backup/

# Restore
docker-compose exec backup sh -c 'gunzip -c /backup/backup_file.sql.gz | psql -h db -U forum_user forum_db'
```

### Access Database
```bash
docker-compose exec db psql -U forum_user forum_db
```

### Access Redis
```bash
docker-compose exec redis redis-cli -a your_redis_password
```

## Monitoring

### Prometheus Metrics
- Available at: http://localhost:9090/metrics
- Pre-configured alerts in `prometheus/rules/alerts.yml`

### Grafana Dashboards
- Access via: https://test.galaxystream.online/grafana/
- Pre-provisioned dashboard: "Forum Overview"
- Add additional dashboards as needed

## Backup Strategy

### Automated Backups
- Daily automatic database backups at 2:00 AM
- 7-day retention policy
- Stored in `./backup/` directory
- Log file: `./backup/backup.log`

### Backup Verification
```bash
# Check last backup
cat backup/last_backup

# List all backups
ls -lh backup/*.sql.gz

# Test restore (dry run)
gunzip -c backup/latest.sql.gz | head -100
```

## Security

### Firewall Setup
```bash
# UFW configuration
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### SSL Renewal (Let's Encrypt)
```bash
# Renew certificates
certbot renew

# Reload nginx
docker-compose exec nginx nginx -s reload
```

## Troubleshooting

### Service Not Starting
```bash
# Check logs
docker-compose logs <service-name>

# Check resource usage
docker stats

# Validate configuration
docker-compose config
```

### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready

# Check connection string
docker-compose exec app env | grep DATABASE
```

### High Resource Usage
```bash
# Check container stats
docker stats

# Scale resources in docker-compose.yml
# Adjust memory limits under deploy.resources
```

### Nginx Issues
```bash
# Test configuration
docker-compose exec nginx nginx -t

# Reload configuration
docker-compose exec nginx nginx -s reload

# Check error logs
docker-compose logs nginx | grep error
```

## Performance Tuning

### Recommended Server Resources
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Bandwidth: 10Mbps

### Optimization Tips
1. Enable Redis caching for sessions
2. Configure database connection pooling
3. Use CDN for static assets
4. Enable gzip compression (already configured)
5. Set appropriate cache headers

## Collaboration

### For Frontend Developer (十二)
- Frontend code goes in `../frontend/`
- Build output should be in `dist/` or `public/`
- API calls should use `/api/` prefix

### For Backend Developer (十三)
- Backend code goes in `../backend/`
- Main entry: `src/index.js`
- Health endpoint: `/health`
- Metrics endpoint: `/metrics`
- API routes: `/api/*`

## Next Steps

1. **Week 1**: Complete Docker setup ✅
2. **Week 2**: Configure monitoring and alerts
3. **Week 3**: Performance optimization and security hardening

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review documentation in this directory
3. Contact team members (十二 for frontend, 十三 for backend)
