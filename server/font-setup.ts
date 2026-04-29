import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const WANTED_PREFIXES = [
  'carlito-',
  'liberation-fonts-',
  'noto-fonts-',
  'noto-fonts-cjk-',
  'noto-fonts-emoji-',
  'dejavu-fonts-',
];

const SKIP_NAME_PARTS = ['.drv', 'texlive-', 'liberation-circuit', 'noto-fonts-emoji-blob-bin'];

let setupDone = false;

function isWantedStoreEntry(name: string): boolean {
  if (SKIP_NAME_PARTS.some((p) => name.includes(p))) return false;
  return WANTED_PREFIXES.some((p) => name.startsWith(p));
}

function walkAndCollect(dir: string, out: string[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkAndCollect(full, out);
    } else if (ent.isFile() && /\.(ttf|otf|ttc)$/i.test(ent.name)) {
      out.push(full);
    } else if (ent.isSymbolicLink()) {
      try {
        const real = fs.realpathSync(full);
        const stat = fs.statSync(real);
        if (stat.isFile() && /\.(ttf|otf|ttc)$/i.test(real)) out.push(real);
        else if (stat.isDirectory()) walkAndCollect(real, out);
      } catch {
        /* ignore */
      }
    }
  }
}

export function ensureFontsAvailable(verbose = false): { linked: number; sources: string[] } {
  if (setupDone) return { linked: 0, sources: [] };
  const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  const targetDir = path.join(xdgDataHome, 'fonts');
  const sources: string[] = [];
  let linked = 0;
  try {
    fs.mkdirSync(targetDir, { recursive: true });

    let storeEntries: string[] = [];
    try {
      storeEntries = fs.readdirSync('/nix/store');
    } catch {
      storeEntries = [];
    }

    const HASH_LEN = 32;
    const wantedDirs: string[] = [];
    for (const entry of storeEntries) {
      if (!/^[a-z0-9]{32}-/.test(entry)) continue;
      const name = entry.slice(HASH_LEN + 1);
      if (!isWantedStoreEntry(name)) continue;
      const shareFonts = path.join('/nix/store', entry, 'share', 'fonts');
      try {
        if (fs.statSync(shareFonts).isDirectory()) wantedDirs.push(shareFonts);
      } catch {
        /* ignore */
      }
    }

    sources.push(...wantedDirs);

    const fontFiles: string[] = [];
    for (const dir of wantedDirs) walkAndCollect(dir, fontFiles);

    const seenNames = new Set<string>();
    for (const src of fontFiles) {
      const base = path.basename(src);
      if (seenNames.has(base)) continue;
      seenNames.add(base);
      const linkPath = path.join(targetDir, base);
      try {
        const existing = fs.lstatSync(linkPath, { throwIfNoEntry: false } as any);
        if (existing) {
          if (existing.isSymbolicLink()) {
            const cur = fs.readlinkSync(linkPath);
            if (cur === src) continue;
            fs.unlinkSync(linkPath);
          } else {
            continue;
          }
        }
      } catch {
        /* not exists */
      }
      try {
        fs.symlinkSync(src, linkPath);
        linked++;
      } catch (err) {
        if (verbose) console.warn('[font-setup] symlink failed', src, err);
      }
    }

    try {
      execFileSync('fc-cache', ['-f'], { stdio: verbose ? 'inherit' : 'ignore', timeout: 60000 });
    } catch (err) {
      if (verbose) console.warn('[font-setup] fc-cache failed', err);
    }

    setupDone = true;
    if (verbose) {
      console.log(`[font-setup] linked ${linked} font files from ${wantedDirs.length} nix store dirs`);
    }
  } catch (err) {
    console.warn('[font-setup] error', err);
  }
  return { linked, sources };
}
