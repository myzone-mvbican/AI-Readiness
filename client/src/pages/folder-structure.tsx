import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FolderStructure() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The folder structure has been copied to your clipboard.",
      duration: 2000,
    });
  };

  const folderStructure = `my-react-app/
├── node_modules/
├── public/
├── src/
│   ├── assets/
│   │   └── scss/
│   │       ├── _variables.scss
│   │       └── main.scss
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.module.scss
│   │   │   └── Input/
│   │   │       ├── Input.jsx
│   │   │       └── Input.module.scss
│   │   └── forms/
│   │       └── RegistrationForm/
│   │           ├── RegistrationForm.jsx
│   │           └── RegistrationForm.module.scss
│   ├── hooks/
│   │   └── useFormValidation.js
│   ├── schemas/
│   │   └── validationSchemas.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js`;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Folder Structure</h2>
      
      <p className="mb-4 text-gray-600">Your project should follow this structure for optimal organization:</p>
      
      <div className="relative">
        <div className="bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm whitespace-pre overflow-x-auto">
          {folderStructure}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={() => copyToClipboard(folderStructure)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-6 space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Key Folders Explained</h3>
          <ul className="mt-2 ml-6 space-y-2 text-gray-600 list-disc">
            <li><strong>assets/scss/</strong> - Contains global SCSS files including variables, mixins, and main styles</li>
            <li><strong>components/</strong> - Organized by feature or type (common, forms, layout, etc.)</li>
            <li><strong>hooks/</strong> - Custom React hooks</li>
            <li><strong>schemas/</strong> - Zod validation schemas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
