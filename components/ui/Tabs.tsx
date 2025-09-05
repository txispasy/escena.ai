import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="bg-brand-gray p-1 rounded-lg flex items-center max-w-xs mx-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`w-1/2 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${
            activeTab === tab 
              ? tab === 'Simple' 
                ? 'bg-brand-pink text-white shadow-lg' 
                : 'bg-brand-purple text-white shadow-lg'
              : 'bg-transparent text-gray-300 hover:bg-brand-light-gray'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;