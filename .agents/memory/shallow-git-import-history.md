---
name: Inspecting shallow Git imports
description: Verify remote state and prior commits when an imported checkout has limited Git history.
---

When asked what was completed in earlier commits, first distinguish the local checkout from the remote tip. A shallow import can have the correct current commit while omitting its parents; do not treat its short local log as the complete project history. Confirm the remote ref and inspect parent commits only when the request needs them.

**Why:** Replit's Git safety guard blocks a fetch that writes `.git/FETCH_HEAD` unless the command is explicitly authorized with its required prefix, while read-only remote-ref checks work without changing the checkout.

**How to apply:** Compare `HEAD` with the remote branch, check whether the parent commit object exists, and, when needed for an explicit history-inspection request, deepen the history without changing the worktree; verify status afterward.
