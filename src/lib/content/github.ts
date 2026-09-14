import { execFileSync } from 'node:child_process';

// A preview must link to files that exist on its branch; production edits main.
export function contentEditUrl(file: string): string {
  let ref = process.env.VIBES_CONTENT_EDIT_REF || process.env.GITHUB_HEAD_REF || 'main';
  if (ref === 'main' && process.env.VIBES_DEPLOY !== '1') {
    ref = process.env.GITHUB_REF_NAME || '';
    if (!ref) {
      try {
        ref = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
      } catch {
        ref = 'main';
      }
    }
  }
  return `https://github.com/Vibes-college/Vibes/edit/${(ref || 'main').split('/').map(encodeURIComponent).join('/')}/${file.split('/').map(encodeURIComponent).join('/')}`;
}
