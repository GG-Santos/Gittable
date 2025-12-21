const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadPreferences, savePreferences } = require('./user-preferences');

/**
 * Get presets directory
 */
function getPresetsDir() {
  const presetsDir = path.join(os.homedir(), '.gittable', 'presets');
  if (!fs.existsSync(presetsDir)) {
    fs.mkdirSync(presetsDir, { recursive: true });
  }
  return presetsDir;
}

/**
 * Get preset file path
 */
function getPresetPath(name) {
  return path.join(getPresetsDir(), `${name}.json`);
}

/**
 * List all saved presets
 */
function listPresets() {
  const presetsDir = getPresetsDir();
  if (!fs.existsSync(presetsDir)) {
    return [];
  }
  const files = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
  return files.map((f) => f.replace('.json', ''));
}

/**
 * Load a preset
 */
function loadPreset(name) {
  const presetPath = getPresetPath(name);
  if (!fs.existsSync(presetPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(presetPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Save a preset
 */
function savePreset(name, commands) {
  const presetPath = getPresetPath(name);
  const preset = {
    name,
    commands,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(presetPath, JSON.stringify(preset, null, 2), 'utf8');
  return true;
}

/**
 * Delete a preset
 */
function deletePreset(name) {
  const presetPath = getPresetPath(name);
  if (fs.existsSync(presetPath)) {
    fs.unlinkSync(presetPath);
    return true;
  }
  return false;
}

/**
 * Get default presets
 */
function getDefaultPresets() {
  return {
    feature: {
      name: 'Feature Workflow',
      description: 'Create feature branch, commit, and push',
      commands: ['branch create', 'add', 'commit', 'push'],
    },
    hotfix: {
      name: 'Hotfix Workflow',
      description: 'Create hotfix branch, commit, and push',
      commands: ['branch create', 'add', 'commit', 'push'],
    },
    release: {
      name: 'Release Workflow',
      description: 'Prepare release: tag, commit, and push',
      commands: ['add', 'commit', 'tag-push', 'push'],
    },
  };
}

/**
 * Execute a preset workflow
 */
async function executePreset(name, args = []) {
  const preset = loadPreset(name);
  if (!preset) {
    // Try default presets
    const defaults = getDefaultPresets();
    if (defaults[name]) {
      return defaults[name];
    }
    return null;
  }

  return preset;
}

module.exports = {
  listPresets,
  loadPreset,
  savePreset,
  deletePreset,
  executePreset,
  getDefaultPresets,
  getPresetsDir,
};
