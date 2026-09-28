import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Server, AlertTriangle, ShieldAlert, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Stats {
  totalAssets: number;
  totalThreats: number;
  openImpacts: number;
  criticalImpacts: any[];
}

const mockTrendData = [
  { name: 'Mon', threats: 12, impacts: 2 },
  { name: 'Tue', threats: 25, impacts: 4 },
  { name: 'Wed', threats: 18, impacts: 3 },
  { name: 'Thu', threats: 32, impacts: 8 },
  { name: 'Fri', threats: 45, impacts: 12 },
  { name: 'Sat', threats: 38, impacts: 9 },
  { name: 'Sun', threats: 55, impacts: 15 },
];

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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            Command Center
          </h1>
          <p className="text-gray-500 mt-1">Real-time threat intelligence and impact correlation.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>System Online</span>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative group overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Monitored Assets</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{stats.totalAssets}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <Server className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+3 new this week</span>
          </div>
        </div>
        
        <div className="relative group overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Threats</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{stats.totalThreats}</p>
            </div>
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+142 ingested today</span>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-rose-50 to-rose-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Impacts</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{stats.openImpacts}</p>
            </div>
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-rose-600">
            <Zap className="h-3 w-3 mr-1" />
            <span>Requires immediate attention</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Threat Trajectory (7 Days)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '3 3' }}
                />
                <Area type="monotone" dataKey="threats" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Impact Correlation Rate</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="impacts" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
            Critical Impacts (Action Required)
          </h2>
          {stats.criticalImpacts.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {stats.criticalImpacts.length} Active
            </span>
          )}
        </div>
        
        <div className="p-6">
          {stats.criticalImpacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Zero Critical Impacts</h3>
              <p className="text-gray-500 mt-1 max-w-sm">Your infrastructure is currently secure against all tracked critical threats.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {stats.criticalImpacts.map((impact: any) => (
                <div key={impact.id} className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100">
                      <Server className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{impact.asset.name}</p>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{impact.analyzed_threat.threat.title}</p>
                    </div>
                  </div>
                  <button className="whitespace-nowrap px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    Investigate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
