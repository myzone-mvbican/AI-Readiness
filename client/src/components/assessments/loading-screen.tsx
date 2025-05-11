import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-lg font-medium">Loading assessment data...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please wait while we load your assessment and survey questions.
        </p>
      </CardContent>
    </Card>
  );
}