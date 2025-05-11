import { create } from "zustand";

interface AssessmentCreateModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useAssessmentCreateModal = create<AssessmentCreateModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));