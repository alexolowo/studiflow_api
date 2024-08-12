import io
import json
from PyPDF2 import PdfReader
from docx import Document
from PIL import Image
import pytesseract
import anthropic
import json

class AnthropicAPI():

    CLIENT = anthropic.Anthropic()
    MODEL = "claude-3-sonnet-20240229"

    def get_json_summary(self, response, name):
        json_summary = None
        for content in response.content:
            if content.type == "tool_use" and content.name == name:
                json_summary = content.input['values']

                if type(json_summary)!= dict:
                    json_summary = json.loads(json_summary)
                break
        
        
        
        # return json.dumps(json_summary, indent=2)
        return json_summary
    
    def get_api_message(self, prompt, tools):
        response = self.CLIENT.messages.create(
            model=self.MODEL,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
            tools=tools
        )
        return response

    def analyze_module_for_syllabus_prompt(self, json_str):
        tools = [
            {
                "name": "module_syllabus_analysis",
                "description": "Analyze the module of a course to determine if the syllabus is present in one of the items. \
                    ensure that the JSON key is wrapped in double quotes",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "is_syllabus_present": {
                            "type": "object", 
                            "description": "'True' if the syllabus is present, 'False' otherwise"
                            },
                        }
                    },
                    "required": ['values']
                }
            }
        ]

        prompt = f"""Given this JSON representing a course module, classify it as either:
        1. A syllabus, course overview material, course information, or similar.
        2. Not a syllabus, course overview material, course information, or similar.

        JSON:
        {json_str}

        use the module_syllabus_analysis tool.

        Assistant: Here is the response based on the JSON provided:
        """

        # Make the API call
        response = self.get_api_message(prompt, tools)
        
        
        
        return self.get_json_summary(response, "module_syllabus_analysis")['is_syllabus_present']==True 
    
    def analyze_module_item_for_syllabus_prompt(self, json_str):
        tools = [
            {
                "name": "module_item_syllabus_analysis",
                "description": "Analyze the module item of a course to determine if the syllabus is present in the item \
                    ensure that the JSON key is wrapped in double quotes",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "is_syllabus_present": {
                            "type": "object", 
                            "description": "'True' if the syllabus is present, 'False' otherwise"
                            },
                        }
                    },
                    "required": ['values']
                }
            }
        ]

        prompt = f"""Given this JSON representing a course module, classify it as either:
        1. A syllabus, course overview material, course information, or similar.
        2. Not a syllabus, course overview material, course information, or similar.

        JSON:
        {json_str}

        use the module_syllabus_analysis tool.

        Assistant: Here is the response based on the JSON provided:
        """

        # Make the API call
        response = self.get_api_message(prompt, tools)
        
        return self.get_json_summary(response, "module_item_syllabus_analysis")['is_syllabus_present']==True

    def is_module_task_prompt(self, json_str):
        prompt = f"""Given this JSON representing a course module item, classify it as either:
        1. A task or material that strongly suggests the existence of a task.
        2. Not a task or does not strongly suggest the existence of a task.

        JSON:
        {json_str}

        Please provide your classification as only True or False. Nothing else."""

        # Make the API call
        response = self.CLIENT.completions.create(
            model=self.MODEL,
            prompt=prompt,
            max_tokens_to_sample=300,
        )
        response_data = response.completion
        
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
            elif 'txt' in file_type or 'text' in file_type or 'html' in file_type or 'json' in file_type or 'csv' in file_type:
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
    "homework/assignments": 0,
    "quizzes": 0,
    "tests": 0,
    "projects": 0,
    "exams": 0,
    "labs": 0
    "other": {{"weight": 0, "description": "Other course components not covered by the above categories"}}
    }}
    
    If a category is not present in the syllabus, leave it as 0 and exclude it from the response. 
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

        response = self.get_api_message(prompt, [])

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
        
        
        return distribution
    
    
    def is_syllabus_in_front_page(self, json_str):
        tools = [
            {
                "name": "front_page_analysis",
                "description": "Analyze the front page of a course to determine if the syllabus is present, \
                    and if it is, provide the URL of the syllabus. Ensure that the JSON key is wrapped in double quotes",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "is_syllabus_present": {
                            "type": "object", 
                            "description": "'True' if the syllabus is present, 'False' otherwise"
                            },
                            "url": {
                                "type": "string", 
                                "description": 'URL of the syllabus if present, otherwise "N/A"'
                            },
                        }
                    },
                    "required": ['values']
                }
            }
        ]
        prompt = f"""
        Human:Given this JSON representing a course front page, determine if the syllabus is contained in the body
        of the page.
        
        JSON:
        {json_str}

        use the front_page_analysis tool.

        Assistant: Here is the response based on the JSON provided:
        """

        response = self.get_api_message(prompt, tools)

        

        return self.get_json_summary(response, "front_page_analysis")
    

    def is_syllabus_a_link(self, api_response):
        tools = [
            {
                "name": "syllabus_link_analysis",
                "description": "Analyze the html of a page to see if the syllabus is present and \
                    if it is a link, attach the base url of 'https://utoronto.instructure.com' if needed \
                        also make the link downloadable. here is an example of the link to return: \
                            https://utoronto.instructure.com/courses/202970/files/12385133/download?download_frd=1&verifier=bZ7USxFuecyf3f15bp4aSgG8KiVzaNEqlrXUb0IR \
                                ensure that the JSON key is wrapped in double quotes",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "is_syllabus_present": {
                            "type": "object", 
                            "description": "'True' if the syllabus is present, 'False' otherwise"
                            },
                            "url": {
                                "type": "string", 
                                "description": 'URL of the syllabus if present, otherwise "N/A"'
                            },
                        }
                    },
                    "required": ['values']
                }
            }
        ]
        prompt = f"""Human: Given this HTML response from the API, determine if the syllabus is a link.
        
        HTML Response:
        {api_response}
        
        use the syllabus_link_analysis tool.
        
        Assistant: Here is the response based on the HTML provided:
        """

        response = self.get_api_message(prompt, tools)

        

        return self.get_json_summary(response, "syllabus_link_analysis")
