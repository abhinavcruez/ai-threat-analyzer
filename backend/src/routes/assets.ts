import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/agent.sh', (req: Request, res: Response) => {
  const script = `#!/bin/bash
# AI Threat Analyzer - Auto Discovery Agent
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <BACKEND_URL> <AUTH_TOKEN>"
    exit 1
fi
BACKEND_URL=$1
TOKEN=$2
IP_ADDRESS=$(hostname -I | awk '{print $1}')
HOSTNAME=$(hostname)

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$PRETTY_NAME
else
    OS_NAME="Linux System"
fi

KERNEL=$(uname -r)

echo "Registering Host System ($HOSTNAME)..."
curl -s -X POST "$BACKEND_URL/api/assets" \\
     -H "Authorization: Bearer $TOKEN" \\
     -H "Content-Type: application/json" \\
     -d "{\\"name\\": \\"Host: $HOSTNAME\\", \\"type\\": \\"Server\\", \\"version\\": \\"$OS_NAME\\", \\"ip_address\\": \\"$IP_ADDRESS\\", \\"status\\": \\"online\\", \\"details\\": \\"Kernel: $KERNEL\\"}" > /dev/null

echo "\\nScanning ALL Active Services..."
ACTIVE_SERVICES=$(systemctl list-units --type=service --state=active --no-legend | awk '{print $1}' | sed 's/\\.service//' | grep -vE 'systemd|getty|dbus|polkit|plymouth|modprobe|wpa_supplicant|upower|rtkit|networkd|resolved|timesyncd|user@')

for SERVICE in $ACTIVE_SERVICES; do
    VERSION=$(dpkg-query -W -f='\${Version}' $SERVICE 2>/dev/null | cut -d':' -f2 | cut -d'-' -f1)
    if [ -z "$VERSION" ]; then VERSION="Unknown"; fi
    
    STATUS="active"
    DETAILS=$(systemctl status $SERVICE | grep "Active:" | xargs)
    
    curl -s -X POST "$BACKEND_URL/api/assets" \\
         -H "Authorization: Bearer $TOKEN" \\
         -H "Content-Type: application/json" \\
         -d "{\\"name\\": \\"$SERVICE (on $HOSTNAME)\\", \\"type\\": \\"Service\\", \\"version\\": \\"$VERSION\\", \\"ip_address\\": \\"$IP_ADDRESS\\", \\"status\\": \\"$STATUS\\", \\"details\\": \\"$DETAILS\\"}" > /dev/null
done
echo "\\nScan complete!"
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
});

import { auditHost } from '../services/assetAuditor';

router.get('/', async (req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany();
    res.json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostIp, services } = req.body;
    if (!hostIp || !services || !Array.isArray(services)) {
      res.status(400).json({ error: 'hostIp and services array are required' });
      return;
    }
    const auditResult = await auditHost(hostIp, services);
    res.json(auditResult);
  } catch (error) {
    console.error('Audit failed:', error);
    res.status(500).json({ error: 'Audit failed' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, version, ip_address, status, details } = req.body;
    
    if (!name || !type) {
      res.status(400).json({ error: 'Name and type are required' });
      return;
    }

    const asset = await prisma.asset.create({
      data: { name, type, version, ip_address, status, details },
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, version, ip_address, status, details } = req.body;
    
    const asset = await prisma.asset.update({
      where: { id: parseInt(id) },
      data: { name, type, version, ip_address, status, details },
    });

    res.json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.asset.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
