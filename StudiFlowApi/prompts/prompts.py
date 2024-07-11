import io
import json
from PyPDF2 import PdfReader
from docx import Document
from PIL import Image
import pytesseract
import anthropic
import json

class AnthropicAPI():

    client = anthropic.Anthropic()

    def is_syllabus_prompt(self, json_str):
        prompt = f"""Given this JSON representing a course module, classify it as either:
        1. A syllabus, course overview material, course information, or similar.
        2. Not a syllabus, course overview material, course information, or similar.

        JSON:
        {json_str}

        Please provide your classification as only True or False. Nothing else."""

        # Make the API call
        response = self.client.completions.create(
            model="claude-3-sonnet-20240229",
            prompt=prompt,
            max_tokens_to_sample=300,
        )
        response_data = response.completion
        print(response_data)
        return response_data

    def is_module_task_prompt(self, json_str):
        prompt = f"""Given this JSON representing a course module item, classify it as either:
        1. A task or material that strongly suggests the existence of a task.
        2. Not a task or does not strongly suggest the existence of a task.

        JSON:
        {json_str}

        Please provide your classification as only True or False. Nothing else."""

        # Make the API call
        response = self.client.completions.create(
            model="claude-3-sonnet-20240229",
            prompt=prompt,
            max_tokens_to_sample=300,
        )
        response_data = response.completion
        print(response_data)
        return response_data

    def get_distribution_from_syllabus(self, file_type, api_response):
        def extract_text(api_response, file_type):
            if 'pdf' in file_type:
                pdf_file = io.BytesIO(api_response.content)
                pdf_reader = PdfReader(pdf_file)
                return "\n".join(page.extract_text() for page in pdf_reader.pages)
            elif 'docx' in file_type:
                docx_file = io.BytesIO(api_response.content)
                document = Document(docx_file)
                return "\n".join([paragraph.text for paragraph in document.paragraphs])
            elif 'txt' in file_type:
                return api_response.text
            elif 'png' in file_type or 'jpeg' in file_type or 'jpg' in file_type:
                image = Image.open(io.BytesIO(api_response.content))
                return pytesseract.image_to_string(image)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

        text_content = extract_text(api_response, file_type)
        
        prompt = f"""Human: Analyze the following syllabus content and determine the distribution of the course workload.
    Provide your response in JSON format with the following categories, each scored out of 100 based on their weight in the syllabus:
    
    {{
    "homework": 0,
    "quizzes": 0,
    "tests": 0,
    "projects": 0,
    "exams": 0,
    "labs": 0
    }}
    
    If a category is not present in the syllabus, leave it as 0. 
    Associate similar terms with the closest category. For example:
    - "practical" or anything with "lab" in the name/description should be associated with "labs"
        - lab report, lab preparation, lab assignment etc.
    - "problem set" should be associated with "homework"
        - assignment, problem solving, problem set etc.
    - "midterm" should be associated with "exams"
        - final exam, midterm exam, etc.
    - "project" should be associated with "projects"
        - group project, individual project, project presentation, etc.
    - "test" should be associated with "tests"
        - term test, bi weekly test, etc.
    
    Ensure that the total of all categories does not exceed 100.
    
    Syllabus content:
    {text_content}  # Limiting to first 3000 characters for brevity
    
    Provide only the JSON response without any additional explanation.

Assistant: Here is the JSON response based on the syllabus content:

"""

        response = self.client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse the JSON response
        try:
            distribution = json.loads(response.content[0].text)
            
        except json.JSONDecodeError:
            raise ValueError("Failed to parse JSON from Anthropic API response")

        # Ensure all required keys are present
        required_keys = ["assignments", "quizzes", "tests", "projects", "exams", "labs"]
        for key in required_keys:
            if key not in distribution:
                distribution[key] = 0
        # Print the JSON in a readable format
        # print(json.dumps(distribution, indent=4))
        return distribution