import { copyFile } from 'node:fs/promises';
await copyFile(new URL('../src/data/universities/LICENSE.txt', import.meta.url), new URL('../dist/data/universities/LICENSE.txt', import.meta.url));
