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
    MODEL = "claude-3-haiku-20240307"

    def get_json_summary(self, response, name):
        if not response.content:
            return None
        json_summary = None
        for content in response.content:
            if content.type == "tool_use" and content.name == name:
                json_summary = content.input['values']

                if type(json_summary)!= dict:
                    json_summary = json.loads(json_summary)
                break
        return json_summary

    def get_api_message(self, prompt, tools):
        response = self.CLIENT.messages.create(
            model=self.MODEL,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
            tools=tools
        )
        return response


    def analyze_module_for_task_prompt(self, json_str):
        tools = [
            {
                "name": "module_task_analysis",
                "description": "Analyze the module of a course to determine if a course task \
                    (i.e. assignment, quiz, test, project, problem set, survey, reading, etc) \
                      is present in one of the items. ensure that the JSON key is wrapped in double quotes.\
                        Do not return anything other than specified in the prompt.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "is_task_present": {
                            "type": "object", 
                            "description": "'True' if a task is present, 'False' otherwise"
                            },
                        }
                    },
                    "required": ['values']
                }
            }
        ]

        prompt = f"""Given this JSON representing a course module, classify it as either:
        1. containing a course task that needs to be carried out by a student or similar.\
        (i.e. assignment, quiz, test, project, problem set, survey, reading, etc).
        2. Not containing a course task or similar.

        JSON:
        {json_str}

        use the module_task_analysis tool.

        Assistant: Here is the response based on the JSON provided:
        """

        # Make the API call
        response = self.get_api_message(prompt, tools)
        test = self.get_json_summary(response, "module_task_analysis")
        print(f"Testing Module {test}")
        
        
        return test['is_task_present']==True 
    
    def analyze_module_item_for_task_prompt(self, json_str):
        tools = [
            {
                "name": "module_item_task_analysis",
                "description": "Analyze the module item of a course to determine if the item contains a task. \
                a task can be (i.e. assignment, quiz, test, project, problem set, survey, reading, etc) \
                ensure that the JSON key is wrapped in double quotes return. Do not return anything other than specified",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "values": {
                            "is_task_present": {
                            "type": "object", 
                            "description": "'True' if the task is present, 'False' otherwise"
                            },
                        }
                    },
                    "required": ['values']
                }
            }
        ]

        prompt = f"""Given this JSON representing a course module, classify it as either:
        1. containing a course task that needs to be carried out by a student or similar.\
        (i.e. assignment, quiz, test, project, problem set, survey, reading, etc). Return 'True' if the task is present, 'False' otherwise.
        2. Not containing a course task or similar.

        JSON:
        {json_str}

        use the module_item_task_analysis tool.

        Assistant: Here is the response based on the JSON provided:
        """

        # Make the API call
        response = self.get_api_message(prompt, tools)
        test = self.get_json_summary(response, "module_item_task_analysis")
        print(f"Testing {test}")
        
        return test['is_task_present']==True