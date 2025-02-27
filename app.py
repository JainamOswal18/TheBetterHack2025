from fastapi import FastAPI, UploadFile, Form, File
import fitz  # PyMuPDF
import io
import requests
from supabase import create_client, Client
from agents import score_resume  # Importing the scoring function
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# # Add CORS middleware configuration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://resume-scorer.jainamoswal.tech"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

@app.get("/")  
def read_root():  
    return {"message": "HR Analytics API is running!"}  

@app.post("/submit-resume")
async def submit_resume(
    name: str = Form(...),
    email: str = Form(...),
    resume: UploadFile = File(...)
):
    try:
        # Read the PDF file
        pdf_content = await resume.read()
        pdf_file = io.BytesIO(pdf_content)
        
        # Use PyMuPDF to extract text and links
        doc = fitz.open(stream=pdf_file, filetype="pdf")
        
        # Extract text from all pages
        text_content = ""
        links = []
        
        for page in doc:
            # Extract text
            text_content += page.get_text()
            
            # Extract links
            page_links = page.get_links()
            for link in page_links:
                if 'uri' in link:
                    links.append(link['uri'])

        doc.close()

        # Upload Resume to Supabase Storage
        file_name = f"{email}_resume.pdf"
        try:
            upload_response = supabase.storage.from_(SUPABASE_BUCKET).upload(file_name, pdf_content)
            resume_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{file_name}"
        except Exception as e:
            return {"error": f"Failed to upload to storage: {str(e)}"}

        # Hardcoded Job Description
        job_description = """📌 Job Title: Data Science Fresher

            🔍 Job Requirements
            1️⃣ Skills (Technical & Soft Skills):

            Programming: Python, R, or SQL for data analysis and manipulation.
            Machine Learning: Knowledge of supervised & unsupervised learning, feature engineering, and model evaluation.
            Statistics & Mathematics: Understanding of probability, linear algebra, and hypothesis testing.
            Data Visualization: Experience with Matplotlib, Seaborn, Tableau, or Power BI.
            Big Data (Preferred): Basics of Hadoop, Spark, or cloud-based analytics (AWS, GCP, Azure).
            Soft Skills: Analytical thinking, problem-solving, and communication skills.
            2️⃣ Experience:

            Years of Experience: 0-2 years (Entry-Level / Fresher Role).
            Preferred: Internship, freelance projects, research work, or Kaggle competitions in Data Science.
            Bonus: Experience with open-source contributions or participation in hackathons.
            3️⃣ Educational Qualifications:

            Degree Required: Bachelor's or Master's in Computer Science, Data Science, Statistics, Mathematics, AI, or related field.
            Certifications (Preferred but Not Mandatory): Coursera, Udacity, IBM Data Science, Google Data Analytics, or equivalent.
            4️⃣ Additional Requirements:

            Passion for data-driven decision-making.
            Ability to adapt and learn new technologies quickly.
            Familiarity with cloud platforms (AWS, Azure, GCP) is an added advantage.
            """

        print("extracted text");
        # Call the score_resume function
        scoring_result = score_resume(text_content, job_description, links)

        print("scored result");

        # Update the data dictionary with the evaluation scores
        data = {
            "user_name": name,
            "user_email": email,
            "resume_url": resume_url,
            "parameter_score": scoring_result["Parameter Score"],
            "job_similarity_score": scoring_result["Job Similarity Score"],
            "github_score": scoring_result["GitHub Score"],
            "total_score": scoring_result["Total Score"]
        }
        
        try:
            # Insert data into Supabase with all scores
            response = supabase.table("candidates").insert(data).execute()
        except Exception as e:
            return {"error": f"Failed to store in database: {str(e)}"}

        print("stored in database");

        return {
            "name": name,
            "email": email,
            "resume_url": resume_url,
            "extracted_text": text_content,
            "extracted_links": links,
            "evaluation": scoring_result,
            "message": "Resume uploaded, stored, and evaluated successfully."
        }
    except Exception as e:
        return {"error": f"Failed to process resume: {str(e)}"}

# Run server with: uvicorn main:app --reload  
