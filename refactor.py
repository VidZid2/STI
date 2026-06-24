import re

with open('src/pages/studentdashboard/content/GroupsContent/modals/InviteModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start and end of the block we want to replace
start_marker = r"{/\*\s*Shareable Link Section\s*\*/}"
end_marker = r"                                </AnimatePresence>\s*</div>\s*</motion\.div>"

# We can find these by splitting
parts = re.split(start_marker, content, maxsplit=1)
if len(parts) != 2:
    print('Failed to find start marker')
    exit(1)

pre_content = parts[0]
rest_content = parts[1]

parts2 = re.split(end_marker, rest_content, maxsplit=1)
if len(parts2) != 2:
    print('Failed to find end marker')
    exit(1)

middle_content = parts2[0]
post_content = end_marker + parts2[1]

# Now we construct the new middle content
header_footer_code = '''
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={lex items-center gap-2 text-[11.5px] font-bold tracking-wider uppercase }>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        Shareable Invite Link
                                                    </div>
                                                    <span className={px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider }>
                                                        Optional
                                                    </span>
                                                </div>
'''

footer_code = '''
                                                <p className={mt-3 text-[12.5px] leading-relaxed }>
                                                    Share this link with classmates to let them join your group.
                                                </p>
'''

# Extract the generate button block
gen_btn_match = re.search(r'(<motion\.button\s*key="generate".*?</motion\.button>)', middle_content, re.DOTALL)
if gen_btn_match:
    generate_btn_code = gen_btn_match.group(1).replace('key="generate"', '').replace('layout\\n', '').replace('''initial={{ opacity: 0, rotateX: 20, scale: 0.95, y: 8, filter: 'blur(4px)' }}\\n                                                animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0, filter: 'blur(0px)' }}\\n                                                exit={{ opacity: 0, rotateX: -20, scale: 0.95, y: -8, filter: 'blur(4px)' }}\\n                                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}''', '')
else:
    generate_btn_code = 'GENERATE BUTTON NOT FOUND'

# Extract the QR block
qr_block_match = re.search(r'(<motion\.div\s*key="link".*?</motion\.div>\\s*</motion\.div>)', middle_content, re.DOTALL)
if qr_block_match:
    qr_block_code = qr_block_match.group(1).replace('key="link"', '').replace('layout\\n', '').replace('''initial={{ opacity: 0, rotateX: 20, scale: 0.95, y: 8, filter: 'blur(4px)' }}\\n                                                animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0, filter: 'blur(0px)' }}\\n                                                exit={{ opacity: 0, rotateX: -20, scale: 0.95, y: -8, filter: 'blur(4px)' }}\\n                                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}''', '')
else:
    # try slightly different regex
    qr_block_match = re.search(r'(<motion\.div\\s+key="link".*?</div>\\s*</motion\.div>)', middle_content, re.DOTALL)
    if qr_block_match:
        qr_block_code = qr_block_match.group(1).replace('key="link"', '').replace('layout\\n', '')
    else:
        # manual extraction for qr block since regex is fragile on nested tags
        pass

# Actually, rather than writing a regex script that might fail on nested JSX, I will use a simple multi_replace_file_content!
