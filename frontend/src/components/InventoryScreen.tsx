
import { useState } from "react";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import NotificationBar from "./NotificationBar";

interface InventoryScreenProps {
  onNavigate: (screen: string) => void;
}

interface OptimizationResult {
  product_id: string;
  product_name: string;
  current_stock: number;
  optimal_quantity: number;
  total_cost: number;
  supplier_name: string;
  days_of_stock: number;
  status: string;
  warning: string | null;
  reorder_point?: number;
  safety_stock?: number;
  warehouse_capacity?: number;
  avg_daily_demand?: number;
  demand_variability?: number;
}

export default function InventoryScreen({ onNavigate }: InventoryScreenProps) {
  const [loading, setLoading] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handleOptimizeInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/optimize`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to optimize inventory";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        throw new Error("No optimization results returned. Check backend logs for errors.");
      }

      setOptimizationResults(results);
      setCurrentPage(1); // Reset to first page
      toast.success(`Inventory optimization completed for ${results.length} products!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to optimize inventory: ${errorMessage}`);
      console.error("Inventory optimization error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter results by status
  const filteredResults = filterStatus === "all" 
    ? optimizationResults 
    : optimizationResults.filter(r => r.status === filterStatus);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Optimal":
        return "bg-green-100 text-green-800";
      case "Understock":
        return "bg-red-100 text-red-800";
      case "Overstock":
        return "bg-orange-100 text-orange-800";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800";
      case "Caution":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalOptimalCost = optimizationResults.reduce((sum, result) => sum + result.total_cost, 0);
  const understockItems = optimizationResults.filter(r => r.status === "Understock").length;
  const overstockItems = optimizationResults.filter(r => r.status === "Overstock").length;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen="inventory" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col">
        <NotificationBar onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Optimization</h1>
                {optimizationResults.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {filteredResults.length} of {optimizationResults.length} products
                  </p>
                )}
              </div>
              <button
                onClick={handleOptimizeInventory}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Optimizing...
                  </div>
                ) : (
                  "Run Optimization"
                )}
              </button>
            </div>

            {/* Summary Cards */}
            {optimizationResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💰</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Optimal Cost</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${totalOptimalCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📉</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Understock Items</p>
                      <p className="text-2xl font-bold text-red-600">{understockItems}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📈</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overstock Items</p>
                      <p className="text-2xl font-bold text-orange-600">{overstockItems}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">✅</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Optimal Items</p>
                      <p className="text-2xl font-bold text-green-600">
                        {optimizationResults.filter(r => r.status === "Optimal").length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optimization Algorithm Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                📊 Linear Programming Optimization
              </h2>
              <p className="text-blue-800 mb-3">
                Using Economic Order Quantity (EOQ) model with constraints:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Objective:</strong> Minimize total cost while maintaining service levels</li>
                <li>• <strong>Constraints:</strong> Warehouse capacity, supplier lead times, demand patterns</li>
                <li>• <strong>Factors:</strong> Holding costs (20% of item value), ordering costs ($50 per order)</li>
                <li>• <strong>Output:</strong> Optimal order quantities and supplier selection</li>
              </ul>
            </div>

            {/* Filter and Results Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Optimization Results</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Recommended order quantities and cost analysis for all products
                    </p>
                  </div>
                  {optimizationResults.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="Understock">Understock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Caution">Caution</option>
                        <option value="Optimal">Optimal</option>
                        <option value="Overstock">Overstock</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              {optimizationResults.length > 0 ? (
                <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Optimal Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Best Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days of Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedResults.map((result) => (
                        <tr key={result.product_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {result.product_name}
                              </div>
                              {result.warning && (
                                <div className="text-xs text-orange-600">
                                  ⚠️ {result.warning}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.current_stock.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.optimal_quantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${result.total_cost.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.supplier_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.days_of_stock.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(result.status)}`}>
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="py-12 text-center text-gray-600">
                  Click "Run Optimization" to calculate optimal inventory for all products.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}