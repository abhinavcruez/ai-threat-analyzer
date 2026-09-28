import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { collectThreats } from '../services/threatCollector';
import { analyzeThreat } from '../services/aiAnalyzer';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const threats = await prisma.threatIntelligence.findMany({
      include: { analyzedThreat: true },
      orderBy: { published_at: 'desc' },
      take: 50, // Limit for performance
    });
    
    const formattedThreats = threats.map(threat => {
      if (threat.analyzedThreat) {
        return {
          ...threat,
          analyzedThreat: {
            ...threat.analyzedThreat,
            vulnerabilities: JSON.parse(threat.analyzedThreat.vulnerabilities || '[]'),
            iocs: JSON.parse(threat.analyzedThreat.iocs || '[]')
          }
        };
      }
      return threat;
    });
    
    res.json(formattedThreats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/collect', async (req: Request, res: Response) => {
  try {
    const count = await collectThreats();
    res.json({ message: `Collected ${count} new threats` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to collect threats' });
  }
});

router.post('/:id/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await analyzeThreat(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

export default router;
