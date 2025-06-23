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
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

interface QuestionDetailsProps {
  details: string;
  questionNumber: number;
}

export function QuestionDetails({
  details,
  questionNumber,
}: QuestionDetailsProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = <div className="text-sm leading-relaxed">{details}</div>;

  const OpenButton = () => {
    return(
      <Button
        variant="link" 
        onClick={() => setOpen(true)}
        className="p-0 text-xs lg:text-base"
      >
        <InfoIcon className="size-4" /> Why is this important?
      </Button>
    );
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <OpenButton />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-medium">
                Question {questionNumber} Details
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="pt-2">{content}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <OpenButton />
      <DrawerContent>
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-medium">
              Question {questionNumber} Details
            </DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-8">{content}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
