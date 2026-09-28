import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeThreat = async (threatId: number) => {
  const threat = await prisma.threatIntelligence.findUnique({ where: { id: threatId } });
  if (!threat) throw new Error('Threat not found');

  const existingAnalysis = await prisma.analyzedThreat.findUnique({ where: { threat_id: threatId } });
  if (existingAnalysis) return existingAnalysis;

  const prompt = `
You are a cybersecurity expert. Analyze the following threat intelligence report and extract key information.
Respond ONLY with a valid JSON object matching this schema, without any markdown formatting or extra text:
{
  "severity": "Low" | "Medium" | "High" | "Critical",
  "summary": "A concise summary of the threat",
  "vulnerabilities": ["software name", "CVE-XXXX-XXXX"],
  "iocs": ["IP addresses", "domains", "file hashes"],
  "mitigation_recommendations": "Steps to mitigate the threat"
}

Threat Report Title: ${threat.title}
Content: ${threat.content}
Source: ${threat.source_name}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    
    // Attempt to parse JSON. Might need to strip markdown if Gemini adds it despite instructions.
    let jsonStr = text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    }

    const result = JSON.parse(jsonStr);

    const analyzed = await prisma.analyzedThreat.create({
      data: {
        threat_id: threat.id,
        severity: result.severity || 'Unknown',
        summary: result.summary || 'No summary provided',
        vulnerabilities: JSON.stringify(result.vulnerabilities || []),
        iocs: JSON.stringify(result.iocs || []),
        mitigation_recommendations: result.mitigation_recommendations || 'None provided',
      },
    });

    return analyzed;
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw new Error('Failed to analyze threat');
  }
};
