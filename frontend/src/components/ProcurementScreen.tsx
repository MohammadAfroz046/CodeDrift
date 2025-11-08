import { useState, useEffect } from "react";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import NotificationBar from "./NotificationBar";

interface ProcurementScreenProps {
  onNavigate: (screen: string) => void;
}

interface ProcurementSuggestion {
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  recommended_quantity: number;
  estimated_cost: number;
  eta_days: number;
  supplier_reliability: number;
  priority: string;
  price_per_unit: number;
}

export default function ProcurementScreen({ onNavigate }: ProcurementScreenProps) {
  const [loading, setLoading] = useState(false);
  const [procurementSuggestions, setProcurementSuggestions] = useState<ProcurementSuggestion[]>([]);
  const [sortField, setSortField] = useState<string>("priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    // Load suggestions on component mount
    handleGenerateSuggestions();
  }, []);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/procurement/suggestions`);
      if (!response.ok) {
        throw new Error("Failed to fetch procurement suggestions");
      }
      const data = await response.json();
      setProcurementSuggestions(data.suggestions || []);
      toast.success(`Procurement suggestions loaded! Found ${data.suggestions?.length || 0} suggestions.`);
    } catch (error) {
      toast.error("Failed to load procurement suggestions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSuggestions = procurementSuggestions.length > 0 ? [...procurementSuggestions].sort((a, b) => {
    let aVal: any = a[sortField as keyof ProcurementSuggestion];
    let bVal: any = b[sortField as keyof ProcurementSuggestion];
    
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    // Handle priority sorting specially
    if (sortField === "priority") {
      const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
      aVal = priorityOrder[aVal as keyof typeof priorityOrder] || 0;
      bVal = priorityOrder[bVal as keyof typeof priorityOrder] || 0;
    }
    
    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  }) : [];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↗️" : "↘️";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen="procurement" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col">
        <NotificationBar onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Procurement Suggestions</h1>
              <button
                onClick={handleGenerateSuggestions}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  "Refresh Suggestions"
                )}
              </button>
            </div>

            {/* Summary Cards */}
            {procurementSuggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🔴</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">High Priority</p>
                      <p className="text-2xl font-bold text-red-600">
                        {procurementSuggestions.filter(s => s.priority === "High").length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💰</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Estimated Cost</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${procurementSuggestions.reduce((sum, s) => sum + s.estimated_cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">⏱️</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Lead Time</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {procurementSuggestions.length > 0 
                          ? Math.round(procurementSuggestions.reduce((sum, s) => sum + s.eta_days, 0) / procurementSuggestions.length)
                          : 0} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recommended Procurement Actions</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Supplier recommendations based on CSV inventory data (Products from Sales Order.csv, Supplier data is simulated)
                  </p>
                </div>
                <button
                  onClick={handleGenerateSuggestions}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              
              {sortedSuggestions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("product_name")}
                        >
                          Product {getSortIcon("product_name")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("supplier_name")}
                        >
                          Supplier {getSortIcon("supplier_name")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("recommended_quantity")}
                        >
                          Quantity {getSortIcon("recommended_quantity")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("estimated_cost")}
                        >
                          Cost {getSortIcon("estimated_cost")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("eta_days")}
                        >
                          ETA {getSortIcon("eta_days")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("supplier_reliability")}
                        >
                          Reliability {getSortIcon("supplier_reliability")}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("priority")}
                        >
                          Priority {getSortIcon("priority")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedSuggestions.map((suggestion, index) => (
                        <tr key={`${suggestion.product_id}-${suggestion.supplier_id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {suggestion.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {suggestion.supplier_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.round(suggestion.recommended_quantity).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${suggestion.estimated_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {suggestion.eta_days} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(suggestion.supplier_reliability * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">🛒</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Procurement Suggestions
                  </h3>
                  <p className="text-gray-600">
                    {loading ? "Generating suggestions..." : "Click 'Refresh Suggestions' to analyze current inventory levels."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
