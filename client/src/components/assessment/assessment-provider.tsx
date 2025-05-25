import { ReactNode } from "react";
import { Assessment } from "./assessment";

export interface AssessmentProviderProps {
  children: ReactNode;
}

export function AssessmentProvider({
  children,
}: AssessmentProviderProps) {
  return (
    <>
      <Assessment />
      {children}
    </>
  );
}