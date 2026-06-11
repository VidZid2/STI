import os
import re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update text-zinc-950 bg-yellow-500 hover:bg-yellow-600 to text-white bg-violet-600 hover:bg-violet-700
    content = content.replace("text-zinc-950 bg-yellow-500", "text-white bg-violet-600")
    content = content.replace("hover:bg-yellow-600", "hover:bg-violet-700")

    # 2. General yellow -> violet, amber -> violet
    content = content.replace("yellow", "violet")
    content = content.replace("amber", "violet")
    
    # 3. Fix the specific RGB shadow: rgba(234, 179, 8, 0.35) -> rgba(124, 58, 237, 0.35) (violet-600 rgb)
    # Wait, ReferenceManager uses 234, 179, 8 (amber-500 / yellow-500). Let's replace:
    content = re.sub(r'rgba\(234,\s*179,\s*8,\s*([0-9.]+)\)', r'rgba(124, 58, 237, \1)', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

base_path = r"c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react"
files = [
    os.path.join(base_path, "src", "components", "tools", "ReferenceManager.tsx"),
    os.path.join(base_path, "src", "components", "tools", "CitationGenerator.tsx"),
    os.path.join(base_path, "src", "pages", "studentdashboard", "content", "ToolsContent", "ToolsContent.tsx")
]

for file in files:
    if os.path.exists(file):
        update_file(file)
    else:
        print(f"File not found: {file}")
