# Design Document: AI-Powered Grading

## Overview
This feature adds AI-powered auto-grading to the Grade Submissions Modal using the existing GROQ API infrastructure. The AI analyzes student submissions and suggests scores, generates personalized feedback, and identifies outliers.

## Architecture

### Service Layer
```
src/lib/grading/
├── types.ts           # TypeScript interfaces
├── aiGradingService.ts # Core GROQ integration
└── prompts.ts         # Grading prompt templates
```

### Integration Points
- **GradeSubmissionsModal.tsx** - UI integration for AI buttons and suggestions
- **groqService.ts** - Reference implementation for multi-account rotation

## Technical Design

### 1. Multi-Account Rotation (Reuse Pattern)
```typescript
// Same pattern as groqService.ts
const getGroqAccounts = (): GroqAccount[] => {
    const accounts: GroqAccount[] = [];
    for (let i = 1; i <= 5; i++) {
        const apiKey = import.meta.env[`VITE_GROQ_API_KEY_${i}`];
        if (apiKey) accounts.push({ apiKey, index: i });
    }
    return accounts;
};
```

### 2. Grading Prompt Structure
```typescript
const GRADING_SYSTEM_PROMPT = `You are an expert academic grader. Analyze the student submission and provide:
1. A suggested score (0-{maxPoints})
2. Confidence level (0-100%)
3. Brief reasoning for the score
4. Constructive feedback for the student

RULES:
- Be fair and consistent
- Focus on content quality, not formatting
- Provide actionable feedback
- Maintain encouraging tone`;
```

### 3. Response Format
```typescript
interface AIGradingResult {
    suggestedScore: number;
    confidence: number;        // 0-100
    reasoning: string;         // Why this score
    feedback: string;          // For student
    rubricScores?: Record<string, {
        score: number;
        reasoning: string;
    }>;
}
```

### 4. Error Handling Strategy
1. Rate limit → Rotate to next account
2. All accounts limited → Show retry message with timing
3. API error → Show generic error, allow manual grading
4. No content → Show "Unable to analyze" message

## UI Components

### AI Grade Button (Score Section)
```
┌─────────────────────────────────────┐
│ Score                    [Rubric]   │
│ ┌─────────────┐ ┌──────────────────┐│
│ │ [AI Grade]  │ │ 85 / 100   85%  ││
│ └─────────────┘ └──────────────────┘│
└─────────────────────────────────────┘
```

### AI Suggestion Display
```
┌─────────────────────────────────────┐
│ 🤖 AI Suggestion          85% conf  │
│ ─────────────────────────────────── │
│ Suggested: 87/100                   │
│ "Strong understanding of concepts..." │
│                                     │
│        [Accept]  [Dismiss]          │
└─────────────────────────────────────┘
```

### Batch Mode Progress
```
┌─────────────────────────────────────┐
│ AI Grading Progress                 │
│ ████████████░░░░░░░░  12/20        │
│ Grading: Maria Santos...            │
│                        [Cancel]     │
└─────────────────────────────────────┘
```

## Data Flow

```
User clicks "AI Grade"
        ↓
Check if content exists
        ↓
Call aiGradingService.gradeSubmission()
        ↓
Service selects GROQ account (rotation)
        ↓
Send prompt with submission content
        ↓
Parse AI response
        ↓
Display suggestion in UI
        ↓
User accepts/dismisses
        ↓
If accepted: populate score + feedback
```

## State Management

### New State in GradingPanel
```typescript
const [isAIGrading, setIsAIGrading] = useState(false);
const [aiSuggestion, setAiSuggestion] = useState<AIGradingResult | null>(null);
const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
```

### Batch Mode State
```typescript
const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentStudent: string;
} | null>(null);
```

## API Usage Estimation

### Per Submission
- Input tokens: ~500-1000 (submission content + prompt)
- Output tokens: ~200-300 (score + reasoning + feedback)
- Total: ~1000 tokens per grading

### Daily Capacity
- 5 accounts × 14,400 req/day = 72,000 requests/day
- Assuming 1 request per submission = 72,000 submissions/day
- More than sufficient for typical usage

## Security Considerations

1. **API Keys**: Stored in .env.local, not committed
2. **Content**: Student submissions sent to GROQ API
3. **Privacy**: No PII stored in AI responses
4. **Rate Limiting**: Handled gracefully with rotation

## Testing Strategy

1. **Unit Tests**: Service functions with mocked API
2. **Integration Tests**: Full flow with test submissions
3. **Manual Testing**: Various submission types and edge cases

## Rollout Plan

1. **Phase 1**: Core service (internal testing)
2. **Phase 2**: Single grading UI (beta users)
3. **Phase 3-4**: Rubric + feedback (general availability)
4. **Phase 5-6**: Batch + outliers (power users)
