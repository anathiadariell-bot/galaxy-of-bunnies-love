---
name: Living jar animation ownership
description: Animation layering and timing choices for the pixel-art jar and orbiting stars.
---

Keep transform animations on separate nested elements: jar float on its outer sprite wrapper, breathing on the inner sprite wrapper, and arrival pulse on the My Jar scene wrapper. Define each keyframe and utility once. For orbit stars, use varied motion classes together with per-star duration and twinkle offsets.

**Why:** Merging parallel jar-animation work combined wrappers and repeated CSS names, which made the JSX invalid and left some timing values unused.

**How to apply:** When changing or merging the living jar, preserve each effect on its own layer and connect timing data to the rendered orbit stars rather than leaving unused constants.
