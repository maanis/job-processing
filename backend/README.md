# Job Processing Backend

A robust job processing system for handling bulk directorship report generation with Python integration.

## Features

- ✅ Job Queue Management with Bull
- ✅ Bulk Excel Processing
- ✅ Python Script Integration for Report Generation
- ✅ RESTful API Design
- ✅ MongoDB Integration
- ✅ Redis for Queue Management
- ✅ File Upload and Validation
- ✅ JWT Authentication

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Queue System:** Redis + Bull
- **File Processing:** Python Scripts
- **Authentication:** JWT Tokens
- **File Upload:** Multer

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Database configuration
│   │   ├── multer.js          # File upload configuration
│   │   └── redis.js           # Redis configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication endpoints
│   │   ├── healthController.js # Health check endpoints
│   │   └── jobController.js   # Job management endpoints
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── uploadMiddleware.js # File upload middleware
│   ├── models/
│   │   ├── ClientModel.js     # Client data model
│   │   └── JobProcessingModel.js # Job processing model
│   ├── queues/
│   │   └── job.queue.js       # Bull queue configuration
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── healthRoutes.js    # Health check routes
│   │   └── jobRoutes.js       # Job processing routes
│   ├── services/
│   │   └── job.service.js     # Job processing service
│   ├── utils/
│   │   ├── excelToCsv.js      # Excel to CSV conversion
│   │   └── fileValidator.js   # File validation utilities
│   └── index.js               # Main application file
├── data/                      # Processed data storage
├── python/                    # Python scripts for report generation
│   ├── directorship_bulk.py
│   └── directorship_reports_updated_fast.py
├── reportTemplate/
│   └── directorship-report.html # Report template
├── uploads/                   # Uploaded files directory
├── workers/                   # Background workers
│   ├── worker.js              # Main worker file
│   ├── processors/
│   │   └── job.processor.js   # Job processing logic
│   └── services/
│       ├── python.service.js  # Python script execution
│       └── report.service.js  # Report generation service
├── package.json
├── pnpm-lock.yaml
└── README.md
```
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- Python 3.8+ (for report generation scripts)
- pnpm (recommended package manager)

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/maanis/job-processing.git
   cd job-processing/backend
   ```

2. **Install Node.js dependencies:**

   ```bash
   pnpm install
   ```

3. **Install Python dependencies:**

   ```bash
   pip install pandas openpyxl
   ```

4. **Environment Configuration:**
   Create a `.env` file:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/job-processing
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ```

5. **Start MongoDB and Redis:**
   ```bash
   # MongoDB
   mongod

   # Redis (in another terminal)
   redis-server
   ```

## Running the Application

### Development Mode

1. **Start the Node.js server:**

   ```bash
   pnpm run dev
   ```

2. **Start the worker process:**

   ```bash
   node src/workers/worker.js
   ```

### Production Mode

```bash
pnpm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Job Management

- `POST /api/jobs` - Create new job (upload Excel file)
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `GET /api/jobs/:id/status` - Get job processing status
- `GET /api/jobs/:id/download` - Download processed report

### Health Check

- `GET /api/health` - Application health status

## Job Processing Flow

1. **File Upload:** Excel files are uploaded via the API
2. **Validation:** Files are validated for format and content
3. **Queue Processing:** Jobs are added to Redis queue for background processing
4. **Python Execution:** Python scripts process the data and generate reports
5. **Report Generation:** HTML reports are created using templates
6. **Storage:** Processed data and reports are stored in the database

## Database Schema

### Job Model

```javascript
{
  _id: ObjectId,
  jobId: String,         // Unique job identifier
  clientId: String,      // Client identifier
  status: String,        // 'pending', 'processing', 'completed', 'failed'
  inputFile: String,     // Path to uploaded Excel file
  outputFile: String,    // Path to generated report
  createdAt: Date,
  updatedAt: Date,
  error: String,         // Error message if failed
  metadata: {
    totalRecords: Number,
    processedRecords: Number,
    reportType: String
  }
}
```

### Client Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  apiKey: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Queue System

The application uses Bull queues with Redis for job processing:

- **Job Queue:** Handles Excel file processing
- **Worker:** Processes jobs in the background
- **Retry Logic:** Automatic retries for failed jobs

## File Processing

### Supported Formats

- **Input:** Excel files (.xlsx, .xls)
- **Output:** HTML reports and CSV data files

### Python Scripts

- `directorship_bulk.py` - Bulk directorship data processing
- `directorship_reports_updated_fast.py` - Fast report generation

## Error Handling

The API includes comprehensive error handling for:

- File upload failures
- Invalid file formats
- Database connection issues
- Queue processing errors
- Python script execution failures

## Security Features

- JWT-based authentication
- File type validation
- Request size limits
- API key authentication for clients
- Input sanitization

## Testing

### API Testing

```bash
# Test job creation with Excel file
curl -X POST "http://localhost:5000/api/jobs" \
  -H "Authorization: Bearer <token>" \
  -F "file=@data.xlsx" \
  -F "clientId=client123"
```

### Health Check

```bash
curl http://localhost:5000/api/health
```

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://production-server/job-processing
REDIS_URL=redis://production-redis:6379
JWT_SECRET=your-production-secret
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Monitoring

- Health check endpoints for service monitoring
- Job status tracking
- Error logging and reporting
- Queue monitoring with Bull Dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

### Docker Support

Consider using Docker for containerized deployment of both Node.js and Python services.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

- Check the documentation files
- Review error logs
- Test with the provided examples
