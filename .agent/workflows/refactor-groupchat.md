---
description: How to refactor GroupChatPage into smaller components
---

# GroupChatPage Refactoring Workflow

This workflow documents the safe process for extracting components from the large GroupChatPage.tsx file.

## Current Status

### Already Created Components (Ready to Use):

1. **ChatHeader.tsx** - Located at `src/pages/GroupChatPage/components/ChatHeader.tsx`
   - 366 lines extracted
   - Has all necessary props and functionality
   - Needs to replace lines 666-986 in GroupChatPage.tsx

2. **SearchPanel.tsx** - Located at `src/pages/GroupChatPage/components/SearchPanel.tsx`
   - ~260 lines
   - Has all necessary props and functionality
   - Needs to replace lines 988-1223 in GroupChatPage.tsx

### Components Index (Already Updated):
The `src/pages/GroupChatPage/components/index.ts` already exports both components.

## Step-by-Step Integration Process

### Step 1: Enable Imports
```tsx
// In GroupChatPage.tsx, update the import from './components'
import {
    // ... existing imports ...
    ChatHeader,     // <-- Uncomment this
    SearchPanel,    // <-- Uncomment this
} from './components';
```

### Step 2: Replace Header (lines 666-986)
Replace the entire block starting with:
```tsx
{/* Header - Fixed at top */}
<motion.header
```
And ending with:
```tsx
</motion.header>
```

With:
```tsx
{/* Header - Extracted component */}
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
/>
```

### Step 3: Replace Search Panel (lines ~990-1223)
Replace the entire block starting with:
```tsx
{/* Search Panel */}
<AnimatePresence>
    {showSearchPanel && (
```
And ending with:
```tsx
            </motion.div>
        )}
    </AnimatePresence>
```

With:
```tsx
{/* Search Panel - Extracted Component */}
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
/>
```

### Step 4: Remove Unused Imports
After replacement, check for any unused imports in GroupChatPage.tsx:
- `calculateLevel` - now used in ChatHeader
- `xpToNextLevel` - now used in ChatHeader
- `useNavigate` (for header) - now in ChatHeader

### Step 5: Verify Build
```bash
npm run build
```

### Step 6: Test the Application
Run the dev server and verify:
1. Header displays correctly with all buttons
2. Search panel opens/closes properly
3. Search functionality works
4. Navigation buttons work

## Future Components to Extract

After these are working, consider extracting:

1. **MessageBubble.tsx** - The message rendering logic (lines ~1700-3300)
   - This is the largest extraction (~1600 lines)
   - Will significantly reduce file size

2. **ChatInputArea.tsx** - The bottom input section (lines ~3500-4150)
   - ~650 lines
   - Contains file attachments, emoji picker, send button

3. **TypingIndicator.tsx** - Small typing indicator component

4. **FocusModeModal.tsx** - The focus mode modal section

## Important Notes

- Always run `npm run build` after each extraction
- Keep a git commit after each successful extraction
- Test the feature after each extraction before proceeding
- The extracted components are in `src/pages/GroupChatPage/components/`
