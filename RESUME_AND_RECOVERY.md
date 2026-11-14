# Resume and recovery

The handoff includes **37 complete native shots / 2,462 frames**. The interrupted partial shot is omitted; it is not a valid cached shot. The remaining 33 shots begin at shot `36` and end at `60B`.

Run the same command after interruption:

```powershell
.\Render-Episode.ps1 -Concurrency 2
```

A shot is reused only when its video and JSON sidecar agree on current source and props hashes, exact full frame range, 1080×1920 dimensions, H.264, 30 fps, actual frame count, no browser errors, and per-frame audit coverage. A partial MP4, missing JSON, stale props, changed creative source or incomplete audit is rerendered. Do not manually relabel cache hashes.

Portable hashing canonicalizes path separators and line endings. The included native cache retains source hash `d59d3b41acad447f57d706df59f776e167848ed8f88c97d61a392b86a936abe8` and props hash `2641b10ab4ddeadfd1011d08206dbad43049bf2886bfaf04f3b1422dd09b5169`. Git attributes retain LF text on Windows. Runtime/browser/tooling portability changes do not change the approved visual source.

- Keep each `segments\ID.mp4` together with `segments\ID.json`.
- Preserve `render-props.json`, the shot manifest, `SOURCE_FREEZE.json`, the original and processed narration caches, and source code from the ZIP.
- Temporary `.partial.mp4` files may be removed after the renderer has stopped. The next run can overwrite its own temporary file.
- After a RAM/GPU failure, close the failed render/browser processes, reduce concurrency to 1, and rerun. Do not run two production jobs against the same output directory.
- To rerender one damaged shot only, from `studio\` run `node scripts/door-at-1111-render.mjs render --shots 36 --concurrency 1 --force`. Then rerun Assemble, Audio and QA.
- To revise only music/mixing, rerun Audio and QA. Completed video is not rerendered.
- If a cache is missing, restore it from the package; do not regenerate narration. Paid generation remains a separate explicit action.

The six-frame Smoke stage writes to `native-samples\`, never the full-shot `segments\` cache. Existing approved compositions and exports are separate from this episode.
