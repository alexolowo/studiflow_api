import json
import anthropic

class AnthropicAPI():

    CLIENT = anthropic.Anthropic()
    MODEL = "claude-3-haiku-20240307"

    def format_response(self, response):
    # This method attempts to format the response if it's not in the expected format
        for content in response.content:
            if content.type == "text":
                text = content.text
                # Look for 'True' or 'False' in the text
                if "true" in text.lower():
                    return {"is_task_present": True}
                elif "false" in text.lower():
                    return {"is_task_present": False}
        
        print("Could not format response")
        return None

    def get_json_summary(self, response, name):
        if not response.content:
            return None
        
        for content in response.content:
            if content.type == "text":
                
                try:
                    json_str = content.text
                    start = json_str.find('{')
                    end = json_str.rfind('}') + 1
                    if start != -1 and end != -1:
                        json_str = json_str[start:end]
                    json_summary = json.loads(json_str)
                    return json_summary
                except json.JSONDecodeError:
                    print(f"Could not parse JSON from text: {content.text}")
            elif content.type == "tool_use" and content.name == name:
                json_summary = content.input['values']
                if isinstance(json_summary, str):
                    try:
                        return json.loads(json_summary)
                    except json.JSONDecodeError:
                        print(f"Invalid JSON in tool use: {json_summary}")
                elif isinstance(json_summary, dict):
                    print(f"using dict {json_summary}")
                    return json_summary
                else:
                    print(f"Unexpected type in tool use: {type(json_summary)}")
    
        return None

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
                    (i.e. assignment, quiz, test, labs, practicals, project, problem set, survey, reading, etc) \
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
        (i.e. assignment, quiz, test, labs, practicals, project, problem set, survey, reading, etc).
        2. Not containing a course task or similar.

        JSON:
        {json_str}

        use the module_task_analysis tool.

        Assistant: Here is the response based on the JSON provided:
        """

        # Make the API call
        response = self.get_api_message(prompt, tools)

        test = self.get_json_summary(response, "module_task_analysis")
        if test is None:
            print("Failed to parse JSON response")
            formatted_response = self.format_response(response)
            if formatted_response:
                test = formatted_response
            else:
                return False

        print(f"\nTesting Module {test}\n")
        
        return test.get('is_task_present', False) == True
    
    def analyze_module_item_for_task_prompt(self, json_str):
        tools = [
            {
                "name": "module_item_task_analysis",
                "description": "Analyze the module item of a course to determine if the item contains a task. \
                a task can be (i.e. assignment, quiz, test, labs, practicals, project, problem set, survey, reading, etc) \
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
                1. containing a course task that needs to be carried out by a student or similar 
                (i.e. assignment, quiz, test, labs, practicals, project, problem set, survey, reading, etc).
                2. Not containing a course task or similar.

                JSON:
                {json_str}

                Please respond with a JSON object in the following format:
                {{"is_task_present": true}} if a task is present, or 
                {{"is_task_present": false}} if no task is present.

                Use the module_item_task_analysis tool to provide your answer.
        """

        # Make the API call
        response = self.get_api_message(prompt, tools)
        
        test = self.get_json_summary(response, "module_item_task_analysis")
        if test is None:
            print("Failed to parse JSON response")
            # Try to format the response manually
            formatted_response = self.format_response(response)
            if formatted_response:
                test = formatted_response
            else:
                return False

        print(f"\nTesting Item {test}\n")
        
        return test.get('is_task_present', False) == True