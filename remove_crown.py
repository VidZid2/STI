import os

files = [
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\components\ui\dropdowns\UserProfileDropdown.tsx",
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\CourseViewPage\components\StudentCard.tsx",
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\GroupsContent\components\GroupCard.tsx",
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\GroupsContent\modals\CreateGroupModal.tsx",
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\GroupsContent\modals\GroupDetailModal.tsx",
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\UsersContent\components\UserCard.tsx",
    r"C:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\UsersContent\modals\UserDetailModal.tsx"
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if "import" in line and "CrownBadge" in line:
            continue
        if "<CrownBadge />" in line:
            continue
        new_lines.append(line)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Updated {file_path}")
