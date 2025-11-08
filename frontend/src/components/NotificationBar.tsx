import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NotificationBarProps {
  onNavigate: (screen: string) => void;
}

export default function NotificationBar({ onNavigate }: NotificationBarProps) {
  const anomalyStatus = useQuery(api.anomalies.getAnomalyStatus);

  if (!anomalyStatus) return null;

  const getBarStyle = () => {
    switch (anomalyStatus.status) {
      case "critical":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const getIcon = () => {
    switch (anomalyStatus.status) {
      case "critical":
        return "🔴";
      case "warning":
        return "⚠️";
      default:
        return "✅";
    }
  };

  return (
    <div 
      className={`${getBarStyle()} px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={() => onNavigate("anomalies")}
    >
      <div className="flex items-center justify-center">
        <span className="mr-2">{getIcon()}</span>
        <span className="font-medium">{anomalyStatus.message}</span>
        {anomalyStatus.total_count > 0 && (
          <span className="ml-2 text-sm opacity-90">
            (Click to view details)
          </span>
        )}
      </div>
    </div>
  );
}
