---
name: Secret requests and `.replit`
description: Check whether secure secret collection unexpectedly wrote values into project configuration.
---

After a secure secret request in this workspace, the submitted values appeared as plaintext under `[userenv.shared]` in `.replit`, in addition to being available as secrets.

**Why:** Those configuration entries are tracked and can expose credentials through diffs or commits.

**How to apply:** After requesting credentials, inspect `.replit` changes without printing their values. If credential entries appeared, restore the intended TOML through `verifyAndReplaceDotReplit`, verify the working tree, and have the user rotate the exposed credentials before using replacements.
