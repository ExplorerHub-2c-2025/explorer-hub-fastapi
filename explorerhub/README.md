# ExplorerHub - Travel & Tourism Platform

A comprehensive web application for discovering and planning travel experiences, inspired by TripAdvisor. Built with React, Next.js, Python FastAPI, and MongoDB.

## Features

### For Travelers
- **Explore Experiences**: Discover restaurants, activities, attractions, and nature experiences
- **Advanced Filtering**: Search by category, location, price range, and ratings
- **Trip Planning**: Create personalized itineraries with custom routes
- **Reviews & Ratings**: Read and write reviews to help other travelers
- **Save to Trips**: Build your perfect travel itinerary

### For Business Owners
- **Business Dashboard**: Manage your listings and track performance
- **Analytics**: View metrics like views, ratings, and review counts
- **Review Management**: Monitor and respond to customer feedback
- **Promotions**: Create special offers and discounts

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 with CSS Modules
- **Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Backend
- **Framework**: Python FastAPI
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Pydantic models

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- MongoDB instance (local or cloud)

### Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Setup

1. Navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Create a virtual environment:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
\`\`\`

3. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Create a \`.env\` file (see \`.env.example\`):
\`\`\`env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=ExplorerHub
JWT_SECRET_KEY=your-secret-key-here
\`\`\`

5. Run the development server:
\`\`\`bash
uvicorn main:app --reload --port 8000
\`\`\`

6. API documentation available at [http://localhost:8000/docs](http://localhost:8000/docs)

### Database Setup

1. Create indexes for optimal performance:
\`\`\`bash
cd backend
python scripts/create_indexes.py
\`\`\`

2. (Optional) Seed with sample data:
\`\`\`bash
python scripts/seed_data.py
\`\`\`

Test credentials after seeding:
- Regular user: `john@example.com` / `password123`
- Business user: `business@example.com` / `password123`

## Project Structure

\`\`\`
├── app/                      # Next.js app directory
│   ├── page.tsx             # Home page
│   ├── explore/             # Explore experiences
│   ├── trips/               # Trip planning
│   ├── reviews/             # User reviews
│   ├── business/            # Business dashboard
│   └── activity/[id]/       # Activity details
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── header.tsx           # Navigation header
│   ├── footer.tsx           # Site footer
│   ├── search-bar.tsx       # Search functionality
│   └── ...
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI app entry
│   ├── config.py           # Configuration
│   ├── database.py         # MongoDB connection
│   ├── auth.py             # JWT authentication
│   ├── models/             # Pydantic models
│   ├── routes/             # API endpoints
│   └── scripts/            # Database scripts
└── public/                 # Static assets
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Businesses
- `GET /api/businesses` - List businesses (with filters)
- `POST /api/businesses` - Create business (auth required)
- `GET /api/businesses/{id}` - Get business details
- `PUT /api/businesses/{id}` - Update business (owner only)
- `DELETE /api/businesses/{id}` - Delete business (owner only)

### Reviews
- `GET /api/reviews/business/{id}` - Get business reviews
- `POST /api/reviews` - Create review (auth required)
- `PUT /api/reviews/{id}` - Update review (author only)
- `DELETE /api/reviews/{id}` - Delete review (author only)

### Trips
- `GET /api/trips` - Get user trips (auth required)
- `POST /api/trips` - Create trip (auth required)
- `GET /api/trips/{id}` - Get trip details
- `PUT /api/trips/{id}` - Update trip
- `POST /api/trips/{id}/activities` - Add activity to trip

## Features in Detail

### Search & Discovery
- Full-text search across businesses
- Filter by category, location, price, and rating
- Sort by relevance, rating, or review count
- Responsive grid layout with activity cards

### Trip Planning
- Create custom itineraries
- Add activities with scheduled dates
- View trip summary and recommendations
- Share trips with others

### Business Management
- Dashboard with performance metrics
- Create and edit business listings
- Monitor reviews and ratings
- Track views and engagement

### Reviews System
- Star ratings (1-5)
- Written reviews with titles
- Helpful vote system
- Automatic rating calculations

## Environment Variables

### Frontend
No environment variables required for basic functionality.

### Backend
- `MONGODB_URL` - MongoDB connection string
- `DATABASE_NAME` - Database name (default: ExplorerHub)
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration (default: 30)
- `CORS_ORIGINS` - Allowed CORS origins

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically

### Backend (Railway/Render)
1. Create new service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)
1. Create cluster
2. Get connection string
3. Update `MONGODB_URL` in backend

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
\`\`\`

This README provides comprehensive documentation for setting up and running the ExplorerHub application.
