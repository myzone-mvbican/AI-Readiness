import { Link } from "wouter";
import TabNavigation from "@/components/layout/tab-navigation";
import Setup from "@/pages/setup";
import FolderStructure from "@/pages/folder-structure";
import Configuration from "@/pages/configuration";
import FormExample from "@/pages/form-example";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("setup");

  const renderContent = () => {
    switch (activeTab) {
      case "setup":
        return <Setup />;
      case "folder":
        return <FolderStructure />;
      case "config":
        return <Configuration />;
      case "form":
        return <FormExample />;
      default:
        return <Setup />;
    }
  };

  return (
    <div>
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
}
