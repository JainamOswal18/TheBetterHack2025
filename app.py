from fastapi import FastAPI, UploadFile, Form, File
from PyPDF2 import PdfReader
import io

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
        pdf_reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text()

        return {
            "name": name,
            "email": email,
            "extracted_text": text_content,
            "message": "Resume processed successfully"
        }
    except Exception as e:
        return {
            "error": f"Failed to process resume: {str(e)}"
        }

# Run server with: uvicorn main:app --reload  
