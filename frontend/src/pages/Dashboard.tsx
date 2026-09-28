import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Server, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Stats {
  totalAssets: number;
  totalThreats: number;
  openImpacts: number;
  criticalImpacts: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <Server className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Assets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAssets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Threats Tracked</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalThreats}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Open Impacts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.openImpacts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
          Critical Impacts (Action Required)
        </h2>
        {stats.criticalImpacts.length === 0 ? (
          <p className="text-gray-500">No critical impacts found. Systems are secure.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.criticalImpacts.map((impact: any) => (
              <div key={impact.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Asset: {impact.asset.name}</p>
                  <p className="text-sm text-gray-500">Threat: {impact.analyzed_threat.threat.title}</p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  Critical
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
