# School Vaccination Portal - Setup Guide for macOS
## This README provides step-by-step instructions to set up and run the School Vaccination Portal application on macOS.

### Prerequisites:
Before you begin, ensure you have the following installed on your macOS system:
1. Node.js and npm: Version 18.x or higher
2. PostgreSQL: Version 14 or higher

Follow the below steps on macOS to install the packages:
1. Node Using Homebrew: **brew install node@18**
2. Postgres Using Homebrew: **brew install postgresql@14**
3. To start PostgreSQL service on macOS: **brew services start postgresql@14**

### Application Setup/Installation Steps:

1. Clone the Repository:<br/>
    **git clone https://github.com/danglingpntr/school-vaccination-portal.git**<br/>
    **cd school-vaccination-portal**
2. Set Up PostgreSQL Database, Create a new database run cmd:<br/> 
    **createdb vaccination_portal**
3. Set environment variables in a .env file rum cmd:<br/> 
    **echo "DATABASE_URL=postgresql://localhost:5432/vaccination_portal" > .env**
4. Install Dependencies, Install npm packages:<br/>
    **npm install**
5. Initialize the Database Schema, Push the schema to the database:<br/>
    **npm run db:push**

5. Start the Development Server, Start both frontend and backend in development mode:<br/>
    **npm run dev**
    **The application should now be running at http://localhost:5000.**

### Default Login Credentials

The system initializes with a default admin user:<br/>
Username: admin<br/>
Password: admin123<br/>

### Application Structure

/client: React frontend code<br/>
/server: Express backend code<br/>
/shared: Shared types and schemas<br/>
/uploads: Storage location for uploaded CSV files<br/>

### Available Scripts

npm run dev: Start development server (both frontend and backend)<br/>
npm run db:push: Push database schema changes to the database<br/>
npm run build: Build the application for production<br/>
npm run start: Start the application in production mode<br/>

### Troubleshooting

**PostgreSQL Connection Issues**<br/>
If you encounter PostgreSQL connection errors, ensure:<br/>
1. PostgreSQL service is running:<br/>
   **brew services list** -> check for postgres service name<br/>
   If not running:<br/>
   **brew services start postgresql@14**<br/>

2. Database connection string is correct in .env file<br/>
    Check PostgreSQL logs for any errors:<br/>
    tail -f /usr/local/var/log/postgresql@14.log<br/>

3. Node.js Version Compatibility 
This application requires Node.js version 18 or higher. Check your version with:<br/>
**node --version**<br/>
If you have multiple Node.js versions installed, use nvm to switch:<br/>
**nvm use 18**

### Other Common Issues:
Port Already in Use: Change the PORT in .env file<br/>
Permission Issues: Ensure proper file permissions for the project directory<br/>
Missing Dependencies: Run npm install again to ensure all dependencies are installed<br/>

### Support:
For additional help, please contact the development team or open an issue in the repository.