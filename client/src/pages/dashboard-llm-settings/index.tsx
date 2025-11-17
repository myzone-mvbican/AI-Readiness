import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, Sliders } from 'lucide-react';
import ProviderSettings from './components/ProviderSettings';
import DefaultSettings from './components/DefaultSettings';

export default function LLMSettingsPage() {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <DashboardLayout title="LLM Settings">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-xl text-foreground font-semibold">LLM Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure AI providers, models, and default parameters for LLM operations
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="defaults" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Defaults
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="mt-6">
            <ProviderSettings />
          </TabsContent>

          <TabsContent value="defaults" className="mt-6">
            <DefaultSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

