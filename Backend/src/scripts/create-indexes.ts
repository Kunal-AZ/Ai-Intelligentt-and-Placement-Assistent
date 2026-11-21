import mongoose from 'mongoose';
import { readdir } from 'node:fs/promises';
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js';

// Production disables automatic index creation. Run explicitly before serving traffic.
// createIndexes adds declared indexes; it never drops existing indexes or records.
try {
  const modules = new URL('../modules/', import.meta.url);
  const extension = import.meta.url.endsWith('.ts') ? '.model.ts' : '.model.js';
  for (const directory of await readdir(modules, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    const folder = new URL(`${directory.name}/`, modules);
    for (const file of await readdir(folder)) {
      if (file.endsWith(extension)) await import(new URL(file, folder).href);
    }
  }
  await connectToDatabase();
  for (const model of Object.values(mongoose.models)) {
    await model.createIndexes();
    console.info(`Indexes ready: ${model.modelName}`);
  }
} catch (error) {
  console.error('Index setup failed; resolve index conflicts before deployment.', error);
  process.exitCode = 1;
} finally {
  await disconnectFromDatabase();
}
