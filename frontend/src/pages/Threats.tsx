import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Brain } from 'lucide-react';

export default function Threats() {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchThreats = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/threats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setThreats(res.data);
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const handleCollect = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/threats/collect', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchThreats();
    setLoading(false);
  };

  const handleAnalyze = async (id: number) => {
    const token = localStorage.getItem('token');
    await axios.post(`http://localhost:5000/api/threats/${id}/analyze`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchThreats();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Threat Intelligence Feeds</h1>
        <button 
          onClick={handleCollect}
          disabled={loading}
          className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Fetch Latest</span>
        </button>
      </div>

      <div className="space-y-4">
        {threats.map(threat => (
          <div key={threat.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <a href={threat.url} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                    {threat.title}
                  </a>
                </h3>
                <p className="text-sm text-gray-500 mt-1">Source: {threat.source_name} | Published: {new Date(threat.published_at).toLocaleDateString()}</p>
              </div>
              
              {!threat.analyzedThreat ? (
                <button 
                  onClick={() => handleAnalyze(threat.id)}
                  className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
                >
                  <Brain className="h-4 w-4" />
                  <span>AI Analyze</span>
                </button>
              ) : (
                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                  threat.analyzedThreat.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                  threat.analyzedThreat.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                  threat.analyzedThreat.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {threat.analyzedThreat.severity} Severity
                </span>
              )}
            </div>

            {threat.analyzedThreat && (
              <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-2">AI Summary</h4>
                <p className="text-gray-600 text-sm mb-4">{threat.analyzedThreat.summary}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase">Vulnerabilities</h5>
                    <ul className="list-disc pl-4 text-sm text-gray-700 mt-1">
                      {Array.isArray(threat.analyzedThreat.vulnerabilities) 
                        ? threat.analyzedThreat.vulnerabilities.map((v: string, i: number) => <li key={i}>{v}</li>)
                        : <li>None extracted</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase">Indicators of Compromise</h5>
                    <ul className="list-disc pl-4 text-sm text-gray-700 mt-1">
                      {Array.isArray(threat.analyzedThreat.iocs)
                        ? threat.analyzedThreat.iocs.map((ioc: string, i: number) => <li key={i}>{ioc}</li>)
                        : <li>None extracted</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
