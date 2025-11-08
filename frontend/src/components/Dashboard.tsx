import { useState, useEffect } from "react";
import NotificationBar from "./NotificationBar";
import Sidebar from "./Sidebar";

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

interface InventoryStatus {
  product_id: string;
  product_name: string;
  current_stock: number;
  warehouse_capacity: number;
  days_of_stock: number;
  utilization_rate: number;
  avg_daily_demand: number;
}

interface DashboardSummary {
  total_products: number;
  low_stock_items: number;
  urgent_procurement: number;
  avg_utilization: number;
  inventory_status: InventoryStatus[];
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/summary`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentScreen="dashboard" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col">
          <NotificationBar onNavigate={onNavigate} />
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentScreen="dashboard" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col">
          <NotificationBar onNavigate={onNavigate} />
          <div className="flex-1 flex justify-center items-center p-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-red-600 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-600 mb-4">{error || "Failed to load dashboard data"}</p>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalProducts = summary.total_products;
  const lowStockItems = summary.low_stock_items;
  const highPriorityProcurement = summary.urgent_procurement;
  const avgUtilization = Math.round(summary.avg_utilization);
  const inventoryStatus = summary.inventory_status;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen="dashboard" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col">
        <NotificationBar onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Supply Chain Dashboard</h1>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📦</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🛒</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgent Procurement</p>
                    <p className="text-2xl font-bold text-orange-600">{highPriorityProcurement}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📊</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                    <p className="text-2xl font-bold text-blue-600">{avgUtilization}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Status Table */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Inventory Status (from Sales Order.csv)</h2>
                <button
                  onClick={fetchDashboardData}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days of Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Daily Demand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryStatus.slice(0, 20).map((item) => (
                      <tr key={item.product_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.current_stock.toFixed(0)} / {item.warehouse_capacity.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.days_of_stock.toFixed(1)} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.avg_daily_demand.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.utilization_rate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.days_of_stock < 7 
                              ? 'bg-red-100 text-red-800'
                              : item.days_of_stock < 14
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.days_of_stock < 7 ? 'Low Stock' : item.days_of_stock < 14 ? 'Medium' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inventoryStatus.length > 20 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                    Showing first 20 of {inventoryStatus.length} products
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => onNavigate("forecasting")}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🔮</div>
                <div className="font-semibold">Run Forecasting</div>
              </button>
              
              <button
                onClick={() => onNavigate("procurement")}
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🛒</div>
                <div className="font-semibold">Procurement</div>
              </button>
              
              <button
                onClick={() => onNavigate("inventory")}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-semibold">Optimize Inventory</div>
              </button>
              
              <button
                onClick={() => onNavigate("anomalies")}
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">⚠️</div>
                <div className="font-semibold">Check Anomalies</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
