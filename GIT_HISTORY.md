# Git history

`repository-history.bundle` contains the complete reachable Git history and refs of the existing repository, including the original and approved V2 checkpoints, episode branch, and portable handoff branch. It does not include machine-local Git configuration, credential helpers, environment files or authentication tokens.

The source ZIP can run without Git. To restore a normal Git working copy, install Git and run from the extracted project folder:

```powershell
git bundle verify .\repository-history.bundle
git clone --branch v2-windows-portable .\repository-history.bundle ..\V2-With-History
```

Then copy the **ignored assets and caches** from the ZIP into the restored working copy:

```powershell
Copy-Item .\studio\public ..\V2-With-History\studio\ -Recurse -Force
Copy-Item .\studio\out ..\V2-With-History\studio\ -Recurse -Force
```

Run Setup-V2.ps1 inside `V2-With-History`; do not copy Linux `node_modules` or virtual environments. The supplied music and private references stay outside both working copies. Add your own GitHub remote later if desired; no push or publication is part of this handoff.

Checkpoints include e1d1ad8 (preproduction), 4d0f002 (final approved episode visual source), bfbb2da (exact-length audio/Foley), b5e30e7 (clean opening music loop), and the portable branch recorded in the package's QA manifest. `git bundle list-heads` lists preserved branch/tag refs. The working source in this ZIP is from `v2-windows-portable`.
