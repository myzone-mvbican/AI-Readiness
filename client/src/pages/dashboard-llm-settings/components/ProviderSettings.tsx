import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { llmSettingsApi } from '@/lib/api/llm-settings';
import { LLMProvider, ProviderFormData } from '../types';
import { toast } from '@/hooks/use-toast';

export default function ProviderSettings() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    displayName: '',
    description: '',
    apiBaseUrl: '',
    availableModels: [],
    defaultModel: '',
    isActive: true,
  });

  // Fetch providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => llmSettingsApi.getProviders(),
  });

  // Create provider mutation
  const createMutation = useMutation({
    mutationFn: (data: ProviderFormData) => llmSettingsApi.createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Provider created',
        description: 'The provider has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create provider',
        variant: 'destructive',
      });
    },
  });

  // Update provider mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LLMProvider> }) =>
      llmSettingsApi.updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
      setIsEditDialogOpen(false);
      setSelectedProvider(null);
      resetForm();
      toast({
        title: 'Provider updated',
        description: 'The provider has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update provider',
        variant: 'destructive',
      });
    },
  });

  // Delete provider mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => llmSettingsApi.deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
      setIsDeleteDialogOpen(false);
      setSelectedProvider(null);
      toast({
        title: 'Provider deleted',
        description: 'The provider has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete provider',
        variant: 'destructive',
      });
    },
  });

  // Set API key mutation
  const setApiKeyMutation = useMutation({
    mutationFn: ({ id, apiKey }: { id: number; apiKey: string }) =>
      llmSettingsApi.setProviderApiKey(id, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
      setIsApiKeyDialogOpen(false);
      setApiKey('');
      setSelectedProvider(null);
      toast({
        title: 'API key set',
        description: 'The API key has been successfully set.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set API key',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      apiBaseUrl: '',
      availableModels: [],
      defaultModel: '',
      isActive: true,
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (provider: LLMProvider) => {
    setFormData({
      name: provider.name,
      displayName: provider.displayName,
      description: provider.description || '',
      apiBaseUrl: provider.apiBaseUrl || '',
      availableModels: provider.availableModels,
      defaultModel: provider.defaultModel || '',
      isActive: provider.isActive,
    });
    setSelectedProvider(provider);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    setIsDeleteDialogOpen(true);
  };

  const handleSetApiKey = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    setApiKey('');
    setIsApiKeyDialogOpen(true);
  };

  const handleSubmitCreate = () => {
    // Basic validation
    if (!formData.name || !formData.displayName || formData.availableModels.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!selectedProvider) return;
    updateMutation.mutate({ id: selectedProvider.id, data: formData });
  };

  const handleSubmitApiKey = () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      });
      return;
    }
    setApiKeyMutation.mutate({ id: selectedProvider.id, apiKey });
  };

  const handleDeleteConfirm = () => {
    if (!selectedProvider) return;
    deleteMutation.mutate(selectedProvider.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">AI Providers</h3>
          <p className="text-sm text-muted-foreground">
            Configure AI providers and their API credentials
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No providers configured. Add your first provider to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                    <CardDescription className="mt-1">
                      {provider.description || `Provider: ${provider.name}`}
                    </CardDescription>
                  </div>
                  <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                    {provider.isActive ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Default Model</Label>
                  <p className="text-sm font-medium">{provider.defaultModel || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Available Models</Label>
                  <p className="text-sm text-muted-foreground">
                    {provider.availableModels.length} model(s)
                  </p>
                </div>
                {provider.apiKeyMasked && (
                  <div>
                    <Label className="text-xs text-muted-foreground">API Key</Label>
                    <p className="text-sm font-mono">{provider.apiKeyMasked}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetApiKey(provider)}
                    className="flex-1"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    {provider.apiKeyMasked ? 'Update Key' : 'Set Key'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(provider)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
          setSelectedProvider(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Add New Provider' : 'Edit Provider'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen
                ? 'Add a new AI provider to your system'
                : 'Update provider configuration'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="openai"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="OpenAI"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provider description"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="apiBaseUrl">API Base URL</Label>
              <Input
                id="apiBaseUrl"
                value={formData.apiBaseUrl}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div>
              <Label htmlFor="availableModels">Available Models *</Label>
              <Input
                id="availableModels"
                value={formData.availableModels.join(', ')}
                onChange={(e) => {
                  const models = e.target.value.split(',').map(m => m.trim()).filter(m => m);
                  setFormData({ ...formData, availableModels: models });
                }}
                placeholder="gpt-4, gpt-3.5-turbo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated list of model names
              </p>
            </div>
            <div>
              <Label htmlFor="defaultModel">Default Model</Label>
              <Input
                id="defaultModel"
                value={formData.defaultModel}
                onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                placeholder="gpt-4"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
                setSelectedProvider(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleSubmitCreate : handleSubmitEdit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set API Key</DialogTitle>
            <DialogDescription>
              Enter the API key for {selectedProvider?.displayName}. This will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApiKey}
              disabled={setApiKeyMutation.isPending}
            >
              {setApiKeyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProvider?.displayName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

