import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalAssets = await prisma.asset.count();
    const totalThreats = await prisma.threatIntelligence.count();
    const openImpacts = await prisma.impactAnalysis.count({
      where: { status: 'OPEN' }
    });
    
    // Get recent critical impacts
    const criticalImpacts = await prisma.impactAnalysis.findMany({
        where: { impact_level: 'Critical', status: 'OPEN' },
        include: { asset: true, analyzed_threat: { include: { threat: true } } },
        take: 5
    });

    const formattedCriticalImpacts = criticalImpacts.map(impact => {
      if (impact.analyzed_threat) {
        return {
          ...impact,
          analyzed_threat: {
            ...impact.analyzed_threat,
            vulnerabilities: JSON.parse(impact.analyzed_threat.vulnerabilities || '[]'),
            iocs: JSON.parse(impact.analyzed_threat.iocs || '[]')
          }
        };
      }
      return impact;
    });

    res.json({
        totalAssets,
        totalThreats,
        openImpacts,
        criticalImpacts: formattedCriticalImpacts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
