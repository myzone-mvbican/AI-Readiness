import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { llmSettingsApi } from '@/lib/api/llm-settings';
import { LLMSettings, SettingsFormData } from '../types';
import { toast } from '@/hooks/use-toast';

export default function DefaultSettings() {
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    providerId: 0,
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxRetries: 3,
    retryBackoffMs: 1000,
    requestTimeoutMs: 60000,
    enableLogging: true,
    logLevel: 'full',
    logRequestData: true,
    logResponseData: true,
  });

  // Fetch providers
  const { data: providers = [] } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => llmSettingsApi.getProviders(),
  });

  // Fetch settings for selected provider
  const { data: settings = [] } = useQuery({
    queryKey: ['llm-settings', selectedProviderId],
    queryFn: () => llmSettingsApi.getGlobalSettings(selectedProviderId || undefined),
    enabled: selectedProviderId !== null,
  });

  // Update form when settings change
  useEffect(() => {
    if (settings.length > 0 && selectedProviderId) {
      const setting = settings[0];
      setFormData({
        providerId: setting.providerId,
        preferredModel: setting.preferredModel,
        temperature: setting.temperature,
        maxTokens: setting.maxTokens,
        topP: setting.topP,
        frequencyPenalty: setting.frequencyPenalty,
        presencePenalty: setting.presencePenalty,
        maxRetries: setting.maxRetries,
        retryBackoffMs: setting.retryBackoffMs,
        requestTimeoutMs: setting.requestTimeoutMs,
        enableLogging: setting.enableLogging,
        logLevel: setting.logLevel,
        logRequestData: setting.logRequestData,
        logResponseData: setting.logResponseData,
      });
    } else if (selectedProviderId) {
      // Reset to defaults if no settings exist
      const provider = providers.find(p => p.id === selectedProviderId);
      setFormData({
        providerId: selectedProviderId,
        preferredModel: provider?.defaultModel,
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        maxRetries: 3,
        retryBackoffMs: 1000,
        requestTimeoutMs: 60000,
        enableLogging: true,
        logLevel: 'full',
        logRequestData: true,
        logResponseData: true,
      });
    }
  }, [settings, selectedProviderId, providers]);

  // Create or update settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      if (!data.providerId) throw new Error('Provider ID is required');
      
      const existingSettings = settings.find(s => s.providerId === data.providerId);
      if (existingSettings) {
        return llmSettingsApi.updateSettings(existingSettings.id, data);
      } else {
        return llmSettingsApi.createGlobalSettings(data.providerId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Default settings have been successfully saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!selectedProviderId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a provider first',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate({ ...formData, providerId: selectedProviderId });
  };

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Default LLM Parameters</h3>
        <p className="text-sm text-muted-foreground">
          Configure default parameters for LLM requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Selection</CardTitle>
          <CardDescription>Select a provider to configure its default settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={selectedProviderId?.toString() || ''}
              onValueChange={(value) => setSelectedProviderId(parseInt(value))}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    {provider.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedProviderId && (
        <div className="space-y-6">
          {/* Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferredModel">Preferred Model</Label>
                <Select
                  value={formData.preferredModel || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, preferredModel: value })
                  }
                >
                  <SelectTrigger id="preferredModel">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider?.availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Override the provider's default model
                </p>
              </div>
            </CardContent>
          </Card>

          {/* LLM Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>LLM Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
                  <span className="text-xs text-muted-foreground">0.0 - 2.0</span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[formData.temperature]}
                  onValueChange={([value]) =>
                    setFormData({ ...formData, temperature: value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Controls randomness. Higher values make output more random.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={1}
                  max={100000}
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens to generate in the response
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="topP">Top P: {formData.topP}</Label>
                  <span className="text-xs text-muted-foreground">0.0 - 1.0</span>
                </div>
                <Slider
                  id="topP"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[formData.topP]}
                  onValueChange={([value]) => setFormData({ ...formData, topP: value })}
                />
                <p className="text-xs text-muted-foreground">
                  Nucleus sampling parameter
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                  <Input
                    id="frequencyPenalty"
                    type="number"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={formData.frequencyPenalty}
                    onChange={(e) =>
                      setFormData({ ...formData, frequencyPenalty: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presencePenalty">Presence Penalty</Label>
                  <Input
                    id="presencePenalty"
                    type="number"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={formData.presencePenalty}
                    onChange={(e) =>
                      setFormData({ ...formData, presencePenalty: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retry & Timeout Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Retry & Timeout Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min={0}
                  max={10}
                  value={formData.maxRetries}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryBackoffMs">Retry Backoff (ms)</Label>
                <Input
                  id="retryBackoffMs"
                  type="number"
                  min={100}
                  max={10000}
                  value={formData.retryBackoffMs}
                  onChange={(e) =>
                    setFormData({ ...formData, retryBackoffMs: parseInt(e.target.value) || 1000 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestTimeoutMs">Request Timeout (ms)</Label>
                <Input
                  id="requestTimeoutMs"
                  type="number"
                  min={1000}
                  max={300000}
                  value={formData.requestTimeoutMs}
                  onChange={(e) =>
                    setFormData({ ...formData, requestTimeoutMs: parseInt(e.target.value) || 60000 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Logging Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Logging Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableLogging">Enable Logging</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable logging for LLM requests
                  </p>
                </div>
                <Switch
                  id="enableLogging"
                  checked={formData.enableLogging}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableLogging: checked })
                  }
                />
              </div>

              {formData.enableLogging && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select
                      value={formData.logLevel}
                      onValueChange={(value: 'full' | 'minimal' | 'errors_only') =>
                        setFormData({ ...formData, logLevel: value })
                      }
                    >
                      <SelectTrigger id="logLevel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="errors_only">Errors Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="logRequestData">Log Request Data</Label>
                        <p className="text-xs text-muted-foreground">
                          Include request data in logs
                        </p>
                      </div>
                      <Switch
                        id="logRequestData"
                        checked={formData.logRequestData}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, logRequestData: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="logResponseData">Log Response Data</Label>
                        <p className="text-xs text-muted-foreground">
                          Include response data in logs
                        </p>
                      </div>
                      <Switch
                        id="logResponseData"
                        checked={formData.logResponseData}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, logResponseData: checked })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!selectedProviderId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please select a provider to configure its default settings
          </CardContent>
        </Card>
      )}
    </div>
  );
}

