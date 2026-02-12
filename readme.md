# Queue Pipeline System

A comprehensive job processing and report generation system with role-based authentication, admin dashboard, and bulk data processing capabilities. The system supports uploading Excel files, processing directorship data, generating PDF reports, and aggregating results into global CSVs with IST timestamps.

## Features

- ✅ **Job Queue Management** with BullMQ and Redis
- ✅ **Bulk Excel Processing** and PDF Report Generation
- ✅ **Python Integration** for Advanced Report Processing
- ✅ **Role-Based Authentication** (User/Admin)
- ✅ **Admin Dashboard** with CSV Downloads
- ✅ **Real-Time Job Tracking** and Counters
- ✅ **File Upload & Validation**
- ✅ **RESTful API** with JWT Authentication
- ✅ **MongoDB Integration** for Data Persistence
- ✅ **Responsive Frontend** with React & TypeScript
- ✅ **Two Backend Variants** (with and without GST processing)

## Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Queue System:** Redis + BullMQ
- **File Processing:** Python Scripts with LibreOffice
- **Authentication:** JWT Tokens
- **File Upload:** Multer

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** React Query (@tanstack/react-query)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Date Handling:** date-fns

## Project Structure

```
queue-pipeline/
├── .gitignore
├── readme.md
├── backend-with-gst/          # Main backend (with GST processing)
│   ├── src/
│   │   ├── config/            # Database, Redis, Multer configs
│   │   ├── controllers/       # Auth, Job, Admin controllers
│   │   ├── middleware/        # Auth, Admin middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   ├── utils/             # File validation, Excel conversion
│   │   ├── workers/           # Background job processors
│   │   └── services/          # Python execution, Report generation
│   ├── data/                  # Processed data storage
│   │   ├── processedRows/     # Global processed rows CSV
│   │   └── failedRows/        # Global failed rows CSV
│   ├── python/                # Python scripts for report generation
│   ├── uploads/               # Uploaded files directory
│   ├── package.json
│   └── README.md
├── backend-without-gst/       # Alternative backend (without GST)
│   └── [similar structure]
└── frontend/                  # React frontend application
    ├── src/
    │   ├── components/        # UI components (JobsTable, Modals, etc.)
    │   ├── pages/             # Page components (Dashboard, Login, etc.)
    │   ├── services/          # API client
    │   ├── hooks/             # Custom hooks (useJobs, etc.)
    │   ├── lib/               # Utilities
    │   └── types/             # TypeScript types
    ├── public/                # Static assets
    ├── package.json
    └── README.md
```

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis
- Python 3.8+ (for report generation scripts)
- LibreOffice (for PDF conversion)
- pnpm (recommended package manager)

### Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd queue-pipeline
   ```

2. **Backend Setup (choose one):**

   For GST processing:
   ```bash
   cd backend-with-gst
   pnpm install
   ```

   Or without GST:
   ```bash
   cd backend-without-gst
   pnpm install
   ```

3. **Frontend Setup:**

   ```bash
   cd ../frontend
   pnpm install
   ```

4. **Python Dependencies:**

   ```bash
   pip install pandas openpyxl requests python-dotenv
   ```

5. **Install LibreOffice:**

   Download and install LibreOffice from [https://www.libreoffice.org/download/download/](https://www.libreoffice.org/download/download/) for PDF conversion functionality.

   - **Windows:** Download the MSI installer and run it.
   - **macOS:** Use Homebrew: `brew install --cask libreoffice`
   - **Linux:** Use your package manager, e.g., `sudo apt install libreoffice`

6. **Environment Configuration:**

   Create `.env` files in backend directories:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/queue-pipeline
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ONGRID_API_KEY=your-ongrid-key
   ONGRID_AUTH_TYPE=your-auth-type
   ONGRID_REFERENCE_ID=your-ref-id
   DIGITAP_USERNAME=your-digitap-username
   DIGITAP_PASSWORD=your-digitap-password
   ```

   And in frontend:

   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

7. **Start Services:**

   ```bash
   # MongoDB
   mongod

   # Redis
   redis-server
   ```

## Running the Application

### Development Mode

1. **Start Backend:**

   ```bash
   cd backend-with-gst  # or backend-without-gst
   pnpm run dev
   ```

