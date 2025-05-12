import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, register, authMiddleware, initializeDefaultUser } from "./auth";
import { initializeDefaultStudents, initializeVaccinationDrives } from "./init-data";
import { insertStudentSchema, insertVaccinationDriveSchema, insertVaccinationRecordSchema, students } from "@shared/schema";
import { parse } from "date-fns";
import { ZodError } from "zod";
import multer from "multer";
import Papa from "papaparse";
import fs from "fs";
import { db } from "./db";

// Add user property to Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize default admin user
  await initializeDefaultUser();
  await initializeDefaultStudents();
  await initializeVaccinationDrives();

  // Auth routes
  app.post("/api/auth/login", authenticate);
  app.post("/api/auth/register", register);

  // Dashboard routes
  app.get("/api/dashboard/stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  app.get("/api/dashboard/vaccination-progress", authMiddleware, async (req: Request, res: Response) => {
    try {
      const progress = await storage.getVaccinationProgressByGrade();
      res.json(progress);
    } catch (error) {
      console.error("Error fetching vaccination progress:", error);
      res.status(500).json({ message: "Failed to fetch vaccination progress" });
    }
  });

  app.get("/api/dashboard/upcoming-drives", authMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const drives = await storage.getUpcomingVaccinationDrives(limit);
      res.json(drives);
    } catch (error) {
      console.error("Error fetching upcoming drives:", error);
      res.status(500).json({ message: "Failed to fetch upcoming vaccination drives" });
    }
  });

  app.get("/api/dashboard/activity-logs", authMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Student routes
  app.get("/api/students", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { search, grade, vaccinationStatus } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      console.log("API - Fetching students with params:", { search, grade, vaccinationStatus, page, limit });

      // Directly check what's in the database first
      const testQuery = await db.select().from(students);
      console.log("API - Direct database query result:", testQuery);

      const result = await storage.getStudents({
        search: search as string,
        grade: grade as string,
        vaccinationStatus: vaccinationStatus as string,
        page,
        limit,
      });

      console.log("API - getStudents result:", result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudentById(id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = insertStudentSchema.parse(req.body);

      // Generate a unique student ID if not provided
      if (!validatedData.studentId) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const random = Math.floor(Math.random() * 9000 + 1000);
        validatedData.studentId = `ST-${year}${month}-${random}`;
      }

      // Create student
      const student = await storage.createStudent(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "CREATE_STUDENT",
        description: `Created new student: ${student.firstName} ${student.lastName} (${student.studentId})`,
      });

      res.status(201).json(student);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }

      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudentById(id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Validate input
      const validatedData = insertStudentSchema.partial().parse(req.body);

      // Update student
      const updatedStudent = await storage.updateStudent(id, validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "UPDATE_STUDENT",
        description: `Updated student: ${updatedStudent?.firstName} ${updatedStudent?.lastName} (${updatedStudent?.studentId})`,
      });

      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }

      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudentById(id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const success = await storage.deleteStudent(id);

      if (success) {
        // Log activity
        await storage.createActivityLog({
          userId: req.user?.id,
          action: "DELETE_STUDENT",
          description: `Deleted student: ${student.firstName} ${student.lastName} (${student.studentId})`,
        });

        res.json({ message: "Student deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete student" });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  app.post("/api/students/import", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Read file content
      const fileContent = fs.readFileSync(req.file.path, "utf8");

      // Parse CSV
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({
          message: "CSV parsing errors",
          errors: parseResult.errors.map((error: any) => error.message),
        });
      }

      // Transform and validate data
      const studentsData = parseResult.data.map((row: any) => {
        const studentData = {
          studentId: row.studentId || "",
          firstName: row.firstName || row["First Name"] || "",
          lastName: row.lastName || row["Last Name"] || "",
          email: row.email || row.Email || "",
          dateOfBirth: row.dateOfBirth || row["Date of Birth"] || null,
          grade: row.grade || row.Grade || "",
          address: row.address || row.Address || "",
          parentContact: row.parentContact || row["Parent Contact"] || "",
        };

        // Generate a student ID if not provided
        if (!studentData.studentId) {
          const date = new Date();
          const year = date.getFullYear().toString().substr(-2);
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const random = Math.floor(Math.random() * 9000 + 1000);
          studentData.studentId = `ST-${year}${month}-${random}`;
        }

        // Validate date format but keep it as string
        if (studentData.dateOfBirth) {
          try {
            // Check if the date is valid by parsing it, but keep it as a string
            parse(studentData.dateOfBirth, "yyyy-MM-dd", new Date());
            // Keep the original string format which is what the database expects
          } catch (e) {
            // If parsing fails, set to null
            studentData.dateOfBirth = null;
          }
        }

        return studentData;
      });

      // Create students in bulk
      const insertCount = await storage.bulkCreateStudents(studentsData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "IMPORT_STUDENTS",
        description: `Imported ${insertCount} students from CSV`,
      });

      // Delete the temporary file
      fs.unlinkSync(req.file.path);

      res.status(201).json({
        message: `Successfully imported ${insertCount} students`,
        count: insertCount,
      });
    } catch (error) {
      if (req.file) {
        // Delete the temporary file on error
        fs.unlinkSync(req.file.path);
      }

      console.error("Error importing students:", error);
      res.status(500).json({ message: "Failed to import students" });
    }
  });

  // Vaccination Drive routes
  app.get("/api/vaccination-drives", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { search, status } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // Parse date range if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }

      const result = await storage.getVaccinationDrives({
        search: search as string,
        status: status as string,
        startDate,
        endDate,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching vaccination drives:", error);
      res.status(500).json({ message: "Failed to fetch vaccination drives" });
    }
  });

  app.get("/api/vaccination-drives/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const drive = await storage.getVaccinationDriveById(id);

      if (!drive) {
        return res.status(404).json({ message: "Vaccination drive not found" });
      }

      res.json(drive);
    } catch (error) {
      console.error("Error fetching vaccination drive:", error);
      res.status(500).json({ message: "Failed to fetch vaccination drive" });
    }
  });

  app.post("/api/vaccination-drives", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = insertVaccinationDriveSchema.parse(req.body);

      // Validate drive date is at least 15 days in the future
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 15);

      const driveDate = new Date(validatedData.driveDate);
      if (driveDate < minDate) {
        return res.status(400).json({
          message: "Vaccination drive must be scheduled at least 15 days in advance",
        });
      }

      // Generate a unique drive ID if not provided
      if (!validatedData.driveId) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const random = Math.floor(Math.random() * 900 + 100);
        validatedData.driveId = `DR-${year}-${month}${random}`;
      }

      // Create vaccination drive
      const drive = await storage.createVaccinationDrive(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "CREATE_VACCINATION_DRIVE",
        description: `Created new vaccination drive: ${drive.vaccineName} on ${drive.driveDate}`,
      });

      res.status(201).json(drive);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid vaccination drive data", errors: error.errors });
      }

      console.error("Error creating vaccination drive:", error);
      res.status(500).json({ message: "Failed to create vaccination drive" });
    }
  });

  app.put("/api/vaccination-drives/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const drive = await storage.getVaccinationDriveById(id);

      if (!drive) {
        return res.status(404).json({ message: "Vaccination drive not found" });
      }

      // Check if drive is in the past
      const today = new Date();
      const driveDate = new Date(drive.driveDate);
      
      if (driveDate < today) {
        return res.status(400).json({ message: "Cannot edit past vaccination drives" });
      }

      // Validate input
      const validatedData = insertVaccinationDriveSchema.partial().parse(req.body);

      // If updating the date, validate it's at least 15 days in the future
      if (validatedData.driveDate) {
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 15);

        const newDriveDate = new Date(validatedData.driveDate);
        if (newDriveDate < minDate) {
          return res.status(400).json({
            message: "Vaccination drive must be scheduled at least 15 days in advance",
          });
        }
      }

      // Update vaccination drive
      const updatedDrive = await storage.updateVaccinationDrive(id, validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "UPDATE_VACCINATION_DRIVE",
        description: `Updated vaccination drive: ${updatedDrive?.vaccineName} on ${updatedDrive?.driveDate}`,
      });

      res.json(updatedDrive);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid vaccination drive data", errors: error.errors });
      }

      console.error("Error updating vaccination drive:", error);
      res.status(500).json({ message: "Failed to update vaccination drive" });
    }
  });

  app.delete("/api/vaccination-drives/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const drive = await storage.getVaccinationDriveById(id);

      if (!drive) {
        return res.status(404).json({ message: "Vaccination drive not found" });
      }

      const success = await storage.deleteVaccinationDrive(id);

      if (success) {
        // Log activity
        await storage.createActivityLog({
          userId: req.user?.id,
          action: "DELETE_VACCINATION_DRIVE",
          description: `Deleted vaccination drive: ${drive.vaccineName} on ${drive.driveDate}`,
        });

        res.json({ message: "Vaccination drive deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete vaccination drive" });
      }
    } catch (error) {
      console.error("Error deleting vaccination drive:", error);
      res.status(500).json({ message: "Failed to delete vaccination drive" });
    }
  });

  // Vaccination Record routes
  app.get("/api/vaccination-records", authMiddleware, async (req: Request, res: Response) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const driveId = req.query.driveId ? parseInt(req.query.driveId as string) : undefined;

      const records = await storage.getVaccinationRecords(studentId, driveId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching vaccination records:", error);
      res.status(500).json({ message: "Failed to fetch vaccination records" });
    }
  });

  app.post("/api/vaccination-records", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = insertVaccinationRecordSchema.parse(req.body);

      // Validate student exists
      const student = await storage.getStudentById(validatedData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Validate drive exists
      const drive = await storage.getVaccinationDriveById(validatedData.driveId);
      if (!drive) {
        return res.status(404).json({ message: "Vaccination drive not found" });
      }

      // Check if all doses have been used
      if (drive.usedDoses >= drive.availableDoses) {
        return res.status(400).json({ message: "No more doses available for this drive" });
      }

      // Create vaccination record
      const record = await storage.createVaccinationRecord(validatedData);

      // Log activity
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "CREATE_VACCINATION_RECORD",
        description: `Vaccinated student ${student.firstName} ${student.lastName} (${student.studentId}) with ${drive.vaccineName}`,
      });

      res.status(201).json(record);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid vaccination record data", errors: error.errors });
      }

      // Handle specific errors
      if (error.message === "Student has already been vaccinated in this drive") {
        return res.status(400).json({ message: error.message });
      }

      console.error("Error creating vaccination record:", error);
      res.status(500).json({ message: "Failed to create vaccination record" });
    }
  });

  app.delete("/api/vaccination-records/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVaccinationRecord(id);

      if (success) {
        // Log activity
        await storage.createActivityLog({
          userId: req.user?.id,
          action: "DELETE_VACCINATION_RECORD",
          description: `Deleted vaccination record ID: ${id}`,
        });

        res.json({ message: "Vaccination record deleted successfully" });
      } else {
        res.status(404).json({ message: "Vaccination record not found" });
      }
    } catch (error) {
      console.error("Error deleting vaccination record:", error);
      res.status(500).json({ message: "Failed to delete vaccination record" });
    }
  });

  return httpServer;
}
