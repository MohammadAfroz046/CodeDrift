import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import HomePage from "./components/HomePage";
import DataInputScreen from "./components/DataInputScreen";
import Dashboard from "./components/Dashboard";
import ForecastingScreen from "./components/ForecastingScreen";
import ProcurementScreen from "./components/ProcurementScreen";
import InventoryScreen from "./components/InventoryScreen";
import AnomalyScreen from "./components/AnomalyScreen";
import ChatbotButton from "./components/ChatbotButton";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Supply Chain AI</h2>
        <SignOutButton />
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [currentScreen, setCurrentScreen] = useState<string>("home");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomePage onNavigate={setCurrentScreen} />;
      case "data-input":
        return <DataInputScreen onNavigate={setCurrentScreen} />;
      case "dashboard":
        return <Dashboard onNavigate={setCurrentScreen} />;
      case "forecasting":
        return <ForecastingScreen onNavigate={setCurrentScreen} />;
      case "procurement":
        return <ProcurementScreen onNavigate={setCurrentScreen} />;
      case "inventory":
        return <InventoryScreen onNavigate={setCurrentScreen} />;
      case "anomalies":
        return <AnomalyScreen onNavigate={setCurrentScreen} />;
      default:
        return <HomePage onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="flex flex-col">
      <Authenticated>
        {renderScreen()}
        <ChatbotButton />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">Supply Chain AI</h1>
              <p className="text-xl text-secondary">Sign in to access the system</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
