# School Vaccination Portal - Setup Guide for macOS
## This README provides step-by-step instructions to set up and run the School Vaccination Portal application on macOS.

### Prerequisites:
Before you begin, ensure you have the following installed on your macOS system:
1. Node.js and npm: Version 18.x or higher
2. PostgreSQL: Version 14 or higher

Follow the below steps on macOS to install the packages:

**Node Using Homebrew**
brew install node@18

**Postgres Using Homebrew**
brew install postgresql@14

**To start PostgreSQL service on macOS**
brew services start postgresql@14

### Application Setup/Installation Steps:

1. Clone the Repository
    git clone https://github.com/danglingpntr/school-vaccination-portal.git
    cd school-vaccination-portal

2. Set Up PostgreSQL Database
    **Create a new database**
    createdb vaccination_portal

    **Set environment variables in a .env file**
    echo "DATABASE_URL=postgresql://localhost:5432/vaccination_portal" > .env

3. Install Dependencies
    **Install npm packages**
    npm install

4. Initialize the Database Schema
    **Push the schema to the database**
    npm run db:push

5. Start the Development Server
    **Start both frontend and backend in development mode**
    npm run dev
    The application should now be running at http://localhost:5000.

### Default Login Credentials

The system initializes with a default admin user:
Username: admin
Password: admin123

### Application Structure

/client: React frontend code
/server: Express backend code
/shared: Shared types and schemas
/uploads: Storage location for uploaded CSV files

### Available Scripts
npm run dev: Start development server (both frontend and backend)
npm run db:push: Push database schema changes to the database
npm run build: Build the application for production
npm run start: Start the application in production mode

### Troubleshooting

**PostgreSQL Connection Issues**
If you encounter PostgreSQL connection errors, ensure:
PostgreSQL service is running:
brew services list

If not running:
brew services start postgresql@14

Database connection string is correct in .env file

Check PostgreSQL logs for any errors:
tail -f /usr/local/var/log/postgresql@14.log

**Node.js Version Compatibility**
This application requires Node.js version 18 or higher. Check your version with:
node --version
If you have multiple Node.js versions installed, use nvm to switch:
nvm use 18

### Other Common Issues:
Port Already in Use: Change the PORT in .env file
Permission Issues: Ensure proper file permissions for the project directory
Missing Dependencies: Run npm install again to ensure all dependencies are installed

### Support:
For additional help, please contact the development team or open an issue in the repository.