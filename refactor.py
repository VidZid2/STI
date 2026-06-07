import os
import re

def refactor_student_card():
    file_path = r"c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\CourseViewPage\components\StudentCard.tsx"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'whileHover=\{\{ y: -3, scale: 1\.01 \}\}', '', content)
    content = re.sub(r'className="group relative flex flex-col', 'className="group relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01]', content)

    content = re.sub(r'whileHover=\{\{ scale: 1\.1 \}\}\s*whileTap=\{\{ scale: 0\.95 \}\}', '', content)
    content = re.sub(r'className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600', 'className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 transition-transform duration-200 hover:scale-110 active:scale-95', content)
    content = re.sub(r'className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 text-zinc-600', 'className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 text-zinc-600 transition-transform duration-200 hover:scale-110 active:scale-95', content)

    content = re.sub(r'whileHover=\{\{ scale: 1\.05 \}\}\s*transition=\{\{ type: \'spring\', stiffness: 400, damping: 15 \}\}', '', content)
    content = re.sub(r'className="relative mb-3"', 'className="relative mb-3 transition-transform duration-200 hover:scale-105"', content)

    content = re.sub(r'whileHover=\{\{ scale: 1\.05 \}\}', '', content)
    content = re.sub(r'className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline"', 'className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline transition-transform duration-200 hover:scale-105"', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done StudentCard')

def refactor_task_card():
    file_path = r"c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\CourseViewPage\components\TaskCard.tsx"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Dropdown items
    content = re.sub(r'whileHover=\{\{ scale: 1\.02 \}\}\n\s*whileTap=\{\{ scale: 0\.98 \}\}', '', content)
    content = re.sub(r'whileHover=\{\{ scale: 1\.02 \}\}\s*whileTap=\{\{ scale: 0\.98 \}\}', '', content)
    content = re.sub(r'className="w-full text-left px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-300', 'className="w-full text-left px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-300 transition-transform duration-200 hover:scale-[1.02] active:scale-98', content)
    
    # Task Card Container hover
    content = re.sub(r'whileHover=\{!isLocked \? \{ y: -2, scale: 1\.01, transition: \{ duration: 0\.12, ease: \'easeOut\' \} \} : undefined\}', '', content)
    content = re.sub(r'whileTap=\{!isLocked \? \{ scale: 0\.99, transition: \{ duration: 0\.08 \} \} : undefined\}', '', content)
    content = re.sub(r'className={`relative flex flex-col p-4', 'className={`relative flex flex-col p-4 transition-all duration-150 ${!isLocked ? \'hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]\' : \'\'}', content)

    # Info Button
    content = re.sub(r'whileHover=\{!isLocked \? \{ scale: 1\.05, rotate: -5 \} : \{\}\}', '', content)
    content = re.sub(r'className={`w-10 h-10', 'className={`w-10 h-10 transition-transform duration-200 ${!isLocked ? \'hover:scale-105 hover:-rotate-3\' : \'\'}', content)

    # Main Action Button
    content = re.sub(r'whileHover=\{!isLocked \? \{ scale: 1\.08, y: -1 \} : \{\}\}', '', content)
    content = re.sub(r'whileTap=\{!isLocked \? \{ scale: 0\.95 \} : \{\}\}', '', content)
    content = re.sub(r'className={`w-12 h-12', 'className={`w-12 h-12 transition-transform duration-200 ${!isLocked ? \'hover:scale-110 hover:-translate-y-0.5 active:scale-95\' : \'\'}', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done TaskCard')

def refactor_module_card():
    file_path = r"c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\CourseViewPage\components\ModuleCard.tsx"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Dropdown items
    content = re.sub(r'whileHover=\{\{ scale: 1\.02 \}\}\n\s*whileTap=\{\{ scale: 0\.98 \}\}', '', content)
    
    # Module Card Container Hover
    content = re.sub(r'whileHover=\{currentStatus !== \'locked\' \? \{ y: -2, scale: 1\.01, transition: \{ duration: 0\.12, ease: \'easeOut\' \} \} : undefined\}', '', content)
    content = re.sub(r'whileTap=\{currentStatus !== \'locked\' \? \{ scale: 0\.99, transition: \{ duration: 0\.08 \} \} : undefined\}', '', content)
    content = re.sub(r'className={`relative flex flex-col p-4 rounded-2xl', 'className={`relative flex flex-col p-4 rounded-2xl transition-all duration-150 ${currentStatus !== \'locked\' ? \'hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]\' : \'\'}', content)

    # Download Button
    content = re.sub(r'whileHover=\{currentStatus !== \'locked\' \? \{ scale: 1\.1 \} : \{\}\}', '', content)
    content = re.sub(r'whileTap=\{currentStatus !== \'locked\' \? \{ scale: 0\.9 \} : \{\}\}', '', content)
    content = re.sub(r'className="p-1\.5 rounded-md', 'className={`p-1.5 rounded-md transition-transform duration-200 ${currentStatus !== \'locked\' ? \'hover:scale-110 active:scale-90\' : \'\'}`', content)

    # Main Play Button
    content = re.sub(r'whileHover=\{currentStatus !== \'locked\' && !isDownloading \? \{ scale: 1\.08, y: -1 \} : \{\}\}', '', content)
    content = re.sub(r'whileTap=\{currentStatus !== \'locked\' && !isDownloading \? \{ scale: 0\.95 \} : \{\}\}', '', content)
    content = re.sub(r'className={`w-12 h-12', 'className={`w-12 h-12 transition-transform duration-200 ${currentStatus !== \'locked\' && !isDownloading ? \'hover:scale-110 hover:-translate-y-0.5 active:scale-95\' : \'\'}', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done ModuleCard')

if __name__ == '__main__':
    refactor_student_card()
    refactor_task_card()
    refactor_module_card()
