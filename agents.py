import requests
import re
import os
from smolagents import OpenAIServerModel, CodeAgent, HfApiModel, DuckDuckGoSearchTool
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

# Initialize the model
model = OpenAIServerModel(
    model_id="gpt-4o",
    api_key=api_key  # Securely retrieved API key
)
agent = CodeAgent(tools=[DuckDuckGoSearchTool()], model=model)


# GitHub API token
GITHUB_API_TOKEN = os.getenv("GITHUB_API_TOKEN")

# Headers for GitHub API
HEADERS = {"Authorization": f"token {GITHUB_API_TOKEN}"}

# Use a session for performance
session = requests.Session()
session.headers.update(HEADERS)


def is_github_link(url):
    """Checks if a URL is a valid GitHub link."""
    return re.match(r"https?://github\.com/[\w-]+", url) is not None


def extract_github_details(url):
    """Extracts username and repo (if applicable) from a GitHub URL."""
    parts = url.rstrip('/').split('/')

    if len(parts) == 4:  # Profile link: github.com/username
        return parts[3], None
    elif len(parts) > 4:  # Repo link: github.com/username/repo
        return parts[3], parts[4] if parts[4] not in ["issues", "pulls", "tree", "blob"] else None
    return None, None


def fetch_github_profile(username):
    """Fetches GitHub user profile data."""
    url = f"https://api.github.com/users/{username}"
    response = session.get(url)

    if response.status_code == 200:
        data = response.json()
        return {
            "profile_url": data.get("html_url"),
            "name": data.get("name"),
            "bio": data.get("bio"),
            "public_repos": data.get("public_repos"),
            "followers": data.get("followers"),
            "following": data.get("following")
        }
    return None


def fetch_github_repo(username, repo):
    """Fetches GitHub repository data."""
    repo_url = f"https://api.github.com/repos/{username}/{repo}"
    response = session.get(repo_url)

    if response.status_code == 200:
        data = response.json()
        return {
            "repo_url": data.get("html_url"),
            "description": data.get("description"),
            "stars": data.get("stargazers_count"),
            "forks": data.get("forks_count"),
            "language": data.get("language")
        }
    return None


def fetch_readme(username, repo):
    """Fetches the README.md content for a repository."""
    url = f"https://api.github.com/repos/{username}/{repo}/readme"
    response = session.get(url)

    if response.status_code == 200:
        data = response.json()
        readme_content = session.get(data["download_url"]).text
        return re.sub(r"[\n\r]+", " ", readme_content)[:500]  # Clean & limit to 500 chars
    return "README not found"


def fetch_profile_readme(username):
    """Fetches profile README (from username/username repo)."""
    return fetch_readme(username, username)  # Profile README is stored in a repo with the same name as username


def fetch_languages(username, repo):
    """Fetches languages used in a repository."""
    url = f"https://api.github.com/repos/{username}/{repo}/languages"
    response = session.get(url)

    if response.status_code == 200:
        return list(response.json().keys())  # List of languages
    return []


def fetch_contributions(username):
    """Fetches user contributions from GitHub API (approximation)."""
    url = f"https://api.github.com/users/{username}/events"
    response = session.get(url)

    if response.status_code == 200:
        return len(response.json())  # Approximate count
    return 0


def scrape_github_data(links):
    """Extracts and scrapes relevant GitHub data."""
    github_data = {"profiles": [], "projects": []}

    for link in links:
        if not is_github_link(link):
            continue  # Skip non-GitHub links

        username, repo = extract_github_details(link)

        if username and not repo:  # It's a profile
            profile_data = fetch_github_profile(username)
            if profile_data:
                profile_data["contributions"] = fetch_contributions(username)
                profile_data["profile_readme"] = fetch_profile_readme(username)
                github_data["profiles"].append(profile_data)

        elif username and repo:  # It's a repository
            repo_data = fetch_github_repo(username, repo)
            if repo_data:
                repo_data["languages"] = fetch_languages(username, repo)
                repo_data["readme"] = fetch_readme(username, repo)
                github_data["projects"].append(repo_data)

    return github_data


def score_resume(resume_text, job_description, extracted_links):
    try:
        # Get scores from agent
        scoring_prompt = f"""
        You are a professional resume scorer. Score in three parts:

        PART 1: RESUME PARAMETERS (20 points total)
        Score each parameter from 0-5:
        1. Impact: Measurable achievements and results
        2. Format: Clear structure and professional presentation
        3. Language: Grammar, spelling, and professional writing
        4. Skills: Demonstrated technical and soft skills

        PART 2: JOB SIMILARITY (60 points total)
        Compare resume with job requirements:
        - Required Skills Match (30 points)
        - Experience Level Match (15 points)
        - Education Match (15 points)

        PART 3: GITHUB PROJECTS (20 points total)
        Evaluate GitHub portfolio:
        - Project Relevance (8 points)
        - Technical Complexity (6 points)
        - Code Quality (6 points)

        Job Description:
        {job_description}

        Resume:
        {resume_text}

        GitHub Portfolio:
        {scrape_github_data(extracted_links)}

        Provide scores in this format only:
        IMPACT: <0-5>
        FORMAT: <0-5>
        LANGUAGE: <0-5>
        SKILLS: <0-5>
        SIMILARITY: <0-60>
        GITHUB: <0-20>
        TOTAL: <sum>
        """
        
        response = agent.run(scoring_prompt)
        
        # Parse the string response into a dictionary
        scores = {}
        if isinstance(response, str):
            for line in response.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    # More robust number extraction
                    try:
                        # Extract numbers and convert to int, default to 0 if no numbers found
                        numbers = ''.join(filter(str.isdigit, value.strip()))
                        scores[key.strip()] = int(numbers) if numbers else 0
                    except ValueError:
                        scores[key.strip()] = 0
        else:
            scores = response  # In case it's already a dictionary

        # Use the GitHub score directly from the agent's response
        github_score = float(scores.get('GITHUB', 0))
        
        # Compile final results
        evaluation = {
            "Parameter Score": float(scores.get('IMPACT', 0) + scores.get('FORMAT', 0) + 
                                   scores.get('LANGUAGE', 0) + scores.get('SKILLS', 0)),
            "Job Similarity Score": float(scores.get('SIMILARITY', 0)),
            "GitHub Score": github_score,
            "Total Score": float(scores.get('TOTAL', 0)) if 'TOTAL' in scores else 
                          float(scores.get('IMPACT', 0) + scores.get('FORMAT', 0) + 
                                scores.get('LANGUAGE', 0) + scores.get('SKILLS', 0) + 
                                scores.get('SIMILARITY', 0) + github_score)
        }
        
        return evaluation

    except Exception as e:
        print(f"Error in score_resume: {e}")
        return {
            "Parameter Score": 0.0,
            "Job Similarity Score": 0.0,
            "GitHub Score": 0.0,
            "Total Score": 0.0
        }


# Test case (Only runs when executed directly)
if __name__ == "__main__":
    sample_resume = "Experienced Data Scientist with ML expertise."
    sample_job_description = "Looking for a Data Scientist with Python and ML experience."
    sample_links = ["https://github.com/jainamoswal18/"]

    result = score_resume(sample_resume, sample_job_description, sample_links)
    print(result)
