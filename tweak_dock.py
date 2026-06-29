import os

path = r'c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\styles\dashboard.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make text smaller and tighter to fit all 7 icons
content = content.replace('font-size: 10px !important;', 'font-size: 9px !important;\n        letter-spacing: -0.03em !important;')

# Hide the nav-chevron on mobile dock
if '.mobile-dock .nav-chevron' not in content:
    content = content.replace('.mobile-dock .nav-description {', '.mobile-dock .nav-chevron,\n    .mobile-dock .nav-description {')

# Adjust padding and gap
content = content.replace('gap: 4px !important;', 'gap: 2px !important;')
content = content.replace('padding: 6px 0 !important;', 'padding: 4px 0 !important;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated mobile dock text styles and hid chevrons')
