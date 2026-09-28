import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { analyzeImpact } from '../services/impactAnalyzer';
import { generateMitigationPlan } from '../services/aiAnalyzer';

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

router.post('/:id/ai-mitigation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const impact = await prisma.impactAnalysis.findUnique({
      where: { id: parseInt(id) },
      include: {
        asset: true,
        analyzed_threat: { include: { threat: true } }
      }
    });

    if (!impact) {
      res.status(404).json({ error: 'Impact not found' });
      return;
    }

    if (impact.ai_mitigation_plan) {
      res.json({ mitigation_plan: impact.ai_mitigation_plan });
      return;
    }

    const plan = await generateMitigationPlan(
      impact.asset.name,
      impact.asset.type,
      impact.analyzed_threat.threat.title,
      impact.analyzed_threat.summary
    );

    const updated = await prisma.impactAnalysis.update({
      where: { id: parseInt(id) },
      data: { ai_mitigation_plan: plan }
    });

    res.json({ mitigation_plan: updated.ai_mitigation_plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI mitigation generation failed' });
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
