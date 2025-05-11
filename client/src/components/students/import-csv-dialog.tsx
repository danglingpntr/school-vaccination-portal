import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, AlertCircle, FileText, Download } from "lucide-react";

interface ImportCsvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportCsvDialog({
  isOpen,
  onClose,
  onSuccess,
}: ImportCsvDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import CSV mutation
  const importCsvMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("POST", "/api/students/import", formData, true);
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Students have been imported successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "There was an error importing the file.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setFileError("Please select a CSV file");
      return;
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      setFileError("Only CSV files are allowed");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", file);
    importCsvMutation.mutate(formData);
  };

  // Function to handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setFileError(null);
  };

  // Function to download sample CSV template
  const downloadSampleCsv = () => {
    // Create sample CSV content
    const csvContent = `firstName,lastName,email,dateOfBirth,grade,address,parentContact
John,Doe,john.doe@example.com,2010-05-15,Grade 5,123 Main St,123-456-7890
Jane,Smith,jane.smith@example.com,2011-07-22,Grade 4,456 Oak Ave,987-654-3210`;

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setFileError(null);
    setIsSubmitting(false);
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  // Custom file input styles
  const fileInputContainerStyles = `
    flex justify-center px-6 pt-5 pb-6 border-2 ${
      fileError ? "border-red-300" : "border-gray-300"
    } border-dashed rounded-md hover:border-primary-300 transition-colors
  `;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student information. The file should contain
            columns for student details such as name, email, grade, etc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {fileError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <div className={fileInputContainerStyles}>
            <div className="space-y-1 text-center">
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="mx-auto h-12 w-12 text-primary-400" />
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="mt-2 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-primary-600 hover:text-primary-500 w-full justify-center"
              onClick={downloadSampleCsv}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Sample CSV Template
            </Button>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isSubmitting}>
              {isSubmitting ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to handle file uploads in apiRequest
apiRequest.fileUpload = async (
  method: string,
  url: string,
  formData: FormData
): Promise<Response> => {
  const res = await fetch(url, {
    method,
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
};
