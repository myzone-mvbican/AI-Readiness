import { AssessmentCreateModal } from "./assessment-create-modal";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";

export const AssessmentCreateModalProvider = () => {
  const { isOpen, onClose } = useAssessmentCreateModal();

  return (
    <AssessmentCreateModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
};