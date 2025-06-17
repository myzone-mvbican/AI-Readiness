import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { InfoIcon, X } from "lucide-react";

interface QuestionDetailsModalProps {
  details: string;
  questionNumber: number;
}

export function QuestionDetailsModal({
  details,
  questionNumber,
}: QuestionDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="text-sm leading-relaxed">
      {details}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="h-6 w-6 p-0"
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-medium">
                Question {questionNumber} Details
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-6 w-6 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="pt-2">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-6 w-6 p-0"
      >
        <InfoIcon className="h-4 w-4" />
      </Button>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-medium">
              Question {questionNumber} Details
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-8">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}