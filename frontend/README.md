# Queue Pipeline Frontend

A modern React-based frontend for the Queue Pipeline job processing system, featuring role-based authentication, admin dashboard, and real-time job tracking.

## Features

- ✅ **Role-Based Authentication** (User/Admin)
- ✅ **Admin Dashboard** with CSV Downloads
- ✅ **Real-Time Job Tracking** with React Query
- ✅ **Responsive Design** with Tailwind CSS
- ✅ **Modern UI Components** with Shadcn UI
- ✅ **File Upload Interface**
- ✅ **Job Status Monitoring**
- ✅ **Date Range Filtering**

## Tech Stack

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
frontend/
├── src/
│   ├── components/
│   │   ├── layout/         # Layout components (Sidebar, ProtectedRoute)
│   │   ├── ui/             # Shadcn UI components
│   │   ├── JobsTable.tsx   # Job listing table
│   │   ├── JobDetailsModal.tsx # Job details modal
│   │   └── UploadJobModal.tsx # File upload modal
│   ├── pages/              # Page components
│   │   ├── AdminDashboard.tsx # Admin CSV download page
│   │   ├── Dashboard.tsx   # Main jobs dashboard
│   │   ├── Login.tsx       # Authentication page
│   │   ├── FailedRows.tsx  # Failed rows display
│   │   ├── Settings.tsx    # User settings
│   │   └── NotFound.tsx    # 404 page
│   ├── services/           # API service functions
│   │   └── api.js          # Axios API client with interceptors
│   ├── hooks/              # Custom React hooks
│   │   └── useJobs.ts      # Jobs data fetching hook
│   ├── lib/                # Utility libraries
│   │   └── utils.ts        # Utility functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── vite-env.d.ts       # Vite type definitions
├── public/                 # Static assets
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── vitest.config.ts
└── README.md
```

## Installation

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended package manager)

### Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Configuration:**

   Create a `.env.local` file:

   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

## Running the Application

### Development Mode

```bash
pnpm run dev
```

The application will start on `http://localhost:5173`

### Production Build

```bash
pnpm run build
pnpm run preview
```

### Testing

```bash
pnpm run test
```

## Key Features

### Authentication

- JWT-based login/logout
- Role-based access control (user/admin)
- Protected routes with automatic redirects
- Persistent authentication state

### Admin Dashboard

- Date range picker for filtering
- Download processed rows CSV
- Download failed rows CSV
- Loading states and error handling

### Job Management

- Upload Excel files for processing
- Real-time job status updates
- Pagination for large job lists
- Download completed reports
- View failed rows per job

### UI Components

- Responsive sidebar navigation
- Modern form components
- Loading spinners and skeletons
- Toast notifications
- Modal dialogs

## API Integration

The frontend communicates with the backend API at `/api`:

- Authentication endpoints (`/auth/*`)
- Job management (`/jobs/*`)
- Admin endpoints (`/admin/*`)
- Health checks (`/health`)

All API calls include JWT tokens automatically via Axios interceptors.

## Styling

- **Tailwind CSS** for utility-first styling
- **Shadcn UI** for pre-built components
- **Custom CSS** in `src/index.css`
- **Dark/Light theme support** (configurable)

## Development

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run test` - Run tests
- `pnpm run lint` - Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (via ESLint)
- Vitest for unit testing

## Deployment

### Build for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Environment Variables

For production, set:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Contributing

1. Follow the existing code style
2. Use TypeScript for new components
3. Add tests for new features
4. Update this README for significant changes

## License

This project is licensed under the MIT License.
