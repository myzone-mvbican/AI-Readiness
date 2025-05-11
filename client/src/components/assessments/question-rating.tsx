import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface QuestionRatingProps {
  question: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  questionDescription?: string;
}

export function QuestionRating({
  question,
  value,
  onChange,
  disabled = false,
  questionDescription,
}: QuestionRatingProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">{question}</h4>
        {questionDescription && (
          <p className="text-muted-foreground text-sm">{questionDescription}</p>
        )}
      </div>

      <RadioGroup
        value={value !== null ? value.toString() : undefined}
        onValueChange={(val) => onChange(parseInt(val, 10))}
        disabled={disabled}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="2" id="r-strongly-agree" />
          <Label htmlFor="r-strongly-agree" className="font-normal">
            Strongly Agree
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id="r-agree" />
          <Label htmlFor="r-agree" className="font-normal">
            Agree
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="0" id="r-neutral" />
          <Label htmlFor="r-neutral" className="font-normal">
            Neutral
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="-1" id="r-disagree" />
          <Label htmlFor="r-disagree" className="font-normal">
            Disagree
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="-2" id="r-strongly-disagree" />
          <Label htmlFor="r-strongly-disagree" className="font-normal">
            Strongly Disagree
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}