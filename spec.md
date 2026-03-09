# Math Quiz App for Tayeba

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Random math question generator (addition, subtraction, multiplication, division -- short and simple)
- Answer input box and submit button
- 3 heart icons showing remaining chances per question
- On correct answer: display 1-5 star rating (yellow/white mix) with a label (Excellent, Brilliant, Good, Wonderful)
- On wrong answer: red text saying "Wrong answer, try again"
- After 3 wrong attempts: reveal the correct answer and move to next question
- Persistent header text "I love you Tayeba" in the top-right of every screen
- New question loads automatically after a correct answer or after all 3 chances are used

### Modify
- None

### Remove
- None

## Implementation Plan
1. Backend: store question generation logic -- generate random math questions (operands 1-20, operations: +, -, *, /) and validate answers
2. Backend: track sessions with question, correct answer, attempts remaining
3. Frontend: top-right fixed "I love you Tayeba" text
4. Frontend: display current question, 3 heart icons (filled/empty based on remaining attempts)
5. Frontend: answer input + submit button
6. Frontend: wrong answer red warning text
7. Frontend: correct answer star rating display (1-5 stars, yellow/white gradient mix) + label text
8. Frontend: auto-advance to next question after result
