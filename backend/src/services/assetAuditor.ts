export const auditHost = async (hostIp: string, services: any[]) => {
  const prompt = `
You are a Cloud Security Architect. You are auditing a host with IP ${hostIp}.
Here is a list of services running on this host:
${JSON.stringify(services.map(s => ({ name: s.name, version: s.version })), null, 2)}

Analyze these services for potential security misconfigurations, outdated versions, and architectural risks.
Respond ONLY with a valid JSON object matching this exact schema, without any markdown formatting or extra text:
{
  "riskScore": 5,
  "summary": "A 1-2 sentence executive summary of the host's security posture.",
  "findings": [
    {
      "service": "Service name",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "issue": "Description of the vulnerability or risk",
      "remediation": "How to fix it"
    }
  ]
}
  `;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing.");

  let result;
  let retries = 2;
  while (retries > 0) {
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
        throw new Error(`OpenRouter API failed with status ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Asset Auditor API Error: No JSON object found in response");
        console.error("RAW OPENROUTER RESPONSE:", JSON.stringify(data, null, 2));
        throw new Error("No JSON object found in response");
      }
      
      result = JSON.parse(jsonMatch[0]);
      break; 
    } catch (err: any) {
      console.error("Asset Auditor API Error:", err.message);
      retries--;
      if (retries === 0) {
        result = {
          riskScore: 8,
          summary: "MOCK AUDIT: API is unreachable. Simulated detection of vulnerable core services.",
          findings: [
            {
              service: "OpenSSH",
              severity: "High",
              issue: "Outdated version vulnerable to remote code execution.",
              remediation: "Upgrade to the latest stable release."
            }
          ]
        };
      }
    }
  }

  return result;
};
