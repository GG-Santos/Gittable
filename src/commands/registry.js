const path = require('node:path');
const fs = require('node:fs');

/**
 * Command Registry System
 * Auto-discovers and registers commands from category directories
 */
class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
  }

  /**
   * Register a command
   */
  register(command) {
    const { name, aliases = [], description, category, subcategory, handler } = command;

    if (!name || !handler) {
      throw new Error(`Command must have name and handler: ${JSON.stringify(command)}`);
    }

    // Check if command already exists (idempotent registration)
    const existing = this.commands.get(name);
    if (existing) {
      // Command already registered, skip (idempotent)
      return;
    }

    // Register main command
    this.commands.set(name, {
      name,
      aliases,
      description: description || '',
      category: category || 'utilities',
      subcategory: subcategory || null,
      handler,
    });

    // Register aliases
    for (const alias of aliases) {
      if (this.aliases.has(alias)) {
        const existingCommand = this.aliases.get(alias);
        // Only warn if it's a different command (not re-registering the same one)
        if (existingCommand !== name) {
          console.warn(
            `Warning: Alias "${alias}" is already registered for "${existingCommand}", overwriting with "${name}"`
          );
        }
      }
      this.aliases.set(alias, name);
    }

    // Track category
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(name);
  }

  /**
   * Register multiple commands
   */
  registerAll(commands) {
    for (const command of commands) {
      this.register(command);
    }
  }

  /**
   * Get command by name or alias
   */
  get(commandName) {
    // Try direct name first
    if (this.commands.has(commandName)) {
      return this.commands.get(commandName);
    }

    // Try alias
    if (this.aliases.has(commandName)) {
      const actualName = this.aliases.get(commandName);
      return this.commands.get(actualName);
    }

    return null;
  }

  /**
   * Check if command exists
   */
  has(commandName) {
    return this.commands.has(commandName) || this.aliases.has(commandName);
  }

  /**
   * Get all commands
   */
  getAll() {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getByCategory(category) {
    return this.categories.get(category) || [];
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get enabled commands based on config
   */
  getEnabledCommands(config) {
      const { isCommandEnabled } = require('../core/config/mode-filter');
    const allCommands = this.getAll();

    if (!config) {
      return allCommands;
    }

    return allCommands.filter((cmd) => isCommandEnabled(cmd.name, config));
  }

  /**
   * Get commands by category, filtered by config
   */
  getByCategoryFiltered(category, config) {
    const commands = this.getByCategory(category) || [];
    const commandDefs = commands.map((name) => this.get(name)).filter(Boolean);

    if (!config) {
      return commandDefs;
    }

      const { isCommandEnabled } = require('../core/config/mode-filter');
    return commandDefs.filter((cmd) => isCommandEnabled(cmd.name, config));
  }

  /**
   * Auto-discover commands from category directories
   */
  discoverCommands(baseDir = path.join(__dirname)) {
      const { COMMAND_CATEGORIES } = require('../core/constants');
    const categoryDirs = COMMAND_CATEGORIES;

    for (const category of categoryDirs) {
      const categoryPath = path.join(baseDir, category, 'index.js');
      if (fs.existsSync(categoryPath)) {
        try {
          const commands = require(categoryPath);
          if (Array.isArray(commands)) {
            this.registerAll(commands);
          } else if (commands && typeof commands === 'object') {
            // Single command object
            this.register({ ...commands, category });
          }
        } catch (error) {
          console.warn(`Failed to load commands from ${categoryPath}:`, error.message);
        }
      }
    }
  }
}

/**
 * Singleton Pattern
 * 
 * The CommandRegistry is exported as a singleton instance to ensure:
 * - Single source of truth for command registration
 * - Commands are registered once at application startup
 * - Consistent command resolution across the application
 * 
 * This singleton is created at module load time and shared across all imports.
 * For testing, consider creating a factory function if fresh instances are needed.
 */
const registry = new CommandRegistry();

module.exports = registry;
