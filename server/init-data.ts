import { storage } from "./storage";
import { InsertStudent, InsertVaccinationDrive } from "@shared/schema";

export const initializeDefaultStudents = async (): Promise<void> => {
  try {
    // Check if there are already students in the database
    const { students } = await storage.getStudents({ limit: 1 });
    
    if (students.length === 0) {
      console.log("No students found. Adding sample students...");
      
      // Create sample students
      const sampleStudents: InsertStudent[] = [
        {
          studentId: "S12345",
          firstName: "John",
          lastName: "Doe",
          grade: "10",
          email: "john.doe@example.com",
          dateOfBirth: "2007-05-15",
          address: "123 Main St",
          parentContact: "555-123-4567"
        },
        {
          studentId: "S12346",
          firstName: "Jane",
          lastName: "Smith",
          grade: "9",
          email: "jane.smith@example.com",
          dateOfBirth: "2008-03-22",
          address: "456 Oak Ave",
          parentContact: "555-987-6543"
        },
        {
          studentId: "S12347", 
          firstName: "Michael",
          lastName: "Johnson",
          grade: "11",
          email: "michael.j@example.com",
          dateOfBirth: "2006-11-10",
          address: "789 Pine St",
          parentContact: "555-456-7890"
        },
        {
          studentId: "S12348",
          firstName: "Emily",
          lastName: "Williams",
          grade: "8",
          email: "emily.w@example.com",
          dateOfBirth: "2009-07-18",
          address: "321 Cedar Ln",
          parentContact: "555-321-6547"
        },
        {
          studentId: "S12349",
          firstName: "Daniel",
          lastName: "Brown",
          grade: "12",
          email: "daniel.b@example.com",
          dateOfBirth: "2005-01-25",
          address: "654 Elm St",
          parentContact: "555-789-4561"
        }
      ];
      
      // Insert students in bulk
      const insertedCount = await storage.bulkCreateStudents(sampleStudents);
      console.log(`Added ${insertedCount} sample students successfully!`);
    } else {
      console.log("Students already exist. Skipping initialization.");
    }
  } catch (error) {
    console.error("Error initializing sample students:", error);
  }
};

export const initializeVaccinationDrives = async (): Promise<void> => {
  try {
    // Check if there are already vaccination drives in the database
    const { drives } = await storage.getVaccinationDrives({ limit: 1 });
    
    if (drives.length === 0) {
      console.log("No vaccination drives found. Adding sample drives...");
      
      // Create sample vaccination drives
      const today = new Date();
      const futureDate1 = new Date();
      futureDate1.setDate(today.getDate() + 20);
      
      const futureDate2 = new Date();
      futureDate2.setDate(today.getDate() + 35);
      
      const sampleDrives: InsertVaccinationDrive[] = [
        {
          driveId: "VD001",
          vaccineName: "COVID-19 Vaccine",
          driveDate: futureDate1.toISOString().split('T')[0],
          applicableGrades: "8,9,10",
          availableDoses: 100,
          status: "scheduled",
          notes: "First dose vaccination drive for grades 8-10"
        },
        {
          driveId: "VD002",
          vaccineName: "Influenza Vaccine",
          driveDate: futureDate2.toISOString().split('T')[0],
          applicableGrades: "11,12",
          availableDoses: 75,
          status: "scheduled",
          notes: "Annual flu vaccination for grades 11-12"
        }
      ];
      
      // Insert drives one by one
      for (const drive of sampleDrives) {
        await storage.createVaccinationDrive(drive);
      }
      
      console.log(`Added ${sampleDrives.length} sample vaccination drives successfully!`);
    } else {
      console.log("Vaccination drives already exist. Skipping initialization.");
    }
  } catch (error) {
    console.error("Error initializing vaccination drives:", error);
  }
};