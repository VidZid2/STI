import os
import re

filepath = r"c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\components\tools\ReferenceManager.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Filter out lines that contain the blur-3xl background accent
new_lines = []
for line in lines:
    if "blur-3xl pointer-events-none transition-transform" in line and "bg-violet" in line:
        continue
    # Also remove the `{/* SaaS Background Accents */}` comment right before it
    if "{/* SaaS Background Accents */}" in line:
        continue
    new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Removed blur gradients from ReferenceManager.tsx")
