const { execSync } = require('node:child_process');
const { getPreference } = require('./user-preferences');

/**
 * Play sound alert
 */
function playSound(type = 'success') {
  const soundEnabled = getPreference('sound.enabled', false);

  if (!soundEnabled) {
    return;
  }

  try {
    // Windows
    if (process.platform === 'win32') {
      if (type === 'success') {
        // System beep
        execSync('powershell -Command "[console]::beep(800,200)"', { stdio: 'ignore' });
      } else if (type === 'error') {
        execSync('powershell -Command "[console]::beep(400,400)"', { stdio: 'ignore' });
      }
    }
    // macOS
    else if (process.platform === 'darwin') {
      if (type === 'success') {
        execSync('afplay /System/Library/Sounds/Glass.aiff', { stdio: 'ignore' });
      } else if (type === 'error') {
        execSync('afplay /System/Library/Sounds/Basso.aiff', { stdio: 'ignore' });
      }
    }
    // Linux
    else if (process.platform === 'linux') {
      // Try different sound systems
      try {
        execSync('paplay /usr/share/sounds/freedesktop/stereo/complete.oga', { stdio: 'ignore' });
      } catch {
        try {
          execSync('aplay /usr/share/sounds/alsa/Front_Left.wav', { stdio: 'ignore' });
        } catch {
          // Fallback to system beep
          execSync('echo -e "a"', { stdio: 'ignore' });
        }
      }
    }
  } catch (error) {
    // Silently fail if sound isn't available
  }
}

module.exports = {
  playSound,
};
