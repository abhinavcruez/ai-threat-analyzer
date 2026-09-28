import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, ShieldAlert, Bot, Loader2 } from 'lucide-react';

export default function Impact() {
  const [impacts, setImpacts] = useState<any[]>([]);
  const [loadingMitigation, setLoadingMitigation] = useState<number | null>(null);

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

  const handleAIMitigate = async (id: number) => {
    setLoadingMitigation(id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/impact/${id}/ai-mitigation`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchImpacts();
    } catch (error) {
      console.error(error);
      alert('Failed to generate AI mitigation plan.');
    } finally {
      setLoadingMitigation(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Impact Analysis</h1>
          <p className="text-gray-500 mt-1">Review correlated threats against your infrastructure.</p>
        </div>
        <button 
          onClick={handleRunAnalysis}
          className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Activity className="h-5 w-5" />
          <span className="font-medium">Run Correlation Engine</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {impacts.map(impact => (
          <div key={impact.id} className={`p-6 rounded-2xl shadow-sm border transition-all ${impact.status === 'OPEN' ? 'bg-white border-red-200 hover:shadow-md' : 'bg-emerald-50/30 border-emerald-200 opacity-80'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${impact.status === 'OPEN' ? 'bg-red-50 text-red-500' : 'bg-emerald-100 text-emerald-600'}`}>
                  {impact.status === 'OPEN' ? (
                    <ShieldAlert className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {impact.asset.name}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{impact.asset.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${impact.status === 'OPEN' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                {impact.status}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Associated Threat</p>
                <p className="text-sm font-medium text-gray-900">{impact.analyzed_threat.threat.title}</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Generic Mitigation</p>
                <p className="text-sm text-gray-700 leading-relaxed">{impact.analyzed_threat.mitigation_recommendations}</p>
              </div>

              {impact.ai_mitigation_plan ? (
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bot className="h-16 w-16 text-indigo-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center">
                      <Bot className="h-4 w-4 mr-1.5" />
                      AI Action Plan
                    </p>
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {impact.ai_mitigation_plan}
                    </div>
                  </div>
                </div>
              ) : (
                impact.status === 'OPEN' && (
                  <button 
                    onClick={() => handleAIMitigate(impact.id)}
                    disabled={loadingMitigation === impact.id}
                    className="w-full flex justify-center items-center space-x-2 bg-indigo-50 text-indigo-700 py-3 rounded-xl hover:bg-indigo-100 font-semibold text-sm transition-colors border border-indigo-200 disabled:opacity-50"
                  >
                    {loadingMitigation === impact.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating tailored plan...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-5 w-5" />
                        <span>Ask AI for Specific Steps</span>
                      </>
                    )}
                  </button>
                )
              )}
            </div>

            {impact.status === 'OPEN' && (
              <button 
                onClick={() => handleMitigate(impact.id)}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 text-sm font-semibold transition-all shadow-sm"
              >
                Mark as Mitigated
              </button>
            )}
          </div>
        ))}
        {impacts.length === 0 && (
          <div className="col-span-1 xl:col-span-2 text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No active impacts</h3>
            <p className="mt-1">Run the correlation engine to check your assets against analyzed threats.</p>
          </div>
        )}
      </div>
    </div>
  );
}
