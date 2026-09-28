import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Impact() {
  const [impacts, setImpacts] = useState<any[]>([]);

  const fetchImpacts = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/impact', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setImpacts(res.data);
  };

  useEffect(() => {
    fetchImpacts();
  }, []);

  const handleRunAnalysis = async () => {
    const token = localStorage.getItem('token');
    // For demo purposes, we will trigger analysis on all analyzed threats. 
    // In a real system, a background job or specific trigger would do this.
    try {
      const threatsRes = await axios.get('http://localhost:5000/api/threats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      for (const t of threatsRes.data) {
        if (t.analyzedThreat) {
           await axios.post(`http://localhost:5000/api/impact/${t.analyzedThreat.id}/analyze`, {}, {
            headers: { Authorization: `Bearer ${token}` }
           });
        }
      }
      fetchImpacts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMitigate = async (id: number) => {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:5000/api/impact/${id}/status`, { status: 'MITIGATED' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchImpacts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Impact Analysis</h1>
        <button 
          onClick={handleRunAnalysis}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Activity className="h-4 w-4" />
          <span>Run Correlation Engine</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {impacts.map(impact => (
          <div key={impact.id} className={`p-6 rounded-lg shadow-sm border ${impact.status === 'OPEN' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                {impact.status === 'OPEN' ? (
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {impact.asset.name} ({impact.asset.type})
                </h3>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${impact.status === 'OPEN' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                {impact.status}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">Associated Threat:</p>
              <p className="text-sm text-gray-600">{impact.analyzed_threat.threat.title}</p>
              <p className="text-sm mt-2 font-medium text-gray-700">Mitigation:</p>
              <p className="text-sm text-gray-600">{impact.analyzed_threat.mitigation_recommendations}</p>
            </div>

            {impact.status === 'OPEN' && (
              <button 
                onClick={() => handleMitigate(impact.id)}
                className="w-full mt-2 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm font-medium transition-colors"
              >
                Mark as Mitigated
              </button>
            )}
          </div>
        ))}
        {impacts.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-12 bg-white rounded-lg border border-gray-200">
            No impacts detected. Run the correlation engine to check assets against analyzed threats.
          </div>
        )}
      </div>
    </div>
  );
}
