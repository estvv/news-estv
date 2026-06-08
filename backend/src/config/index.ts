import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config } from '../types/index.js';

let config: Config | null = null;

export function loadConfig(): Config {
  if (config) {
    return config;
  }

  try {
    const configPath = process.env.CONFIG_PATH || join(process.cwd(), 'config.json');
    const configFile = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configFile) as Config;
    return config!;
  } catch (error) {
    console.error('Failed to load config:', error);
    throw new Error('Could not load configuration file');
  }
}

export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config;
}