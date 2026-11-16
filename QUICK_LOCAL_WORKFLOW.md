# ChatGPT to your local renderer

ChatGPT handles creative/code changes in the conversation. There is no AI model inside this launcher.

After asking ChatGPT to implement and sync an update, double-click **Sync-and-Open.cmd** in C:\V2. It downloads the source-only v2-local-render branch, backs up your previous source, installs dependencies only if the lockfile changes, then opens existing Remotion Studio on your PC. Leave its terminal window open.

Use Remotion's composition selector and timeline to preview changes immediately. Use **Start-Local-Studio.cmd** when you only need to open the current local version. Close the old Studio terminal before using Sync-and-Open again so there is one server on port 3000. Stop any active render before syncing code.

Double-click **Render-Current-Episode.cmd** for the complete final pipeline, including cached narration, sound effects and the configured soundtrack. Remotion Studio is the visual preview/editor; its direct composition render does not replace the separate final audio-finishing stage.

The sync excludes studio/out, node_modules, private music/photos, local .env files and Git data. Approved render caches remain on disk; the existing renderer validates whether each cache still matches changed visual source. A visual code change can require rerendering affected caches even though files are retained.

Source backups are under studio/backup/code-updates. Avoid modifying the same source locally and through ChatGPT at the same time; backups provide recovery, not automatic merging.

The existing full production command remains:

```powershell
powershell -ExecutionPolicy Bypass -File C:\V2\Render-Episode.ps1 -Concurrency 2
```

This shortcut was prepared and statically checked on Linux. Windows shortcut/PowerShell execution still needs your first local check. No cloud render or paid narration call is involved.

## Mandatory final-MP4 quality gate for new episodes

After rendering and mastering **any** new episode, run the source-agnostic quality gate from `C:\\V2\\studio`:

```powershell
& "C:\\V2\\.venv\\Scripts\\python.exe" scripts\\release_quality_gate.py "C:\\path\\to\\FINAL.mp4" --series what_if_cats --expected-frames 1200 --init-review
```

Replace `1200` with the episode's **approved** frame count and select `in_this_town` for that series. Review the final MP4 on a phone and headphones, verify soundtrack/asset rights, complete the generated review JSON, then rerun with `--require-approval`. The checker writes a technical/creative release report and never publishes anything. See `QUALITY_BASELINE.md` for the cross-series quality standard. The existing `door-polish` full render now runs this technical gate automatically at the end; other/new episode pipelines must call it too.
