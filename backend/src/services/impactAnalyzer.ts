import prisma from '../prisma';

export const analyzeImpact = async (analyzedThreatId: number) => {
  const analyzedThreat = await prisma.analyzedThreat.findUnique({
    where: { id: analyzedThreatId },
  });

  if (!analyzedThreat) throw new Error('Analyzed threat not found');

  const assets = await prisma.asset.findMany();
  const newImpacts = [];

  const vulnerabilities = JSON.parse(analyzedThreat.vulnerabilities || '[]');
  
  if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
      return [];
  }

  for (const asset of assets) {
    let impacted = false;
    const assetNameLower = asset.name.toLowerCase();
    const assetTypeLower = asset.type.toLowerCase();

    for (const vuln of vulnerabilities) {
      const vulnLower = vuln.toLowerCase();
      // Simple string matching logic for correlation
      // In a real-world scenario, this would use CPE mapping or more advanced matching
      const assetWords = assetNameLower.split(/[\s\-()]+/).filter((w: string) => w.length > 3);
      const isWordMatch = assetWords.some((w: string) => vulnLower.includes(w));

      if (vulnLower.includes(assetNameLower) || assetNameLower.includes(vulnLower) || 
          (asset.version && vulnLower.includes(asset.version.toLowerCase())) ||
          isWordMatch ||
          (vulnLower.includes("service") && assetTypeLower === "service") ||
          (vulnLower.includes("outdated") && asset.version !== "Unknown")) {
        impacted = true;
        break;
      }
    }

    if (impacted) {
      // Check if impact already logged
      const existingImpact = await prisma.impactAnalysis.findFirst({
        where: {
          analyzed_threat_id: analyzedThreatId,
          asset_id: asset.id,
        },
      });

      if (!existingImpact) {
        const impact = await prisma.impactAnalysis.create({
          data: {
            analyzed_threat_id: analyzedThreatId,
            asset_id: asset.id,
            impact_level: analyzedThreat.severity, // Inherit severity from threat
            status: 'OPEN',
          },
        });
        newImpacts.push(impact);
      }
    }
  }

  return newImpacts;
};
