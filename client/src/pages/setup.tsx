import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard.",
      duration: 2000,
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Scaffolding Your React Application</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">1. Create a new Vite project</h3>
          <p className="mb-3 text-gray-600">Run the following command to create a new Vite project with React:</p>
          <div className="relative bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm">
            <code>npm create vite@latest my-react-app --template react</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard("npm create vite@latest my-react-app --template react")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">2. Navigate to your project directory</h3>
          <div className="relative bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm">
            <code>cd my-react-app</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard("cd my-react-app")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">3. Install dependencies</h3>
          <p className="mb-3 text-gray-600">Install Tailwind CSS, SCSS, React Hook Form, and Zod:</p>
          <div className="relative bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm">
            <code>npm install -D tailwindcss postcss autoprefixer sass<br />npm install react-hook-form zod @hookform/resolvers</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard("npm install -D tailwindcss postcss autoprefixer sass\nnpm install react-hook-form zod @hookform/resolvers")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">4. Initialize Tailwind CSS</h3>
          <div className="relative bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm">
            <code>npx tailwindcss init -p</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard("npx tailwindcss init -p")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-gray-600">This creates <code className="text-xs bg-gray-100 p-1 rounded">tailwind.config.js</code> and <code className="text-xs bg-gray-100 p-1 rounded">postcss.config.js</code> files.</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">5. Start the development server</h3>
          <div className="relative bg-gray-900 text-gray-50 rounded-md p-4 font-mono text-sm">
            <code>npm run dev</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard("npm run dev")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
