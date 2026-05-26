import os
import re

base_dir = r"c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\Test it here"

# Load the exact HTML files
with open(os.path.join(base_dir, "1_email.html"), "r", encoding="utf-8") as f:
    email_html = f.read()

with open(os.path.join(base_dir, "2_options.html"), "r", encoding="utf-8") as f:
    options_html = f.read()

# Tag balanced parser to extract full div containers without premature truncation on comment lines
def extract_div_by_attrib(html_content, attrib_name, attrib_value):
    start_tag = f'{attrib_name}="{attrib_value}"'
    idx = html_content.find(start_tag)
    if idx == -1:
        return None
    
    # Find opening '<div' before this attribute
    start_idx = html_content.rfind('<div', 0, idx)
    
    # Count div balance
    balance = 0
    pos = start_idx
    while pos < len(html_content):
        if html_content[pos:pos+4] == '<div':
            balance += 1
            pos += 4
        elif html_content[pos:pos+6] == '</div>':
            balance -= 1
            pos += 6
            if balance == 0:
                return html_content[start_idx:pos]
        else:
            pos += 1
    return None

def extract_div_by_selector(html_content, class_name):
    idx = html_content.find(class_name)
    if idx == -1:
        return None, None
    
    start_idx = html_content.rfind('<div', 0, idx)
    balance = 0
    pos = start_idx
    while pos < len(html_content):
        if html_content[pos:pos+4] == '<div':
            balance += 1
            pos += 4
        elif html_content[pos:pos+6] == '</div>':
            balance -= 1
            pos += 6
            if balance == 0:
                return start_idx, pos
        else:
            pos += 1
    return None, None

# Extract Username View (data-viewid="1")
view1_original = extract_div_by_attrib(email_html, 'data-viewid', '1')
# Extract Credential Picker View (data-viewid="24")
view24_original = extract_div_by_attrib(options_html, 'data-viewid', '24')

# Locate pagination-view container boundaries in 1_email.html
pag_start, pag_end = extract_div_by_selector(email_html, 'class="pagination-view')

if pag_start and pag_end and view1_original and view24_original:
    # Build transition views
    # Ensure optionsView starts hidden
    merged_pagination_content = f"""<div class="pagination-view animate" id="paginationView" style="position: relative; overflow: visible; height: 100%;">
        <!-- Wrapper for Email View to allow transitions -->
        <div id="emailViewWrapper" style="width: 100%; height: 100%; transition: transform 0.25s ease, opacity 0.25s ease;">
            {view1_original}
        </div>
        
        <!-- Wrapper for Options View to allow transitions -->
        <div id="optionsViewWrapper" style="width: 100%; height: 100%; display: none; transition: transform 0.25s ease, opacity 0.25s ease;">
            {view24_original}
        </div>
    </div>"""
    
    # Replace the entire pagination view container in email_html
    email_html = email_html[:pag_start] + merged_pagination_content + email_html[pag_end:]

# Link 1_email.css for full offline stylesheet overrides
if "1_email.css" not in email_html:
    email_html = email_html.replace("</head>", '<link rel="stylesheet" href="1_email.css">\n</head>')

# JavaScript transition controller
js_code = """
<script>
document.addEventListener("DOMContentLoaded", function() {
    console.log("Interactive replica prototype ready!");
    
    const emailView = document.getElementById("emailViewWrapper");
    const optionsView = document.getElementById("optionsViewWrapper");
    
    // Find the Sign-in options tile button inside the bottom promoted box
    const signinOptionsBtn = document.querySelector('[data-test-id="signinOptions"]');
    const signinOptionsWrapper = document.querySelector('.promoted-fed-cred-box') || document.querySelector('.promoted-fed-cred-content');
    
    // Find the Back button in the options view (idBtn_Back)
    const backBtn = document.getElementById("idBtn_Back");
    
    // Block "Next" button form submission and redirect behavior
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            console.log("Form submission blocked safely.");
        });
    }
    
    const nextBtn = document.getElementById("idSIButton9");
    if (nextBtn) {
        nextBtn.addEventListener("click", function(e) {
            e.preventDefault();
            console.log("Next button navigation blocked safely.");
        });
    }
    
    // Block "Can't access your account?" link navigation
    const cantAccessLink = document.getElementById("cantAccessAccount");
    if (cantAccessLink) {
        cantAccessLink.setAttribute("href", "#");
        cantAccessLink.addEventListener("click", function(e) {
            e.preventDefault();
            console.log("Can't access account navigation blocked safely.");
        });
    }
    
    if (signinOptionsBtn) {
        const btnParent = signinOptionsBtn.closest('.table') || signinOptionsBtn;
        btnParent.style.cursor = "pointer";
        btnParent.addEventListener("click", function(e) {
            e.preventDefault();
            switchToOptions();
        });
    }
    
    if (backBtn) {
        backBtn.style.cursor = "pointer";
        backBtn.addEventListener("click", function(e) {
            e.preventDefault();
            switchToEmail();
        });
    }
    
    function switchToOptions() {
        console.log("Switching to Options View...");
        
        // 1. Slide Out Email View to Left
        emailView.style.transform = "translateX(-100%)";
        emailView.style.opacity = "0";
        
        // Hide sign-in options box at the bottom
        if (signinOptionsWrapper) {
            signinOptionsWrapper.style.transition = "opacity 0.2s ease";
            signinOptionsWrapper.style.opacity = "0";
            setTimeout(() => {
                signinOptionsWrapper.style.display = "none";
            }, 200);
        }
        
        setTimeout(() => {
            emailView.style.display = "none";
            
            // 2. Slide In Options View from Right
            optionsView.style.display = "block";
            optionsView.style.transform = "translateX(100%)";
            optionsView.style.opacity = "0";
            
            // Force reflow
            optionsView.offsetHeight;
            
            optionsView.style.transform = "translateX(0)";
            optionsView.style.opacity = "1";
        }, 200);
    }
    
    function switchToEmail() {
        console.log("Switching back to Email View...");
        
        // 1. Slide Out Options View to Right
        optionsView.style.transform = "translateX(100%)";
        optionsView.style.opacity = "0";
        
        setTimeout(() => {
            optionsView.style.display = "none";
            
            // 2. Slide In Email View from Left
            emailView.style.display = "block";
            emailView.style.transform = "translateX(-100%)";
            emailView.style.opacity = "0";
            
            // Force reflow
            emailView.offsetHeight;
            
            emailView.style.transform = "translateX(0)";
            emailView.style.opacity = "1";
            
            // Show sign-in options box at the bottom again
            if (signinOptionsWrapper) {
                signinOptionsWrapper.style.display = "block";
                signinOptionsWrapper.offsetHeight;
                signinOptionsWrapper.style.opacity = "1";
            }
        }, 200);
    }
});
</script>
</body></html>
"""

# Replace </body></html> with the javascript injected version
final_html = email_html.replace("</body></html>", js_code)

# Write the exact merged file out
with open(os.path.join(base_dir, "prototype.html"), "w", encoding="utf-8") as out_f:
    out_f.write(final_html)

print("Saved pixel-perfect replica prototype.html!")
