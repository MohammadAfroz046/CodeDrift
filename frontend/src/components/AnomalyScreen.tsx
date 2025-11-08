import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import NotificationBar from "./NotificationBar";

interface AnomalyScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AnomalyScreen({ onNavigate }: AnomalyScreenProps) {
  const anomalies = useQuery(api.anomalies.list) || [];
  const detectAnomalies = useMutation(api.anomalies.detectAnomalies);
  const [loading, setLoading] = useState(false);
  const [rawRows, setRawRows] = useState<Array<any>>([]);

  useEffect(() => {
    // Fetch raw anomaly CSV rows from backend so the UI can show CSV when no detected anomalies exist
    const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000";
    const fetchRaw = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/anomalies/raw`);
        if (res.ok) {
          const data = await res.json();
          setRawRows(data.rows || []);
        } else {
          // ignore silently - raw data is optional
          setRawRows([]);
        }
      } catch (e) {
        console.error("Failed to fetch raw anomaly CSV:", e);
        setRawRows([]);
      }
    };

    fetchRaw();
  }, []);

  const handleDetectAnomalies = async () => {
    setLoading(true);
    try {
      const result = await detectAnomalies();
      const count = result?.total_detected || 0;
      if (count > 0) {
        toast.success(`Anomaly detection completed! Found ${count} anomalies.`);
      } else {
        toast.success("Anomaly detection completed! No anomalies found.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to detect anomalies";
      toast.error(`Failed to detect anomalies: ${errorMessage}`);
      console.error("Anomaly detection error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen="anomalies" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col">
        <NotificationBar onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Anomaly Detection</h1>
              <button
                onClick={handleDetectAnomalies}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? "Detecting..." : "Run Detection"}
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🚨</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Anomalies</p>
                    <p className="text-2xl font-bold text-red-600">
                      {anomalies.filter(a => a.severity === "critical").length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {anomalies.filter(a => a.severity === "warning").length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">ℹ️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Normal Alerts</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {anomalies.filter(a => a.severity === "normal").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Detected Anomalies</h2>
                <p className="text-sm text-gray-600 mt-1">
                  List of all detected anomalies sorted by detection time
                </p>
              </div>

              <div className="overflow-x-auto">
                {/* If convex anomalies exist, show them. Otherwise show raw CSV rows from backend. */}
                {anomalies.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product/Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detected At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {anomalies.map((anomaly) => (
                      <tr key={anomaly._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {anomaly.type === 'demand_spike' ? '📈 Demand Spike' :
                           anomaly.type === 'trend_change' ? '📊 Trend Change' :
                           anomaly.type === 'supplier_reliability' ? '🏭 Supplier Issue' :
                           anomaly.type === 'low_inventory' ? '📉 Low Inventory' :
                           anomaly.type === 'high_inventory' ? '📦 High Inventory' :
                           anomaly.type === 'supply_chain_anomaly' ? '⚠️ Supply Chain Anomaly' :
                           '❓ Other'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {/* Product IDs from anomaly_data.csv are the real product identifiers */}
                          {anomaly.product_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            anomaly.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {anomaly.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                          {anomaly.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(anomaly.detected_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                ) : (
                  // Show raw CSV rows when no detected anomalies exist
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Demand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse Capacity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time (days)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/unit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rawRows.map((r) => (
                        <tr key={r.product_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.product_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.current_demand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.current_stock}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.warehouse_capacity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.lead_time_days}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.price_per_unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}