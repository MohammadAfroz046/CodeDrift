interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export default function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "forecasting", label: "Forecasting", icon: "🔮" },
    { id: "procurement", label: "Procurement", icon: "🛒" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "anomalies", label: "Anomalies", icon: "⚠️" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Supply Chain AI</h2>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
              currentScreen === item.id 
                ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" 
                : "text-gray-700"
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
