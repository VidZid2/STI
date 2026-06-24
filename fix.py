import os

path = r'c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\styles\dashboard.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.mobile-dock [data-sidebar="sidebar"]-collapse-toggle', '.mobile-dock .sidebar-collapse-toggle')
content = content.replace('.mobile-dock [data-sidebar="sidebar"]-bottom', '.mobile-dock .sidebar-bottom')
content = content.replace('.mobile-dock [data-sidebar="sidebar"]-nav', '.mobile-dock .sidebar-nav')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed CSS selectors')
