/**
 * Migration Script: Refactor GroupChatPage.tsx
 * This script extracts the header and search panel sections and replaces them with component calls.
 * It also adds the new component imports.
 * 
 * NOTE: This script does NOT remove any existing imports - they are all still used.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/pages/GroupChatPage/GroupChatPage.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`Original file has ${lines.length} lines`);

// Find key markers
const headerStartLine = lines.findIndex(line => line.includes('{/* Header - Fixed at top */}'));
const headerEndLine = lines.findIndex(line => line.includes('</motion.header>'));

// Find search panel markers
const searchPanelStartLine = lines.findIndex(line => line.includes('{/* Search Panel */}'));
let searchPanelEndLine = -1;

// Find the closing </AnimatePresence> for the search panel (it's the one right before Focus Mode Modal)
for (let i = searchPanelStartLine; i < lines.length; i++) {
    if (lines[i].includes('{/* Focus Mode Modal')) {
        // The </AnimatePresence> should be a few lines before this
        for (let j = i - 1; j >= searchPanelStartLine; j--) {
            if (lines[j].includes('</AnimatePresence>')) {
                searchPanelEndLine = j;
                break;
            }
        }
        break;
    }
}

console.log('Found markers:');
console.log(`  Header start: line ${headerStartLine + 1}`);
console.log(`  Header end (</motion.header>): line ${headerEndLine + 1}`);
console.log(`  Search Panel start: line ${searchPanelStartLine + 1}`);
console.log(`  Search Panel end (</AnimatePresence>): line ${searchPanelEndLine + 1}`);

if (headerStartLine === -1 || headerEndLine === -1 || searchPanelStartLine === -1 || searchPanelEndLine === -1) {
    console.error('ERROR: Could not find all markers!');
    process.exit(1);
}

// New ChatHeader component call
const chatHeaderComponent = `            {/* Header - Extracted Component */}
            <ChatHeader
                groupInfo={groupInfo}
                groupId={groupId}
                userXP={userXP}
                userStreak={userStreak}
                isDarkMode={isDarkMode}
                colors={colors}
                showSearchPanel={showSearchPanel}
                onSearchToggle={() => {
                    setShowSearchPanel(!showSearchPanel);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                onLeaderboardOpen={() => setShowLeaderboard(true)}
                onGroupInfoOpen={() => setShowGroupInfo(true)}
            />`;

// New SearchPanel component call
const searchPanelComponent = `            {/* Search Panel - Extracted Component */}
            <SearchPanel
                showSearchPanel={showSearchPanel}
                searchQuery={searchQuery}
                searchResults={searchResults}
                searchInputRef={searchInputRef}
                isDarkMode={isDarkMode}
                colors={colors}
                onSearch={handleSearch}
                onClose={() => {
                    setShowSearchPanel(false);
                    setSearchQuery('');
                    setSearchResults([]);
                }}
                onClearSearch={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                }}
                onJumpToMessage={handleJumpToMessage}
            />`;

// Build the new file content
const newLines = [];

// Add everything before header
for (let i = 0; i < headerStartLine; i++) {
    newLines.push(lines[i]);
}

// Add ChatHeader component
newLines.push(...chatHeaderComponent.split('\n'));
newLines.push('');

// Skip the inline header (from headerStartLine to headerEndLine inclusive)
// Add everything between header end and search panel start
for (let i = headerEndLine + 1; i < searchPanelStartLine; i++) {
    // Skip empty lines right after header
    if (lines[i].trim() === '' && i === headerEndLine + 1) continue;
    if (lines[i].trim() === '' && i === headerEndLine + 2) continue;
    newLines.push(lines[i]);
}

// Add SearchPanel component
newLines.push(...searchPanelComponent.split('\n'));
newLines.push('');

// Skip the inline search panel (from searchPanelStartLine to searchPanelEndLine inclusive)
// Add everything after search panel
for (let i = searchPanelEndLine + 1; i < lines.length; i++) {
    newLines.push(lines[i]);
}

// Convert back to string
let newContent = newLines.join('\n');

// Add ChatHeader and SearchPanel to the components import
// Find the exact pattern and add imports
newContent = newContent.replace(
    "    type MentionUser,\r\n} from './components';",
    "    type MentionUser,\r\n    ChatHeader,\r\n    SearchPanel,\r\n} from './components';"
);

// Also try the Unix line ending version
newContent = newContent.replace(
    "    type MentionUser,\n} from './components';",
    "    type MentionUser,\n    ChatHeader,\n    SearchPanel,\n} from './components';"
);

// Recalculate lines
const finalLines = newContent.split('\n');

console.log(`\nNew file has ${finalLines.length} lines`);
console.log(`Reduced by ${lines.length - finalLines.length} lines`);

// Write the new file
fs.writeFileSync(filePath, newContent, 'utf-8');
console.log('\n✅ File updated successfully!');
console.log('Run "npm run build" to verify the changes.');
