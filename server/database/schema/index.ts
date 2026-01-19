/**
 * Drizzle ORM Schema Index
 * Exports all table schemas for the CS2 Inspect database
 */

// Core tables
export { loadouts } from './loadouts';

// Item tables
export { agents } from './agents';
export { gloves } from './gloves';
export { knives } from './knives';
export { music } from './music';
export { pins } from './pins';
export { pistols, rifles, smgs, heavys } from './weapons';

// System tables
export { healthCheckHistory, healthCheckConfig } from './health';
export { migrations } from './migrations';
