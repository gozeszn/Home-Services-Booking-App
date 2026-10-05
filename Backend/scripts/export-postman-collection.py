import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    print("PyYAML is not installed.")
    print("Run: py -m pip install pyyaml")
    sys.exit(1)


# ============================================================
# PATHS
# ============================================================

SOURCE = r"C:\Users\Dell\Desktop\ToDoList\postman\collections\Home Service APP"

OUTPUT = r"C:\Users\Dell\Desktop\HomeServices APP\postman\Home Service APP.postman_collection.json"


# ============================================================
# HELPERS
# ============================================================

def read_yaml(path):
    with open(path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def convert_body(body):
    if not body:
        return None

    body_type = body.get("type")

    if body_type == "json":
        content = body.get("content", "")

        return {
            "mode": "raw",
            "raw": content,
            "options": {
                "raw": {
                    "language": "json"
                }
            }
        }

    if body_type == "text":
        return {
            "mode": "raw",
            "raw": body.get("content", "")
        }

    return {
        "mode": "raw",
        "raw": body.get("content", "")
    }


def convert_auth(auth):
    if not auth:
        return None

    auth_type = auth.get("type")

    if auth_type == "bearer":
        credentials = auth.get("credentials", {})

        return {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": credentials.get("token", ""),
                    "type": "string"
                }
            ]
        }

    return None


def convert_script(scripts):
    events = []

    if not scripts:
        return events

    for script in scripts:
        script_type = script.get("type")

        if script_type == "afterResponse":
            listen = "test"
        elif script_type == "beforeRequest":
            listen = "prerequest"
        else:
            continue

        code = script.get("code", "")

        events.append({
            "listen": listen,
            "script": {
                "type": "text/javascript",
                "exec": code.splitlines()
            }
        })

    return events


def convert_request(path):
    data = read_yaml(path)

    request_name = os.path.basename(path).replace(".request.yaml", "")

    request = {
        "name": request_name,
        "request": {
            "method": data.get("method", "GET"),
            "header": [],
            "url": data.get("url", "")
        }
    }

    # Body
    body = convert_body(data.get("body"))

    if body:
        request["request"]["body"] = body

    # Auth
    auth = convert_auth(data.get("auth"))

    if auth:
        request["request"]["auth"] = auth

    # Headers
    headers = data.get("headers") or data.get("header")

    if isinstance(headers, list):
        for header in headers:
            if isinstance(header, dict):
                request["request"]["header"].append({
                    "key": header.get("key", ""),
                    "value": header.get("value", ""),
                    "type": "text"
                })

    # Scripts
    events = convert_script(data.get("scripts"))

    if events:
        request["event"] = events

    return request


def build_folder(folder_path):
    folder_name = os.path.basename(folder_path)

    folder = {
        "name": folder_name,
        "item": []
    }

    try:
        entries = sorted(os.listdir(folder_path))
    except OSError:
        return folder

    for entry in entries:
        full_path = os.path.join(folder_path, entry)

        if os.path.isdir(full_path):
            if entry == ".resources":
                continue

            folder["item"].append(build_folder(full_path))

        elif entry.endswith(".request.yaml"):
            folder["item"].append(convert_request(full_path))

    return folder


# ============================================================
# READ COLLECTION DEFINITION
# ============================================================

definition_path = os.path.join(
    SOURCE,
    ".resources",
    "definition.yaml"
)

definition = read_yaml(definition_path)

description = definition.get("description", "")

variables = []

for key, value in (definition.get("variables") or {}).items():
    variables.append({
        "key": key,
        "value": value if value is not None else ""
    })


# ============================================================
# BUILD COLLECTION
# ============================================================

collection = {
    "info": {
        "_postman_id": "home-services-booking-app",
        "name": "Home Service APP",
        "description": description,
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [],
    "variable": variables
}


# ============================================================
# ADD FOLDERS
# ============================================================

for entry in sorted(os.listdir(SOURCE)):
    folder_path = os.path.join(SOURCE, entry)

    if not os.path.isdir(folder_path):
        continue

    if entry == ".resources":
        continue

    collection["item"].append(build_folder(folder_path))


# ============================================================
# SAFELY REMOVE LOGIN CREDENTIALS
# ============================================================

def sanitize_login(item):
    if isinstance(item, dict):

        if item.get("name") == "LoginUser":
            body = item.get("request", {}).get("body", {})

            if body.get("mode") == "raw":
                try:
                    parsed = json.loads(body["raw"])

                    if "email" in parsed:
                        parsed["email"] = "{{loginEmail}}"

                    if "password" in parsed:
                        parsed["password"] = "{{loginPassword}}"

                    body["raw"] = json.dumps(
                        parsed,
                        indent=2
                    )

                except Exception:
                    pass

        for value in item.values():
            sanitize_login(value)

    elif isinstance(item, list):
        for value in item:
            sanitize_login(value)


sanitize_login(collection)


# Add safe variables for LoginUser
collection["variable"].extend([
    {
        "key": "loginEmail",
        "value": ""
    },
    {
        "key": "loginPassword",
        "value": ""
    }
])


# ============================================================
# WRITE OUTPUT
# ============================================================

output_directory = os.path.dirname(OUTPUT)

os.makedirs(output_directory, exist_ok=True)

with open(OUTPUT, "w", encoding="utf-8") as file:
    json.dump(
        collection,
        file,
        indent=2,
        ensure_ascii=False
    )

print()
print("==============================================")
print("Postman collection exported successfully!")
print("==============================================")
print()
print(f"Output:")
print(OUTPUT)
print()
print(f"Folders: {len(collection['item'])}")
print(f"Variables: {len(collection['variable'])}")