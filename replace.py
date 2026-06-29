import os

path = r'c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\styles\dashboard.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace .sidebar-wrapper.mobile-dock .sidebar with .mobile-dock [data-sidebar="sidebar"]
content = content.replace('.sidebar-wrapper.mobile-dock .sidebar', '.mobile-dock [data-sidebar="sidebar"]')

# Replace remaining .sidebar-wrapper.mobile-dock with .mobile-dock
content = content.replace('.sidebar-wrapper.mobile-dock', '.mobile-dock')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced successfully')
