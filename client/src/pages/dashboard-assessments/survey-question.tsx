import React from "react";

export default function SurveyQuestion({
  question,
  value,
  onChange,
  disabled,
  questionDescription,
}: {
  question: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled: boolean;
  questionDescription?: string;
}) {
  const options = [
    { value: -2, label: "Strongly Disagree" },
    { value: -1, label: "Disagree" },
    { value: 0, label: "Neutral" },
    { value: 1, label: "Agree" },
    { value: 2, label: "Strongly Agree" },
  ];

  // Properly handle the equality comparison for the zero value
  const isOptionSelected = (optionValue: number) => {
    if (value === null) return false;
    return value === optionValue;
  };

  return (
    <div className="">
      <div className="flex items-start mb-3">
        <div className="flex-1">
          <h3 className="text-md font-medium">{question}</h3>
          {questionDescription && (
            <div className="mt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
              <p>{questionDescription}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(option.value);
            }}
            className={`px-4 py-2 rounded-md border ${
              isOptionSelected(option.value)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent hover:text-accent-foreground"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
