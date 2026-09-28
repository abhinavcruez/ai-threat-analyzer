import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Brain, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Server', version: '', ip_address: '' });

  const [showScript, setShowScript] = useState(false);
  const [auditingHost, setAuditingHost] = useState<string | null>(null);
  const [auditResults, setAuditResults] = useState<Record<string, any>>({});

  const handleAudit = async (hostIp: string, services: any[]) => {
    if (auditingHost === hostIp) return;
    try {
      setAuditingHost(hostIp);
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/assets/audit', { hostIp, services }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditResults(prev => ({ ...prev, [hostIp]: res.data }));
    } catch (error: any) {
      alert(error.response?.data?.error || "AI Audit failed. Check console.");
    } finally {
      setAuditingHost(null);
    }
  };

  const fetchAssets = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/assets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAssets(res.data);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/assets', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowForm(false);
    fetchAssets();
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/assets/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAssets();
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    const host = asset.ip_address || 'Unknown Host';
    if (!acc[host]) {
      acc[host] = { hostAsset: null, services: [] };
    }
    if (asset.type === 'Server' || asset.name.startsWith('Host:')) {
      acc[host].hostAsset = asset;
    } else {
      acc[host].services.push(asset);
    }
    return acc;
  }, {} as Record<string, { hostAsset: any, services: any[] }>);

  const getVersionStatus = (version: string, name: string) => {
    if (!version || version === 'Unknown') return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    const vulnerableServices = ['docker', 'cron', 'openssh', 'nginx', 'apache'];
    const isVulnerable = vulnerableServices.some(s => name.toLowerCase().includes(s));
    if (isVulnerable) return { text: 'Update Recommended', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Up to date', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Asset Inventory</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowScript(!showScript)}
            className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
          >
            <span>Auto-Discover</span>
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Asset Name</label>
                <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Server</option>
                  <option>Database</option>
                  <option>Software</option>
                  <option>Network</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Version</label>
                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IP Address</label>
                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" value={formData.ip_address} onChange={e => setFormData({...formData, ip_address: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Save Asset</button>
          </form>
        </div>
      )}

      {showScript && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-800 text-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ubuntu Service Auto-Discovery Script</h3>
            <button onClick={() => setShowScript(false)} className="text-gray-400 hover:text-white">Close</button>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Run this bash script on your Ubuntu VM to automatically scan active services and register them here.
          </p>
          <pre className="bg-black p-4 rounded text-xs overflow-x-auto text-green-400">
{`#!/bin/bash
# Save this as scan_assets.sh
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <BACKEND_URL> <AUTH_TOKEN>"
    exit 1
fi
BACKEND_URL=$1
TOKEN=$2
IP_ADDRESS=$(hostname -I | awk '{print $1}')
HOSTNAME=$(hostname)

# Get OS Info
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$PRETTY_NAME
else
    OS_NAME="Linux System"
fi

KERNEL=$(uname -r)

echo "Registering Host System..."
curl -s -X POST "$BACKEND_URL/api/assets" \\
     -H "Authorization: Bearer $TOKEN" \\
     -H "Content-Type: application/json" \\
     -d "{\\"name\\": \\"Host: $HOSTNAME\\", \\"type\\": \\"Server\\", \\"version\\": \\"$OS_NAME\\", \\"ip_address\\": \\"$IP_ADDRESS\\", \\"status\\": \\"online\\", \\"details\\": \\"Kernel: $KERNEL\\"}" > /dev/null

echo "\\nScanning ALL Active Services..."
# Dynamically find all active services, filtering out internal OS noise
ACTIVE_SERVICES=$(systemctl list-units --type=service --state=active --no-legend | awk '{print $1}' | sed 's/\\.service//' | grep -vE 'systemd|getty|dbus|polkit|plymouth|modprobe|wpa_supplicant|upower|rtkit|networkd|resolved|timesyncd|user@')

for SERVICE in $ACTIVE_SERVICES; do
    # Try to find package version
    VERSION=$(dpkg-query -W -f='\${Version}' $SERVICE 2>/dev/null | cut -d':' -f2 | cut -d'-' -f1)
    if [ -z "$VERSION" ]; then VERSION="Unknown"; fi
    
    STATUS="active"
    DETAILS=$(systemctl status $SERVICE | grep "Active:" | xargs)
    
    curl -s -X POST "$BACKEND_URL/api/assets" \\
         -H "Authorization: Bearer $TOKEN" \\
         -H "Content-Type: application/json" \\
         -d "{\\"name\\": \\"$SERVICE (on $HOSTNAME)\\", \\"type\\": \\"Service\\", \\"version\\": \\"$VERSION\\", \\"ip_address\\": \\"$IP_ADDRESS\\", \\"status\\": \\"$STATUS\\", \\"details\\": \\"$DETAILS\\"}" > /dev/null
done
echo "\\nScan complete!"`}
          </pre>
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <p className="text-sm font-semibold mb-2 text-white border-t border-gray-600 pt-3">Pro-Tip: Single-Command Execution (via GitHub)</p>
            <p className="text-xs text-gray-400 mb-2">If you upload the script above to a GitHub Gist or Repo, you can run it instantly on any server with one command:</p>
            <code className="text-xs text-purple-300 block">
              curl -sL https://raw.githubusercontent.com/abhinavcruez/ai-threat-analyzer/main/scan_assets.sh | bash -s -- {import.meta.env.VITE_TUNNEL_URL || `http://${window.location.hostname}:5000`} {localStorage.getItem('token')}
            </code>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedAssets).map(([ip, group]: [string, any]) => (
          <div key={ip} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-bold">Host</span>
                  <span>{group.hostAsset ? group.hostAsset.name.replace('Host: ', '') : ip}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>IP:</strong> {ip} | <strong>OS:</strong> {group.hostAsset?.version || 'Unknown'} | <strong>Status:</strong> <span className={group.hostAsset?.status === 'online' ? 'text-green-600 font-semibold' : 'text-gray-500'}>{group.hostAsset?.status || 'Unknown'}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleAudit(ip, group.services)}
                  disabled={auditingHost === ip}
                  className={`px-3 py-2 rounded transition-colors text-sm font-medium flex items-center space-x-2 ${auditingHost === ip ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                >
                  {auditingHost === ip ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  <span>{auditingHost === ip ? 'Auditing...' : 'AI Audit'}</span>
                </button>
                {group.hostAsset && (
                  <button onClick={() => handleDelete(group.hostAsset.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors text-sm font-medium flex items-center space-x-1">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                )}
              </div>
            </div>
            
            {auditResults[ip] && (
              <div className="bg-purple-50 border-b border-purple-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-purple-900 flex items-center space-x-2 mb-2">
                      <ShieldCheck className="h-5 w-5 text-purple-600" />
                      <span>AI Security Assessment</span>
                    </h4>
                    <p className="text-purple-800 text-sm mb-4">{auditResults[ip].summary}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg text-center font-bold text-lg ${
                    auditResults[ip].riskScore >= 8 ? 'bg-red-100 text-red-800' :
                    auditResults[ip].riskScore >= 5 ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {auditResults[ip].riskScore} / 10
                    <div className="text-xs uppercase tracking-wider font-semibold opacity-80 mt-1">Risk Score</div>
                  </div>
                </div>
                
                {auditResults[ip].findings && auditResults[ip].findings.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auditResults[ip].findings.map((finding: any, idx: number) => (
                      <div key={idx} className="bg-white rounded p-4 border border-purple-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900">{finding.service}</span>
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide ${
                            finding.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                            finding.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                            finding.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{finding.severity}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2"><strong>Issue:</strong> {finding.issue}</p>
                        <p className="text-sm text-green-700 bg-green-50 p-2 rounded"><strong>Fix:</strong> {finding.remediation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {group.services.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Security State</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {group.services.map((service: any) => {
                      const security = getVersionStatus(service.version, service.name);
                      // Clean up service name by removing the "(on hostname)" suffix
                      const cleanName = service.name.replace(/ \(on .*\)$/, '');
                      return (
                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{cleanName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{service.version || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border ${security.color.includes('green') ? 'bg-green-50 text-green-700 border-green-200' : security.color.includes('yellow') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {security.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.status === 'active' || service.status === 'online' ? 'text-green-600' : 'text-red-500'}`}>
                              <span className={`w-2 h-2 rounded-full mr-1.5 self-center ${service.status === 'active' || service.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {service.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete(service.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {assets.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-gray-400 text-2xl">📡</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No assets found</h3>
            <p className="text-gray-500">Use Auto-Discover to add servers and services to your inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
}
