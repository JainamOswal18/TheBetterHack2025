# Resume Scorer

An AI-powered resume scoring system that evaluates resumes against job descriptions and GitHub portfolios.

## Features

- Resume analysis against job descriptions
- GitHub portfolio evaluation
- Automated scoring system
- Interactive web interface

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm 8+
- GitHub API token
- Supabase account
- OpenAI API key / Any LLM API key

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/JainamOswal18/TheBetterHack2025.git
   cd TheBetterHack2025
   ```

2. **Set up environment variables**

   Create two environment files:

   `.env` (for backend):
   ```env
   SUPABASE_URL="your_supabase_project_url"
   SUPABASE_KEY="your_supabase_service_role_key"
   SUPABASE_BUCKET="resume"
   GITHUB_API_TOKEN="your_github_token"
   OPENAI_API_KEY="your_openai_api_key"
   ```

   `.env.local` (for frontend):
   ```env
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```

3. **Set up the backend**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Set up the frontend**
   ```bash
   cd project
   npm install
   ```

## Running the Application

1. **Start the backend server**
   ```bash
   python -m uvicorn app:app --reload
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser

## Environment Variables

### Backend (.env)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Service role key for database operations
- `SUPABASE_BUCKET`: Storage bucket name for resumes
- `GITHUB_API_TOKEN`: GitHub personal access token
- `OPENAI_API_KEY`: OpenAI API key for analysis

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side operations

## Development

- Backend API runs on `http://localhost:8000`
- Frontend development server runs on `http://localhost:3000`
- API documentation available at `http://localhost:8000/docs`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.