const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader, handleCancel } = require('../../utils/command-helpers');
const { getPreference, setPreference } = require('../../utils/user-preferences');
const { getTheme, getThemeWithCustomPrimary } = require('../../utils/color-theme');

/**
 * Theme management command
 */
module.exports = async (args) => {
  const action = args[0];

  // If no action provided, show interactive menu
  if (!action) {
    showCommandHeader('THEME', 'Theme Management');
    
    // Show current settings first
    const currentPrimaryColor = getPreference('primaryColor');
    const theme = getTheme();
    
    console.log(chalk.dim('\nCurrent Primary Color:'));
    if (currentPrimaryColor) {
      if (typeof currentPrimaryColor === 'string') {
        console.log(`  ${theme.primary(currentPrimaryColor)}`);
      } else if (currentPrimaryColor.r !== undefined) {
        const colorPreview = chalk.rgb(currentPrimaryColor.r, currentPrimaryColor.g, currentPrimaryColor.b)('●');
        console.log(`  ${colorPreview} RGB(${currentPrimaryColor.r}, ${currentPrimaryColor.g}, ${currentPrimaryColor.b})`);
      }
    } else {
      console.log(`  ${chalk.cyan('cyan (default)')}`);
    }
    console.log();
    
    const selectedAction = await ui.prompt.select({
      message: 'What would you like to do?',
      options: [
        { value: 'color', label: 'Change Color' },
        { value: 'reset', label: 'Reset to default' },
        { value: 'exit', label: 'Exit' },
      ],
    });
    if (selectedAction === null) return;
    
    if (selectedAction === 'exit') {
      ui.success('Done');
      return;
    }
    
    // Recursively call with selected action
    return module.exports([selectedAction, ...args.slice(1)]);
  }

  if (action === 'reset' || action === 'reset-color') {
    const currentColor = getPreference('primaryColor');
    
    if (!currentColor) {
      showCommandHeader('THEME', 'Reset Primary Color');
      ui.success('Primary color is already set to default (cyan)');
      return;
    }
    
    // Remove preference to use default - do this BEFORE showing header
    const { loadPreferences, getPreferencesPath } = require('../../utils/user-preferences');
    const fs = require('node:fs');
    const prefs = loadPreferences();
    if (prefs.primaryColor !== undefined) {
      delete prefs.primaryColor;
      // Write the updated preferences back directly
      const prefsFile = getPreferencesPath();
      try {
        fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2), 'utf8');
      } catch (error) {
        showCommandHeader('THEME', 'Reset Primary Color');
        ui.error(`Failed to save preferences: ${error.message}`);
        return;
      }
    }
    
    // Show header AFTER reset so it uses the new default cyan color
    showCommandHeader('THEME', 'Reset Primary Color');
    ui.success('Primary color reset to default (cyan)');
    return;
  }

  if (action === 'color' || action === 'colour') {
    showCommandHeader('THEME', 'Set Primary Color');
    
    // Store original color for revert
    const originalColor = getPreference('primaryColor');
    const theme = getTheme();
    
    // Show current color if set
    if (originalColor) {
      let currentColorDisplay = '';
      if (typeof originalColor === 'string') {
        currentColorDisplay = `Current: ${theme.primary(originalColor)}`;
      } else if (originalColor.r !== undefined) {
        const colorPreview = chalk.rgb(originalColor.r, originalColor.g, originalColor.b)('●');
        currentColorDisplay = `Current: ${colorPreview} RGB(${originalColor.r}, ${originalColor.g}, ${originalColor.b})`;
      }
      if (currentColorDisplay) {
        console.log(chalk.dim(`\n${currentColorDisplay}\n`));
      }
    }
    
    // Predefined color options
    const colorOptions = [
      { value: 'red', label: 'Red', color: chalk.red('●') },
      { value: 'orange', label: 'Orange', color: chalk.rgb(255, 165, 0)('●') },
      { value: 'yellow', label: 'Yellow', color: chalk.yellow('●') },
      { value: 'green', label: 'Green', color: chalk.green('●') },
      { value: 'blue', label: 'Blue', color: chalk.blue('●') },
      { value: 'cyan', label: 'Cyan (default)', color: chalk.cyan('●') },
      { value: 'violet', label: 'Violet', color: chalk.rgb(138, 43, 226)('●') },
      { value: 'pink', label: 'Pink', color: chalk.rgb(255, 192, 203)('●') },
      { value: 'gray', label: 'Gray', color: chalk.gray('●') },
      { value: 'custom', label: 'Custom RGB', color: chalk.white('●') },
    ];
    
    const selectedColor = await ui.prompt.select({
      message: 'Select primary color:',
      options: colorOptions.map((opt) => ({
        value: opt.value,
        label: `${opt.color} ${opt.label}`,
      })),
    });
    if (selectedColor === null) return;
    
    let colorValue;
    
    if (selectedColor === 'custom') {
      // Get RGB values
      const rgbInput = await ui.prompt.text({
        message: 'Enter RGB values (format: r,g,b or r g b):',
        placeholder: '255, 100, 50',
        validate: (value) => {
          if (!value) return 'RGB values are required';
          // Try to parse as comma-separated or space-separated
          const parts = value.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
          if (parts.length !== 3) {
            return 'Please enter 3 values (R, G, B)';
          }
          const r = parseInt(parts[0], 10);
          const g = parseInt(parts[1], 10);
          const b = parseInt(parts[2], 10);
          if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return 'All values must be numbers';
          }
          if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            return 'RGB values must be between 0 and 255';
          }
          return;
        },
      });
      if (rgbInput === null) return;
      
      const parts = rgbInput.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      
      colorValue = { r, g, b };
    } else {
      // Convert non-standard color names to RGB
      const colorMap = {
        orange: { r: 255, g: 165, b: 0 },
        violet: { r: 138, g: 43, b: 226 },
        pink: { r: 255, g: 192, b: 203 },
      };
      
      if (colorMap[selectedColor]) {
        colorValue = colorMap[selectedColor];
      } else {
        // Standard chalk colors (red, yellow, green, blue, cyan, gray)
        colorValue = selectedColor;
      }
    }
    
    // Create preview theme without saving
    const previewTheme = getThemeWithCustomPrimary(colorValue);
    
    // Show preview
    console.log('\n');
    ui.info('Preview:');
    console.log(previewTheme.primary('  This is how the primary color will look'));
    console.log(previewTheme.primary('  ████████████████████████████████████████'));
    console.log(previewTheme.primary('  Example text with primary color'));
    console.log(previewTheme.primary('  Commands, headers, and highlights will use this color\n'));
    
    // Build confirmation options
    const confirmOptions = [
      { value: 'yes', label: 'Yes, apply this color' },
      { value: 'cancel', label: 'Cancel (keep current)' },
    ];
    
    // Only show revert option if there was a previous color
    if (originalColor !== undefined && originalColor !== null) {
      confirmOptions.splice(1, 0, { value: 'revert', label: 'Revert to previous color' });
    } else {
      confirmOptions.splice(1, 0, { value: 'reset', label: 'Reset to default (cyan)' });
    }
    
    // Ask for confirmation
    const confirm = await ui.prompt.select({
      message: 'Apply this color?',
      options: confirmOptions,
    });
    if (confirm === null) {
      // User cancelled, no changes needed
      return;
    }
    
    if (confirm === 'revert') {
      setPreference('primaryColor', originalColor);
      ui.success('Color reverted to previous');
      return;
    }
    
    if (confirm === 'reset') {
      // Remove preference to use default
      const { loadPreferences, getPreferencesPath } = require('../../utils/user-preferences');
      const fs = require('node:fs');
      const prefs = loadPreferences();
      if (prefs.primaryColor !== undefined) {
        delete prefs.primaryColor;
        // Write the updated preferences back directly
        const prefsFile = getPreferencesPath();
        try {
          fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2), 'utf8');
        } catch (error) {
          ui.error(`Failed to save preferences: ${error.message}`);
          return;
        }
      }
      ui.success('Color reset to default (cyan)');
      return;
    }
    
    if (confirm === 'cancel') {
      ui.warn('Color change cancelled');
      return;
    }
    
    // Save the color (confirm === 'yes')
    setPreference('primaryColor', colorValue);
    ui.success('Primary color updated successfully');
    return;
  }

  // Unknown action
  ui.error(`Unknown action: ${action}. Use 'list', 'color', or 'reset'`);
};
