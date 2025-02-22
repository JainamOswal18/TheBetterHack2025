from fastapi import FastAPI, UploadFile, Form, File
import fitz  # PyMuPDF
import io
import requests
from supabase import create_client, Client

# Supabase Configuration
SUPABASE_URL = "https://mntnayhgfvauknsvzdqh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udG5heWhnZnZhdWtuc3Z6ZHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIwMDY1OSwiZXhwIjoyMDU1Nzc2NjU5fQ.xGM_2lZTYZfsydj8hFK6yJ3IzUKqE-Hz-nXcbWL94gU"  # Use service role key for DB writes
SUPABASE_BUCKET = "resume"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()  

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

        # Store Candidate Info in Supabase Database
        data = {
            "user_name": name,
            "user_email": email,
            "resume_url": resume_url,
            "match_percentage": 0.0  # Default, update after processing
        }
        
        try:
            response = supabase.table("candidates").insert(data).execute()
        except Exception as e:
            return {"error": f"Failed to store in database: {str(e)}"}

        return {
            "name": name,
            "email": email,
            "resume_url": resume_url,
            "extracted_text": text_content,
            "extracted_links": links,
            "message": "Resume uploaded and stored successfully"
        }
    except Exception as e:
        return {"error": f"Failed to process resume: {str(e)}"}

# Run server with: uvicorn main:app --reload  