2. **Start Worker:**

   ```bash
   node src/workers/worker.js
   ```

3. **Start Frontend:**

   ```bash
   cd frontend
   pnpm run dev
   ```

   The frontend will run on `http://localhost:5173`, backend on `http://localhost:5000`.

### Production Mode

```bash
# Backend
cd backend-with-gst
pnpm start

# Frontend
cd frontend
pnpm run build
pnpm run preview
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration (supports role assignment)
- `POST /api/auth/login` - User login
- `GET /api/auth/authenticate` - Verify authentication status

### Job Management

- `POST /api/jobs` - Create new job (upload Excel file)
- `GET /api/jobs` - Get paginated jobs list
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/:id/status` - Get job processing status
- `GET /api/jobs/:id/download/csv` - Download processed CSV
- `GET /api/jobs/:id/download/zip` - Download report ZIP
- `GET /api/jobs/:id/failed-rows` - Download failed rows CSV for job

### Admin Endpoints (Admin Role Required)

- `GET /api/admin/download/processed_rows?from=YYYY-MM-DD&to=YYYY-MM-DD` - Download global processed rows CSV filtered by date
- `GET /api/admin/download/failed_rows?from=YYYY-MM-DD&to=YYYY-MM-DD` - Download global failed rows CSV filtered by date

### Health Check

- `GET /api/health` - Application health status

## Key Features

### Job Processing Flow

1. **File Upload:** Excel files uploaded via authenticated API
2. **Validation:** Format and content validation
3. **Queue Processing:** Jobs queued with BullMQ for background processing
4. **Data Enrichment:** Python scripts process directorship data (GST validation, DIN lookups)
5. **Report Generation:** PDF reports created using LibreOffice
6. **Global Aggregation:** Successful/failed rows appended to global CSVs with IST timestamps
7. **Real-Time Updates:** Job counters updated during processing

### Role-Based Access

- **User Role:** Can upload jobs, view own jobs, download reports
- **Admin Role:** All user permissions + access to admin dashboard and global CSV downloads

### Admin Dashboard

- Date range picker for filtering downloads
- Download processed rows CSV (with timestamps)
- Download failed rows CSV (with timestamps)
- Responsive UI with loading states

### Data Processing

- **Input:** Excel files with directorship data (columns: Ref No, Candidate Name, PAN)
- **Processing:** Python scripts handle GST validation, DIN lookups via APIs
- **Output:** Individual PDF reports + global aggregated CSVs
- **Timestamps:** All records timestamped in IST (Asia/Kolkata)

## Database Schema

### Client Model

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,
  role: String, // 'user' | 'admin'
  createdAt: Date,
  updatedAt: Date
}
```

### Job Processing Model

```javascript
{
  _id: ObjectId,
  jobId: String,
  clientId: ObjectId,
  jobStatus: String, // 'queued', 'processing', 'failed', 'completed'
  directorshipStatus: String,
  directorshipReportStatus: String,
  inputCsvPath: String,
  outputCsvPath: String,
  reportZipPath: String,
  failedRowsPath: String,
  totalRows: Number,
  successRows: Number,
  failedRows: Number,
  reportsGenerated: Number,
  startedAt: Date,
  completedAt: Date,
  errorMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Global Data Files

- `data/processedRows/processed_rows.csv` - Aggregated successful rows with IST timestamps
- `data/failedRows/failed_rows.csv` - Aggregated failed rows with IST timestamps

## Security Features

- JWT-based authentication with role validation
- File type and size validation
- Admin middleware for protected endpoints
- Input sanitization and error handling

## Testing

### API Testing

```bash
# Register admin user
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"password","role":"admin"}'

# Login
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Upload job
curl -X POST "http://localhost:5000/api/jobs" \
  -H "Authorization: Bearer <token>" \
  -F "file=@sample.xlsx"
```

## Deployment

### Environment Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://production-server/queue-pipeline
REDIS_URL=redis://production-redis:6379
JWT_SECRET=your-production-secret
```

### Docker Support

Consider containerizing both backend and frontend for easy deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

- Check the API documentation
- Review application logs
- Test with sample data
- Ensure all prerequisites are installed