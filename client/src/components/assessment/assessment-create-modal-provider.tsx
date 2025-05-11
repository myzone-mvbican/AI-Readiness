import { ReactNode } from "react";
import { AssessmentCreateModal } from "./assessment-create-modal";

export interface AssessmentCreateModalProviderProps {
  children: ReactNode;
}

export function AssessmentCreateModalProvider({
  children,
}: AssessmentCreateModalProviderProps) {
  return (
    <>
      <AssessmentCreateModal />
      {children}
    </>
  );
}