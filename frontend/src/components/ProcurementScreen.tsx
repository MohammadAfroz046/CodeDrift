import { useState } from "react";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import NotificationBar from "./NotificationBar";

interface ProcurementScreenProps {
  onNavigate: (screen: string) => void;
}

interface SupplierRecommendation {
  supplier_id: string;
  product_id: string;
  product_name: string;
  reliability: number;
  lead_time: number;
  transportation_cost: number;
  supplier_price: number;
  total_cost: number;
  min_order_quantity: number;
  delivery_days: number;
  meets_reliability: boolean;
  meets_lead_time: boolean;
  weighted_score: number;
  explanation: string;
}

interface RecommendationResponse {
  success: boolean;
  product_id: string;
  product_name: string;
  best_supplier: SupplierRecommendation;
  other_suppliers: SupplierRecommendation[];
  thresholds: {
    reliability_min: number;
    lead_time_max: number;
  };
}

export default function ProcurementScreen({ onNavigate }: ProcurementScreenProps) {
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string>("");
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handleSearchSupplier = async () => {
    if (!productId.trim()) {
      toast.error("Please enter a product ID");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendation(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/procurement/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get supplier recommendations");
      }

      const data: RecommendationResponse = await response.json();
      setRecommendation(data);
      toast.success(`Supplier recommendations generated for ${data.product_name}!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get supplier recommendations";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return "text-green-600";
    if (reliability >= 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getLeadTimeColor = (leadTime: number, threshold: number) => {
    if (leadTime <= threshold) return "text-green-600";
    return "text-red-600";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen="procurement" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col">
        <NotificationBar onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">AI-Powered Supplier Recommendations</h1>
              
              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Product ID from Procurement Data
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Example: SOS008L02P, SOS005L04P, SOS003L04P, etc.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSupplier();
                      }
                    }}
                    placeholder="Enter product ID (e.g., SOS008L02P)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              <button
                    onClick={handleSearchSupplier}
                    disabled={!productId.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                      "Search Suppliers"
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Thresholds Info */}
            {recommendation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Selection Criteria</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>✓ Reliability Threshold: ≥ {(recommendation.thresholds.reliability_min * 100).toFixed(0)}%</div>
                  <div>✓ Lead Time Threshold: ≤ {recommendation.thresholds.lead_time_max} days (suppliers exceeding this are excluded)</div>
                  <div>✓ Multi-criteria scoring: Reliability (30%), Lead Time (20%), Transportation Cost (20%), Product Cost (30%)</div>
                </div>
              </div>
            )}

            {/* Best Supplier Card */}
            {recommendation && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  ⭐ Recommended Supplier for {recommendation.product_name}
                </h2>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Supplier {recommendation.best_supplier.supplier_id}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{recommendation.best_supplier.explanation}</p>
                    </div>
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">
                      Best Choice
                  </div>
                </div>
                
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Reliability</p>
                      <p className={`text-lg font-bold ${getReliabilityColor(recommendation.best_supplier.reliability)}`}>
                        {(recommendation.best_supplier.reliability * 100).toFixed(1)}%
                      </p>
                      {recommendation.best_supplier.meets_reliability && (
                        <span className="text-xs text-green-600">✓ Meets threshold</span>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Lead Time</p>
                      <p className={`text-lg font-bold ${getLeadTimeColor(recommendation.best_supplier.lead_time, recommendation.thresholds.lead_time_max)}`}>
                        {recommendation.best_supplier.lead_time} days
                      </p>
                      {recommendation.best_supplier.meets_lead_time && (
                        <span className="text-xs text-green-600">✓ Meets threshold</span>
                      )}
                  </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Transportation</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${recommendation.best_supplier.transportation_cost.toFixed(2)}
                      </p>
                </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Cost</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${recommendation.best_supplier.total_cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Weighted Score</p>
                    <p className="text-lg font-bold text-green-600">
                      {recommendation.best_supplier.weighted_score.toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Suppliers */}
            {recommendation && recommendation.other_suppliers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Other Available Suppliers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.other_suppliers.map((supplier) => (
                    <div key={supplier.supplier_id} className="bg-white border border-gray-200 rounded-lg p-6 shadow">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          Supplier {supplier.supplier_id}
                        </h3>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                          Score: {supplier.weighted_score.toFixed(3)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 italic">
                        {supplier.explanation}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Reliability</p>
                          <p className={`text-sm font-semibold ${getReliabilityColor(supplier.reliability)}`}>
                            {(supplier.reliability * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Lead Time</p>
                          <p className={`text-sm font-semibold ${getLeadTimeColor(supplier.lead_time, recommendation.thresholds.lead_time_max)}`}>
                            {supplier.lead_time} days
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Transportation</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${supplier.transportation_cost.toFixed(2)}
                          </p>
                        </div>
                <div>
                          <p className="text-xs text-gray-600 mb-1">Total Cost</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${supplier.total_cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!recommendation && !loading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Search for Supplier Recommendations
                  </h3>
                <p className="text-gray-600 mb-4">
                  Enter a product ID from procurement_data.csv to get AI-powered supplier recommendations.
                </p>
                <p className="text-sm text-gray-500">
                  The system will analyze suppliers based on reliability (≥70%), lead time (≤140 days), transportation cost, and product cost. Suppliers exceeding the lead time threshold are automatically excluded.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
