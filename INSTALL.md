# SecureX Manager - Installation Guide

## Requirements

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd securex-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your MySQL credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=securex_manager
JWT_SECRET=your_super_secure_jwt_secret
```

### 4. Setup the database

Run the setup script to create the database and admin user:

```bash
node database/setup.js
```

This will:
- Create the `securex_manager` database
- Create all required tables (users, cards, card_items, tasks)
- Create the default admin user

### 5. Start the development server

```bash
npm run dev
```

### 6. Access the application

Open [http://localhost:3000](http://localhost:3000) in your browser.

Login with the default admin credentials:
- **Username:** PROXT
- **Password:** 32Ipubib5429

## Production Deployment

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Environment Variables for Production

Make sure to set these environment variables in production:

```env
DATABASE_HOST=your-mysql-host
DATABASE_PORT=3306
DATABASE_USER=your-mysql-user
DATABASE_PASSWORD=your-mysql-password
DATABASE_NAME=securex_manager
JWT_SECRET=your-very-secure-production-jwt-secret
NODE_ENV=production
```

## File Structure

```
securex-manager/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── cards/        # Cards/Access management
│   │   ├── tasks/        # Tasks management
│   │   └── users/        # User management (admin only)
│   ├── dashboard/        # Dashboard pages
│   └── login/            # Login page
├── components/           # React components
├── database/
│   ├── schema.sql        # Database schema
│   └── setup.js          # Setup script
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database connection
│   └── utils.ts          # Utility functions
└── public/               # Static files
```

## Features

- **Access Management**: Store and manage login credentials securely
- **Task Management**: Create and track tasks with statuses, priorities, and deadlines
- **User Management**: Admin can create and manage users
- **Dashboard**: Overview with statistics and charts
- **Responsive Design**: Works on desktop and mobile

## Security Notes

1. Always use a strong JWT_SECRET in production
2. Use HTTPS in production
3. Regularly backup your database
4. Change the default admin password after first login
5. Consider using MySQL SSL connections in production

## Troubleshooting

### Database connection errors

Make sure MySQL is running and the credentials in `.env.local` are correct.

### "Access denied" errors

Check that the MySQL user has proper permissions:

```sql
GRANT ALL PRIVILEGES ON securex_manager.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Session/Cookie issues

Make sure `JWT_SECRET` is set and consistent across restarts.
