# New episode brief (complete before production)

- Series/title:
- Approval to start this episode:
- Audience hook and town rule:
- Exception/mystery:
- Main characters and emotional change:
- Setup -> escalating clues -> reveal -> payoff:
- Exact script approved by the user:
- Narrator/config preset (read config.ts; do not assume):
- Existing usable narration cache, or paid credit estimate awaiting approval:
- Target format/duration and maximum shot duration:
- Existing permanent locations reused:
- New environment/props needing design approval:

## Shot plan

For each shot record: stable shot ID; spoken words/timing; information revealed; main subject/action; starting/ending character/prop positions; camera start/end; gaze and reaction; contact/support surfaces; match with previous/next shot; required visibility; planned sound.

Do not place images merely because a word is spoken. The image must make the story understandable without narration, and add information or emotional meaning to it. Keep secrets hidden until the reveal.

## Production gates

1. Script and new design/layout approval.
2. Narration cache/approval and actual timing.
3. Actual rendered storyboard, checked against geography and spoken beats.
4. Consecutive actual frames for stepping, turning, object contact, entry and reveals.
5. Full narrated local preview and reference-quality review.
6. Native local render, independent music mix, encoded audio/video QA, user approval.
7. **Mandatory final-MP4 release gate:** run `studio/scripts/release_quality_gate.py` with the approved edit's `--expected-frames` and the correct series. Require 1080×1920/30 H.264, AAC stereo/48 kHz, −16 ±2 LUFS, ≤−1 dBTP encoded true peak, full decode and an exact-file human review/rights signoff. See `QUALITY_BASELINE.md`. Never call an unreviewed or unlicensed render publish-ready.

Record actual evidence paths and unresolved issues at each gate. Passing code checks is not picture approval. No automatic new paid audio or publication.
