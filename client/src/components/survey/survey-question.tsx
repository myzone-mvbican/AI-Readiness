import React from "react";

export default function SurveyQuestion({
  value,
  onChange,
  disabled,
  question,
  questionDescription,
}: {
  value: number | null | undefined;
  onChange: (value: number) => void;
  disabled: boolean;
  question: string;
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
    if (value === null || value === undefined) return false;
    return value === optionValue;
  };

  return (
    <div className="survey-question">
      <div className="flex items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xs md:text-lg text-muted-foreground font-medium">
            What is your level of agreement with this statement?
          </h3>
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
                ? "bg-primary text-primary-foreground border-primary text-xs font-bold"
                : "bg-background hover:bg-accent hover:text-accent-foreground text-xs font-bold"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
