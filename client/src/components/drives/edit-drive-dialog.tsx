import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { VaccinationDrive } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drive: VaccinationDrive | null;
  onSuccess: () => void;
}

// Form validation schema
const formSchema = z.object({
  driveDate: z.string().min(1, "Drive date is required"),
  availableDoses: z.coerce.number().min(0, "Available doses must be at least 0"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditDriveDialog({ isOpen, onClose, drive, onSuccess }: EditDriveDialogProps) {
  const { toast } = useToast();
  
  // Initialize form with drive data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: drive ? {
      driveDate: drive.driveDate,
      availableDoses: drive.availableDoses,
      notes: drive.notes || "",
    } : {
      driveDate: "",
      availableDoses: 0,
      notes: "",
    },
  });

  // Update drive mutation
  const updateDriveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!drive) throw new Error("No drive selected");
      
      const response = await fetch(`/api/vaccination-drives/${drive.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: drive.id,
          driveDate: data.driveDate,
          availableDoses: data.availableDoses,
          notes: data.notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update drive");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Drive updated",
        description: "The vaccination drive has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vaccination-drives"] });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update drive",
        description: (error as Error).message || "There was an error updating the drive",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateDriveMutation.mutate(data);
  };

  if (!drive) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vaccination Drive</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="driveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drive Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="availableDoses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Doses</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={drive.usedDoses}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add any additional information about this drive" 
                      rows={3} 
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
                onClick={onClose}
                disabled={updateDriveMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateDriveMutation.isPending}
              >
                {updateDriveMutation.isPending ? "Updating..." : "Update Drive"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}