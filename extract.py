import re

with open('src/pages/studentdashboard/content/GroupsContent/modals/InviteModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('                            {/* Content */}')
end_idx = content.find('                        </motion.div>\n                    </div>\n                </>\n            )}\n        </AnimatePresence>')

if start_idx == -1 or end_idx == -1:
    print('Indices not found')
    exit(1)

with open('old_content.txt', 'w', encoding='utf-8') as f:
    f.write(content[start_idx:end_idx])
