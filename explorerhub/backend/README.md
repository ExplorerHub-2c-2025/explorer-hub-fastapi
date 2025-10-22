# ExplorerHub Backend

Python FastAPI backend for the ExplorerHub travel and tourism platform.

## Setup

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Run the development server:
\`\`\`bash
uvicorn main:app --reload --port 8000
\`\`\`

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

Create a `.env` file with:
\`\`\`
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key
