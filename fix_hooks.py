import re

with open("src/pages/MockTestInterface.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Extract `if (!test) { ... }` block
# It starts at `if (!test) {` and ends before `// Scheduled Test Waiting Room Screen if opened before scheduled start time`
test_block_pattern = r'  if \(!test\) \{.*?\n  \}\n'
test_block_match = re.search(test_block_pattern, code, re.DOTALL)
test_block = test_block_match.group(0)

# Remove it from its original place
code = code.replace(test_block, "")

# 2. Extract `if (isBeforeScheduledStart) { ... }` block
# Starts with `// Scheduled Test Waiting Room Screen if opened before scheduled start time`
# Ends before `// Real-time synchronization whenever candidate selects an option`
wait_room_pattern = r'  // Scheduled Test Waiting Room Screen if opened before scheduled start time\n  if \(isBeforeScheduledStart\) \{.*?\n  \}\n'
wait_room_match = re.search(wait_room_pattern, code, re.DOTALL)
wait_room_block = wait_room_match.group(0)

# Remove it from its original place
code = code.replace(wait_room_block, "")

# 3. Fix `counts` to use optional chaining
counts_old = "unvisited: test.questions.length - Object.keys(statuses).filter(k => statuses[k] !== 'unvisited').length"
counts_new = "unvisited: (test?.questions?.length || 0) - Object.keys(statuses).filter(k => statuses[k] !== 'unvisited').length"
code = code.replace(counts_old, counts_new)

# 4. Fix `useEffect` dependency array
deps_old = "test.questions.length, handleNext, handlePrev"
deps_new = "test?.questions?.length, handleNext, handlePrev"
code = code.replace(deps_old, deps_new)

# 4b. Fix `useEffect` body
body_old = "if (currentQuestionIndex === test.questions.length - 1)"
body_new = "if (currentQuestionIndex === (test?.questions?.length || 0) - 1)"
code = code.replace(body_old, body_new)

body2_old = "if (currentQuestionIndex < test.questions.length - 1)"
body2_new = "if (currentQuestionIndex < (test?.questions?.length || 0) - 1)"
code = code.replace(body2_old, body2_new)


# 5. Insert the extracted blocks right before `return (` at the bottom.
# Find `  return (\n    <div className="flex h-\[100dvh\] flex-col bg-white`
return_pattern = r'  return \(\n    <div className="flex h-\[100dvh\] flex-col bg-white'

insertion = f"{test_block}\n{wait_room_block}\n  return (\n    <div className=\"flex h-[100dvh] flex-col bg-white"
code = re.sub(return_pattern, insertion, code)

with open("src/pages/MockTestInterface.tsx", "w", encoding="utf-8") as f:
    f.write(code)

