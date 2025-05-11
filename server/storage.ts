import { 
  users, type User, type InsertUser,
  students, type Student, type InsertStudent,
  vaccinationDrives, type VaccinationDrive, type InsertVaccinationDrive,
  vaccinationRecords, type VaccinationRecord, type InsertVaccinationRecord,
  activityLogs, type ActivityLog, type InsertActivityLog 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, gte, lte, sql, desc, asc, count, sum } from "drizzle-orm";
import { format } from "date-fns";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student operations
  getStudents(options?: { search?: string, grade?: string, vaccinationStatus?: string, page?: number, limit?: number }): Promise<{ students: Student[], total: number }>;
  getStudentById(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  bulkCreateStudents(students: InsertStudent[]): Promise<number>;

  // Vaccination drive operations
  getVaccinationDrives(options?: { search?: string, status?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number }): Promise<{ drives: VaccinationDrive[], total: number }>;
  getUpcomingVaccinationDrives(limit?: number): Promise<VaccinationDrive[]>;
  getVaccinationDriveById(id: number): Promise<VaccinationDrive | undefined>;
  getVaccinationDriveByDriveId(driveId: string): Promise<VaccinationDrive | undefined>;
  createVaccinationDrive(drive: InsertVaccinationDrive): Promise<VaccinationDrive>;
  updateVaccinationDrive(id: number, drive: Partial<InsertVaccinationDrive>): Promise<VaccinationDrive | undefined>;
  deleteVaccinationDrive(id: number): Promise<boolean>;

  // Vaccination record operations
  getVaccinationRecords(studentId?: number, driveId?: number): Promise<VaccinationRecord[]>;
  createVaccinationRecord(record: InsertVaccinationRecord): Promise<VaccinationRecord>;
  deleteVaccinationRecord(id: number): Promise<boolean>;

  // Activity log operations
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Dashboard operations
  getDashboardStats(): Promise<{ totalStudents: number, vaccinated: number, upcomingDrives: number, pending: number }>;
  getVaccinationProgressByGrade(): Promise<{ grade: string, percentage: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Student operations
  async getStudents(options: { search?: string, grade?: string, vaccinationStatus?: string, page?: number, limit?: number } = {}): Promise<{ students: Student[], total: number }> {
    try {
      console.log("Debug - getStudents called with options:", options);
      const { search, grade, vaccinationStatus, page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      // Simplify the query to rule out any potential Drizzle issues
      const studentResults = await db.select().from(students);
      console.log("Debug - Direct query results:", studentResults);
      
      // Apply filtering in memory - start with all students
      let filteredResults = [...studentResults];
      
      // Apply search filter if provided
      if (search && search.trim() !== '') {
        const searchLower = search.toLowerCase();
        filteredResults = filteredResults.filter(student => 
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower) ||
          (student.email && student.email.toLowerCase().includes(searchLower)) ||
          student.studentId.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply grade filter if provided and not 'all'
      if (grade && grade !== 'all' && grade !== 'All Grades') {
        filteredResults = filteredResults.filter(student => 
          student.grade === grade
        );
      }
      
      // Apply pagination
      const paginatedResults = filteredResults.slice(offset, offset + limit);
      
      console.log("Debug - Filtered and paginated results:", {
        total: filteredResults.length,
        pageResults: paginatedResults
      });
      
      return { 
        students: paginatedResults, 
        total: filteredResults.length 
      };
    } catch (error) {
      console.error("Error in getStudents method:", error);
      return { students: [], total: 0 };
    }
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [createdStudent] = await db.insert(students).values(student).returning();
    return createdStudent;
  }

  async updateStudent(id: number, studentUpdate: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(students)
      .set(studentUpdate)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return result.rowCount > 0;
  }

  async bulkCreateStudents(studentsData: InsertStudent[]): Promise<number> {
    const result = await db.insert(students).values(studentsData);
    return result.rowCount;
  }

  // Vaccination drive operations
  async getVaccinationDrives(options: { search?: string, status?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number } = {}): Promise<{ drives: VaccinationDrive[], total: number }> {
    const { search, status, startDate, endDate, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    let query = db.select().from(vaccinationDrives);
    
    if (search) {
      query = query.where(like(vaccinationDrives.vaccineName, `%${search}%`));
    }
    
    if (status && status !== 'All Status') {
      query = query.where(eq(vaccinationDrives.status, status.toLowerCase()));
    }
    
    if (startDate) {
      query = query.where(gte(vaccinationDrives.driveDate, startDate.toISOString()));
    }
    
    if (endDate) {
      query = query.where(lte(vaccinationDrives.driveDate, endDate.toISOString()));
    }
    
    const drivesResults = await query.limit(limit).offset(offset).orderBy(desc(vaccinationDrives.driveDate));
    
    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(vaccinationDrives)
      .where(search ? like(vaccinationDrives.vaccineName, `%${search}%`) : undefined)
      .where(status && status !== 'All Status' ? eq(vaccinationDrives.status, status.toLowerCase()) : undefined)
      .where(startDate ? gte(vaccinationDrives.driveDate, startDate.toISOString()) : undefined)
      .where(endDate ? lte(vaccinationDrives.driveDate, endDate.toISOString()) : undefined);
    
    return { drives: drivesResults, total };
  }

  async getUpcomingVaccinationDrives(limit = 3): Promise<VaccinationDrive[]> {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return db
      .select()
      .from(vaccinationDrives)
      .where(
        and(
          gte(vaccinationDrives.driveDate, today.toISOString()),
          lte(vaccinationDrives.driveDate, thirtyDaysFromNow.toISOString()),
          eq(vaccinationDrives.status, 'scheduled')
        )
      )
      .orderBy(asc(vaccinationDrives.driveDate))
      .limit(limit);
  }

  async getVaccinationDriveById(id: number): Promise<VaccinationDrive | undefined> {
    const [drive] = await db.select().from(vaccinationDrives).where(eq(vaccinationDrives.id, id));
    return drive;
  }

  async getVaccinationDriveByDriveId(driveId: string): Promise<VaccinationDrive | undefined> {
    const [drive] = await db.select().from(vaccinationDrives).where(eq(vaccinationDrives.driveId, driveId));
    return drive;
  }

  async createVaccinationDrive(drive: InsertVaccinationDrive): Promise<VaccinationDrive> {
    const [createdDrive] = await db.insert(vaccinationDrives).values(drive).returning();
    return createdDrive;
  }

  async updateVaccinationDrive(id: number, driveUpdate: Partial<InsertVaccinationDrive>): Promise<VaccinationDrive | undefined> {
    const [updatedDrive] = await db
      .update(vaccinationDrives)
      .set(driveUpdate)
      .where(eq(vaccinationDrives.id, id))
      .returning();
    return updatedDrive;
  }

  async deleteVaccinationDrive(id: number): Promise<boolean> {
    const result = await db.delete(vaccinationDrives).where(eq(vaccinationDrives.id, id));
    return result.rowCount > 0;
  }

  // Vaccination record operations
  async getVaccinationRecords(studentId?: number, driveId?: number): Promise<VaccinationRecord[]> {
    let query = db.select().from(vaccinationRecords);
    
    if (studentId) {
      query = query.where(eq(vaccinationRecords.studentId, studentId));
    }
    
    if (driveId) {
      query = query.where(eq(vaccinationRecords.driveId, driveId));
    }
    
    return query.orderBy(desc(vaccinationRecords.vaccinationDate));
  }

  async createVaccinationRecord(record: InsertVaccinationRecord): Promise<VaccinationRecord> {
    try {
      const [createdRecord] = await db.insert(vaccinationRecords).values(record).returning();
      
      // Update the used doses count for the drive
      await db
        .update(vaccinationDrives)
        .set({ usedDoses: sql`${vaccinationDrives.usedDoses} + 1` })
        .where(eq(vaccinationDrives.id, record.driveId));
      
      return createdRecord;
    } catch (error) {
      // Handle unique constraint violation (student already vaccinated in this drive)
      if (error.code === '23505') {
        throw new Error('Student has already been vaccinated in this drive');
      }
      throw error;
    }
  }

  async deleteVaccinationRecord(id: number): Promise<boolean> {
    const [record] = await db.select().from(vaccinationRecords).where(eq(vaccinationRecords.id, id));
    
    if (!record) {
      return false;
    }
    
    const result = await db.delete(vaccinationRecords).where(eq(vaccinationRecords.id, id));
    
    if (result.rowCount > 0) {
      // Update the used doses count for the drive
      await db
        .update(vaccinationDrives)
        .set({ usedDoses: sql`${vaccinationDrives.usedDoses} - 1` })
        .where(eq(vaccinationDrives.id, record.driveId));
      
      return true;
    }
    
    return false;
  }

  // Activity log operations
  async getActivityLogs(limit = 10): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [createdLog] = await db.insert(activityLogs).values(log).returning();
    return createdLog;
  }

  // Dashboard operations
  async getDashboardStats(): Promise<{ totalStudents: number, vaccinated: number, upcomingDrives: number, pending: number }> {
    // Get total students
    const [{ value: totalStudents }] = await db
      .select({ value: count() })
      .from(students);
    
    // Get vaccinated students (distinct count of students with vaccination records)
    const [{ value: vaccinated }] = await db
      .select({ 
        value: sql<number>`COUNT(DISTINCT ${vaccinationRecords.studentId})` 
      })
      .from(vaccinationRecords);
    
    // Get upcoming drives count
    const today = new Date();
    const [{ value: upcomingDrives }] = await db
      .select({ value: count() })
      .from(vaccinationDrives)
      .where(
        and(
          gte(vaccinationDrives.driveDate, today.toISOString()),
          eq(vaccinationDrives.status, 'scheduled')
        )
      );
    
    // Calculate pending (students without vaccination)
    const pending = totalStudents - vaccinated;
    
    return { totalStudents, vaccinated, upcomingDrives, pending };
  }

  async getVaccinationProgressByGrade(): Promise<{ grade: string, percentage: number }[]> {
    // Get counts by grade
    const gradeCounts = await db
      .select({
        grade: students.grade,
        total: count(),
      })
      .from(students)
      .groupBy(students.grade);
    
    // Get vaccinated counts by grade
    const vaccinatedByGrade = await db
      .select({
        grade: students.grade,
        vaccinated: count(),
      })
      .from(vaccinationRecords)
      .leftJoin(students, eq(vaccinationRecords.studentId, students.id))
      .groupBy(students.grade);
    
    // Calculate percentages
    return gradeCounts.map(gradeData => {
      const vaccinatedData = vaccinatedByGrade.find(v => v.grade === gradeData.grade);
      const vaccinated = vaccinatedData ? vaccinatedData.vaccinated : 0;
      const percentage = gradeData.total > 0 ? Math.round((vaccinated / gradeData.total) * 100) : 0;
      
      return {
        grade: gradeData.grade,
        percentage
      };
    });
  }
}

export const storage = new DatabaseStorage();
