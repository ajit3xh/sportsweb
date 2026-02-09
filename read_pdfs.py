import os
from pypdf import PdfReader

def extract_text(pdf_path):
    print(f"--- Extracting {os.path.basename(pdf_path)} ---")
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print(text)
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    print("------------------------------------------------")

pdfs = [
    "Database_and_Tech_Stack_Online_Sports_Facility_Management_System.pdf",
    "IEEE_SRS_Online_Sports_Facility_Management_System.pdf"
]

for pdf in pdfs:
    if os.path.exists(pdf):
        extract_text(pdf)
    else:
        print(f"File not found: {pdf}")
