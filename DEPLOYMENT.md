# Harvest Planner Deployment Guide

## Ubuntu VM Deployment (DigitalOcean)

### Prerequisites
- Ubuntu 20.04+ VM
- Node.js 18+ installed
- .NET 9.0 SDK installed
- PM2 installed globally

### Quick Setup

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x start-production.sh
   chmod +x monitor.sh
   ```

3. **Start the application:**
   ```bash
   ./start-production.sh
   ```

4. **Check status:**
   ```bash
   ./monitor.sh
   ```

### Manual PM2 Commands

```bash
# Start both services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Systemd Service (Optional)

For even more robust startup, you can use systemd:

1. **Copy the service file:**
   ```bash
   sudo cp harvest-planner.service /etc/systemd/system/
   ```

2. **Edit the service file:**
   ```bash
   sudo nano /etc/systemd/system/harvest-planner.service
   ```
   Update the `WorkingDirectory` path to your actual project directory.

3. **Enable and start:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable harvest-planner
   sudo systemctl start harvest-planner
   ```

### Monitoring

- **Health Check:** `curl http://localhost:5000/api/health`
- **Frontend:** `curl http://localhost:3000`
- **PM2 Status:** `pm2 status`
- **System Logs:** `journalctl -u harvest-planner -f`

### Troubleshooting

1. **Services not starting:**
   ```bash
   pm2 logs
   ```

2. **Port conflicts:**
   ```bash
   netstat -tlnp | grep :3000
   netstat -tlnp | grep :5000
   ```

3. **Memory issues:**
   ```bash
   pm2 monit
   ```

4. **Restart everything:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   pm2 save
   ```

### Auto-restart on Server Reboot

PM2 will automatically restart your services when the server reboots if you run:
```bash
pm2 startup
pm2 save
```

### Log Management

Logs are stored in the `./logs/` directory:
- `frontend-error.log` - Frontend errors
- `frontend-out.log` - Frontend output
- `backend-error.log` - Backend errors
- `backend-out.log` - Backend output

### Security Notes

- Make sure your VM has proper firewall rules
- Consider using a reverse proxy (nginx) for production
- Use HTTPS in production
- Keep your session key secure
