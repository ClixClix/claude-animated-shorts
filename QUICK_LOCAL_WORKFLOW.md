# ChatGPT to your local renderer

ChatGPT handles creative/code changes in the conversation. There is no AI model inside this launcher.

After asking ChatGPT to implement and sync an update, double-click **Sync-and-Open.cmd** in C:\V2. It downloads the source-only v2-local-render branch, backs up your previous source, installs dependencies only if the lockfile changes, then opens existing Remotion Studio on your PC. Leave its terminal window open.

Use Remotion's composition selector and timeline to preview changes immediately. Use **Start-Local-Studio.cmd** when you only need to open the current local version. Close the old Studio terminal before using Sync-and-Open again so there is one server on port 3000. Stop any active render before syncing code.

The sync excludes studio/out, node_modules, private music/photos, local .env files and Git data. Approved render caches remain on disk; the existing renderer validates whether each cache still matches changed visual source. A visual code change can require rerendering affected caches even though files are retained.

Source backups are under studio/backup/code-updates. Avoid modifying the same source locally and through ChatGPT at the same time; backups provide recovery, not automatic merging.

The existing full production command remains:

```powershell
powershell -ExecutionPolicy Bypass -File C:\V2\Render-Episode.ps1 -Concurrency 2
```

This shortcut was prepared and statically checked on Linux. Windows shortcut/PowerShell execution still needs your first local check. No cloud render or paid narration call is involved.
