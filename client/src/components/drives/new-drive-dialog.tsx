import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { generateGradeOptions } from "@/lib/utils";
import { Calendar } from "lucide-react";

// Calculate the minimum date (15 days from today)
const minDate = addDays(new Date(), 15);

// Drive form schema
const driveFormSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  driveDate: z.string().refine(
    (date) => {
      const selectedDate = new Date(date);
      return selectedDate >= minDate;
    },
    {
      message: "Drive date must be at least 15 days from today",
    }
  ),
  availableDoses: z.coerce
    .number()
    .min(1, "Number of doses must be at least 1"),
  applicableGrades: z.string().min(1, "At least one grade must be selected"),
  notes: z.string().optional(),
  // These will be used for the grade selection UI, not sent to the server
  selectedGrades: z.array(z.string()).optional(),
});

type DriveFormValues = z.infer<typeof driveFormSchema>;

interface NewDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewDriveDialog({
  isOpen,
  onClose,
  onSuccess,
}: NewDriveDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // Generate grade options, removing "All Grades" and grade ranges
  const gradeOptions = generateGradeOptions()
    .filter(option => option.value !== "All Grades")
    .filter(option => !option.value.includes("-"));

  // Initialize form with default values
  const form = useForm<DriveFormValues>({
    resolver: zodResolver(driveFormSchema),
    defaultValues: {
      vaccineName: "",
      driveDate: format(addDays(new Date(), 15), "yyyy-MM-dd"),
      availableDoses: 100,
      applicableGrades: "",
      notes: "",
      selectedGrades: [],
    },
  });

  // Create drive mutation
  const createDriveMutation = useMutation({
    mutationFn: async (data: Omit<DriveFormValues, 'selectedGrades'>) => {
      return apiRequest("POST", "/api/vaccination-drives", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vaccination drive scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vaccination-drives"] });
      form.reset();
      setSelectedGrades([]);
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule vaccination drive. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle grade selection
  const handleGradeChange = (grade: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedGrades(prev => [...prev, grade]);
    } else {
      setSelectedGrades(prev => prev.filter(g => g !== grade));
    }
  };

  // Handle "Select All" and "Clear All"
  const handleSelectAllGrades = () => {
    const allGrades = gradeOptions.map(g => g.value);
    setSelectedGrades(allGrades);
  };

  const handleClearAllGrades = () => {
    setSelectedGrades([]);
  };

  // Convert selected grades to a formatted string (e.g., "Grades 1-4, Grade 6")
  const formatGradeSelection = (grades: string[]): string => {
    if (grades.length === 0) return "";
    if (grades.length === gradeOptions.length) return "All Grades";
    
    // Simply sort and join the grade numbers
    const sortedGrades = [...grades].sort((a, b) => parseInt(a) - parseInt(b));
    return sortedGrades.join(",");
  };

  const onSubmit = (data: DriveFormValues) => {
    if (selectedGrades.length === 0) {
      form.setError("applicableGrades", {
        type: "manual",
        message: "Please select at least one grade",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Format the grade selection
    const formattedGrades = formatGradeSelection(selectedGrades);
    
    // Prepare the data for submission
    const submissionData = {
      ...data,
      applicableGrades: formattedGrades,
    };
    
    delete (submissionData as any).selectedGrades;
    
    createDriveMutation.mutate(submissionData);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setSelectedGrades([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Vaccination Drive</DialogTitle>
          <DialogDescription>
            Enter the details for the new vaccination drive. Note that drives must be
            scheduled at least 15 days in advance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vaccineName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vaccine Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MMR Vaccine" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drive Date *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="date" 
                          {...field} 
                          min={format(minDate, "yyyy-MM-dd")}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Must be at least 15 days from today
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableDoses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Doses *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applicableGrades"
              render={() => (
                <FormItem>
                  <FormLabel>Applicable Grades *</FormLabel>
                  <div className="mt-2">
                    <div className="grid grid-cols-3 gap-2">
                      {gradeOptions.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <Checkbox
                            id={`grade-${option.value}`}
                            checked={selectedGrades.includes(option.value)}
                            onCheckedChange={(checked) => 
                              handleGradeChange(option.value, checked === true)
                            }
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`grade-${option.value}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-xs text-primary-600 hover:text-primary-800 p-0"
                        onClick={handleSelectAllGrades}
                      >
                        Select All
                      </Button>
                      <span className="text-gray-500 mx-1">|</span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-xs text-primary-600 hover:text-primary-800 p-0"
                        onClick={handleClearAllGrades}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional information about this drive"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Drive"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
