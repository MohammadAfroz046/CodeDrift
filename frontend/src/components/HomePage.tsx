interface HomePageProps {
  onNavigate: (screen: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Supply Chain <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Advanced AI-powered supply chain management system with demand forecasting, 
            procurement optimization, inventory management, and real-time anomaly detection.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🔮</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Forecasting</h3>
            <p className="text-sm text-gray-600">GAT-LSTM powered demand prediction</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🛒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Procurement</h3>
            <p className="text-sm text-gray-600">Optimized supplier recommendations</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-semibold text-gray-900 mb-2">Inventory Optimization</h3>
            <p className="text-sm text-gray-600">Linear programming optimization</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Anomaly Detection</h3>
            <p className="text-sm text-gray-600">Real-time outlier identification</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("data-input")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Start Application
        </button>
      </div>
    </div>
  );
}
