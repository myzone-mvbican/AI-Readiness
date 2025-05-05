import { Card, CardContent } from "@/components/ui/card";
import RegistrationForm from "@/components/forms/registration-form";
import { CheckCircle } from "lucide-react";

export default function FormExample() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Form Code */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">Form Components</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-700">React Hook Form + Zod</h3>
            <p className="text-gray-600 mb-4">
              This form demonstrates how to integrate React Hook Form with Zod schema validation. 
              It includes validation for name, email, and password fields with custom error messages.
            </p>
            <p className="text-gray-600">
              Check the source code in the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">src/components/forms/registration-form.tsx</code> and 
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm ml-1">src/schemas/validation-schemas.ts</code> files.
            </p>
          </div>
        </div>
      </div>
      
      {/* Live Form Preview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">Form Preview</h2>
        
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-medium text-gray-900 mb-4">Create an Account</h3>
          <RegistrationForm />
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Form Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>Real-time form validation with Zod</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>Field-specific error messages</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>Loading state during submission</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>Form reset after successful submission</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
