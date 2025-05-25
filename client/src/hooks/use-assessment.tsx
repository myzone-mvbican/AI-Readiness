import { create } from "zustand";

interface AssessmentStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useAssessment = create<AssessmentStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
