import { useState } from "react";
import { VaccinationDrive } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface DriveDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drive: VaccinationDrive | null;
  onRefetch: () => void;
}

export default function DriveDetailsDialog({ isOpen, onClose, drive, onRefetch }: DriveDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("details");

  if (!drive) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Vaccination Drive Details</DialogTitle>
          <DialogDescription>
            Drive ID: {drive.driveId} | {formatDate(drive.driveDate, "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Drive Details</TabsTrigger>
            <TabsTrigger value="students">Vaccinated Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Vaccine</h4>
                <p className="mt-1">{drive.vaccineName}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Date</h4>
                <p className="mt-1">{formatDate(drive.driveDate, "MMMM d, yyyy")}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Status</h4>
                <p className="mt-1 capitalize">{drive.status}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Applicable Grades</h4>
                <p className="mt-1">{drive.applicableGrades}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Available Doses</h4>
                <p className="mt-1">{drive.availableDoses}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Used Doses</h4>
                <p className="mt-1">{drive.usedDoses}</p>
              </div>
              <div className="col-span-2">
                <h4 className="font-medium text-sm text-gray-500">Notes</h4>
                <p className="mt-1">{drive.notes || "No notes added"}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="students" className="py-4">
            <p className="text-gray-500 text-center py-8">
              Student vaccination records will be displayed here
            </p>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}