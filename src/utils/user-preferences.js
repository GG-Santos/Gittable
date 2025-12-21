const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Get user preferences file path
 */
function getPreferencesPath() {
  const prefsDir = path.join(os.homedir(), '.gittable');
  const prefsFile = path.join(prefsDir, 'preferences.json');

  // Ensure directory exists
  if (!fs.existsSync(prefsDir)) {
    fs.mkdirSync(prefsDir, { recursive: true });
  }

  return prefsFile;
}

/**
 * Load user preferences
 */
function loadPreferences() {
  const prefsFile = getPreferencesPath();

  if (!fs.existsSync(prefsFile)) {
    return {};
  }

  try {
    const content = fs.readFileSync(prefsFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * Save user preferences
 */
function savePreferences(preferences) {
  const prefsFile = getPreferencesPath();
  const current = loadPreferences();
  const merged = { ...current, ...preferences };

  try {
    fs.writeFileSync(prefsFile, JSON.stringify(merged, null, 2), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get preference value
 */
function getPreference(key, defaultValue = null) {
  const prefs = loadPreferences();
  return prefs[key] !== undefined ? prefs[key] : defaultValue;
}

/**
 * Set preference value
 */
function setPreference(key, value) {
  return savePreferences({ [key]: value });
}

module.exports = {
  loadPreferences,
  savePreferences,
  getPreference,
  setPreference,
  getPreferencesPath,
};
