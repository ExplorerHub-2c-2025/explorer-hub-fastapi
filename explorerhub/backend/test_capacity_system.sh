#!/bin/bash
# Test script for capacity management system

echo "Testing Capacity Management System..."
echo "===================================="

# Change to backend directory
cd /home/facundo/Desktop/explorer-hub-fastapi/explorerhub/backend

# Activate virtual environment
source .venv/bin/activate

# Test capacity release script
echo "1. Testing manual capacity release..."
python3 scripts/release_expired_capacity.py

echo ""
echo "2. Testing capacity scheduler..."
python3 scripts/capacity_scheduler.py

echo ""
echo "3. Checking systemd service status..."
sudo systemctl status capacity-scheduler.service --no-pager -l

echo ""
echo "4. Checking systemd timer status..."
sudo systemctl status capacity-scheduler.timer --no-pager -l

echo ""
echo "Capacity management system test completed!"
