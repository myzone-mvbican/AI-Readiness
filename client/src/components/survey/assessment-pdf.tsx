import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { Assessment } from "@shared/types";
import { AssessmentPDF } from "@/pdfs/assessment";
import logoPath from "@/assets/logo-keeran.svg";

// Download Button Component
export const AssessmentPDFDownloadButton = ({
  assessment,
}: {
  assessment: Assessment;
}) => {
  const today = new Date();
  const completed = new Date(assessment.completedOn || today);
  const filename = `report-${assessment.id}-${completed.toLocaleDateString()}.pdf`;

  return (
    <PDFDownloadLink
      document={<AssessmentPDF assessment={assessment} logoUrl={logoPath} />}
      fileName={filename}
      className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
      style={{ textDecoration: "none" }}
    >
      {({ loading, error }) => (
        <>
          <Download className="size-4" />
          {loading
            ? "Preparing PDF..."
            : error
              ? "Error loading PDF"
              : "Download PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
};
