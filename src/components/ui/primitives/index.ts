/**
 * UI Primitives
 * Re-exports all reusable UI primitive components
 * 
 * Note: Some components are not re-exported here due to naming conflicts.
 * Import them directly from their files when needed.
 */

// Core primitives
export { ContainerTextFlip } from './container-text-flip';
export { Dock, DockIcon, DockAutoHide } from './dock';
export { FileUpload } from './file-upload';
export { FloatingDock } from './floating-dock';
export { NumberTicker } from './number-ticker';
export { PlaceholdersAndVanishInput } from './placeholders-and-vanish-input';
export { PlaceholdersAndVanishInputBlue } from './placeholders-and-vanish-input-blue';
export { Tooltip } from './tooltip-card';

// Components with potential naming conflicts - import directly from files:
// - apple-cards-carousel
// - background-ripple-effect  
// - card-hover-effect
// - sidebar
