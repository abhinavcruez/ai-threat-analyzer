import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Server', version: '', ip_address: '' });

  const [showScript, setShowScript] = useState(false);

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
            <p className="text-sm font-semibold mb-2 text-white border-t border-gray-600 pt-3">Pro-Tip: Single-Command Execution (Direct from Backend)</p>
            <p className="text-xs text-gray-400 mb-2">You don't even need to use GitHub! Your AI Threat Analyzer backend serves this script automatically. Run it instantly on any server with one command:</p>
            <code className="text-xs text-purple-300 block">
              curl -sL http://{window.location.hostname}:5000/api/assets/agent.sh | bash -s -- http://{window.location.hostname}:5000 {localStorage.getItem('token')}
            </code>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map(asset => (
              <tr key={asset.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.version || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.status ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.status === 'active' || asset.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {asset.status}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.ip_address || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title={asset.details}>{asset.details || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
