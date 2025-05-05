import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type TabNavigationProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: "setup", label: "Project Setup" },
    { id: "folder", label: "Folder Structure" },
    { id: "config", label: "Configuration" },
    { id: "form", label: "Form Example" },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
        {tabs.map((tab) => (
          <li key={tab.id} className="mr-2">
            <button
              id={`tab-${tab.id}`}
              className={cn(
                "inline-block p-4 border-b-2 rounded-t-lg",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              )}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
