import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { analyzeImpact } from '../services/impactAnalyzer';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const impacts = await prisma.impactAnalysis.findMany({
      include: {
        asset: true,
        analyzed_threat: {
          include: { threat: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(impacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:analyzedThreatId/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { analyzedThreatId } = req.params;
    const impacts = await analyzeImpact(parseInt(analyzedThreatId));
    res.json({ message: 'Impact analysis complete', newImpacts: impacts.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impact analysis failed' });
  }
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['OPEN', 'MITIGATED'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
  
      const impact = await prisma.impactAnalysis.update({
        where: { id: parseInt(id) },
        data: { status },
      });
  
      res.json(impact);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;
