import prisma from '../prisma';

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
    let result;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY is missing. Falling back to mock data.");
    } else {
      let retries = 2;
      while (retries > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "models": [
                "qwen/qwen3.8-27b:free",
                "liquid/lfm-2.5-2.6b:free",
                "thinkingmachines/inkling:free"
              ],
              "max_tokens": 4000,
              "messages": [
                {"role": "user", "content": prompt}
              ]
            }),
            signal: controller.signal as any
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter API failed with status ${response.status}: ${errBody}`);
          }

          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || "";
          
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON object found in response");
          
          result = JSON.parse(jsonMatch[0]);
          break; // Success!

        } catch (err: any) {
          retries--;
          console.warn(`OpenRouter API call failed. Retries left: ${retries}. Error:`, err.message);
          if (retries > 0) await new Promise(res => setTimeout(res, 2000));
        }
      }
    }

    if (!result) {
      console.warn("Using Fallback Mock Analysis Data due to API failure...");
      result = {
        severity: "High",
        summary: "MOCK ANALYSIS: The OpenRouter API call failed or timed out. This is a simulated analysis showing potential unauthorized access patterns indicative of automated scanning.",
        vulnerabilities: ["CVE-MOCK-2026", "Outdated Service Component"],
        iocs: ["192.168.1.55", "suspicious-domain.local"],
        mitigation_recommendations: "1. Quarantine affected assets. 2. Update to the latest stable versions. (This is simulated data due to API limits)."
      };
    }

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

export const generateMitigationPlan = async (assetName: string, assetType: string, threatTitle: string, threatSummary: string) => {
  const prompt = `You are an expert DevSecOps engineer. An asset named "${assetName}" (Type: ${assetType}) is impacted by the following threat:
Title: ${threatTitle}
Summary: ${threatSummary}

Provide a concise, step-by-step mitigation plan specifically tailored for this asset to secure it against this exact threat. Format as standard markdown. Do not include introductory conversational text.`;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "MOCK MITIGATION PLAN:\n1. Isolate the asset from the network immediately.\n2. Apply latest security patches to the service.\n3. Monitor for anomalous activities.\n(Mock data due to missing API key)";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "models": ["qwen/qwen3.8-27b:free", "liquid/lfm-2.5-2.6b:free", "thinkingmachines/inkling:free"],
        "max_tokens": 4000,
        "messages": [{"role": "user", "content": prompt}]
      }),
      signal: controller.signal as any
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API failed`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";

    if (!text) {
      return "MOCK MITIGATION PLAN:\n1. Isolate the asset.\n2. Patch software.\n(API returned empty response)";
    }

    return text.trim();
  } catch (err) {
    console.error("Mitigation Plan Error:", err);
    return "MOCK MITIGATION PLAN:\n1. Quarantine the affected service immediately.\n2. Ensure network policies restrict unnecessary access.\n3. Roll out the latest vendor security patch.\n(Generated offline due to API unreachable)";
  }
};

