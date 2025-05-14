import { navigate } from "wouter/use-browser-location";
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

interface DialogUserExistsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}

export default function DialogUserExists({
  open,
  onOpenChange,
  onCancel,
}: DialogUserExistsProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Account Already Exists</AlertDialogTitle>
          <AlertDialogDescription>
            An account with this email already exists. Would you like to log in
            with your existing account? Your assessment data will be saved to
            your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Use a Different Email
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              navigate("/auth");
            }}
          >
            Log In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
