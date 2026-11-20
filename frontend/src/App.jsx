import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import AssistantPage from './pages/AssistantPage';
import DocumentsPage from './pages/DocumentsPage';
import AssessmentPage from './pages/AssessmentPage';
import HistoryPage from './pages/HistoryPage';
import HealthPage from './pages/HealthPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  const fetchGlobalData = async () => {
    try {
      const [s, h] = await Promise.all([
        api.getStats().catch(() => null),
        api.getHealth().catch(() => null)
      ]);
      if (s) setStats(s);
      if (h) setHealth(h);
    } catch (err) {
      console.error("Error fetching global data:", err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 15000); // Poll health/stats every 15s
    return () => clearInterval(interval);
  }, []);

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage stats={stats} health={health} onNavigate={setCurrentTab} />;
      case 'assistant':
        return <AssistantPage onQueryLogged={fetchGlobalData} />;
      case 'documents':
        return <DocumentsPage onDocumentsChanged={fetchGlobalData} />;
      case 'assessment':
        return <AssessmentPage onQueryLogged={fetchGlobalData} />;
      case 'history':
        return <HistoryPage stats={stats} onRefresh={fetchGlobalData} />;
      case 'health':
        return <HealthPage health={health} onRefresh={fetchGlobalData} />;
      case 'settings':
        return <SettingsPage onConfigUpdated={fetchGlobalData} />;
      default:
        return <OverviewPage stats={stats} health={health} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-[#F3F4F6] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        stats={stats}
        health={health}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          health={health}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0B0F19]">
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}
