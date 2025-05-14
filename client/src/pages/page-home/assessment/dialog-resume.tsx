import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DialogResumeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
  onSubmit?: () => void;
}

export default function DialogResume({
  open,
  onOpenChange,
  onCancel,
  onSubmit,
}: DialogResumeProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume Previous Assessment?</AlertDialogTitle>
          <AlertDialogDescription>
            We found a partially completed assessment. Would you like to resume
            where you left off or start a new assessment?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Start New</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit}>Resume</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
