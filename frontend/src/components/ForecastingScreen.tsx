import { useState } from "react";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import NotificationBar from "./NotificationBar";
import DemandChart from "./DemandChart";

interface ForecastingScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ForecastingScreen({ onNavigate }: ForecastingScreenProps) {
  const [productId, setProductId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [demandHistory, setDemandHistory] = useState<Array<{date: string; demand: number}>>([]);
  const [forecasts, setForecasts] = useState<Array<{
    forecast_date: string;
    predicted_demand: number;
    confidence_lower: number;
    confidence_upper: number;
  }>>([]);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const fetchDemandHistory = async (productId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/history?product_id=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setDemandHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch demand history:", error);
    }
  };

  const handleGenerateForecast = async () => {
    if (!productId.trim()) {
      toast.error("Please enter a product ID");
      return;
    }

    setLoading(true);
    try {
      // Fetch forecast from backend
      const response = await fetch(`${BACKEND_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate forecast");
      }

      const data = await response.json();
      const forecastData = data.forecasts || [];
      
      if (forecastData.length === 0) {
        toast.error("No forecast data received");
        return;
      }

      setForecasts(forecastData);
      
      // Also fetch demand history for this product
      await fetchDemandHistory(productId.trim());
      
      toast.success(`Forecast generated successfully! ${forecastData.length} days predicted.`);
    } catch (error) {
      toast.error(`Failed to generate forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Sort forecasts by date
  const sortedForecasts = forecasts.length > 0 ? [...forecasts].sort((a, b) => 
    new Date(a.forecast_date).getTime() - new Date(b.forecast_date).getTime()
  ) : [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentScreen="forecasting" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col">
        <NotificationBar onNavigate={onNavigate} />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Demand Forecasting</h1>
            
            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Product ID from Sales Order.csv
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
                        handleGenerateForecast();
                      }
                    }}
                    placeholder="Enter product ID (e.g., SOS008L02P)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={handleGenerateForecast}
                    disabled={!productId.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Forecast...
                      </div>
                    ) : (
                      "Generate Forecast"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Chart */}
            {productId && (demandHistory.length > 0 || sortedForecasts.length > 0) && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Demand History & 30-Day Forecast - {productId}
                </h2>
                <DemandChart 
                  demandHistory={demandHistory}
                  forecasts={sortedForecasts}
                />
                {sortedForecasts.length > 0 && (
                  <p className="text-sm text-gray-600 mt-4">
                    Showing {sortedForecasts.length} days of forecast predictions
                  </p>
                )}
              </div>
            )}

            {/* Forecast Results */}
            {sortedForecasts && sortedForecasts.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Forecast Results - 30 Days</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {sortedForecasts.length}-day demand prediction with confidence intervals
                  </p>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Predicted Demand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence Range
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedForecasts.map((forecast, index) => {
                        const prevForecast = index > 0 ? sortedForecasts[index - 1] : null;
                        const trend = prevForecast 
                          ? forecast.predicted_demand > prevForecast.predicted_demand ? "↗️" : forecast.predicted_demand < prevForecast.predicted_demand ? "↘️" : "➡️"
                          : "➡️";
                        
                        return (
                          <tr key={`${forecast.forecast_date}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(forecast.forecast_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {forecast.predicted_demand.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {forecast.confidence_lower.toFixed(2)} - {forecast.confidence_upper.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trend}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {productId && sortedForecasts.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-4xl mb-4">🔮</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Forecast Available
                </h3>
                <p className="text-gray-600 mb-4">
                  Enter a product ID and click "Generate Forecast" to generate 30-day predictions from Sales Order.csv data.
                </p>
                <p className="text-sm text-gray-500">
                  Product IDs are the column names from Sales Order.csv (e.g., SOS008L02P, SOS005L04P)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
