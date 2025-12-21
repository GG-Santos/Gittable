const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execGit } = require('../core/git');

/**
 * Get templates directory
 */
function getTemplatesDir() {
  const templatesDir = path.join(os.homedir(), '.gittable', 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  return templatesDir;
}

/**
 * Get template file path
 */
function getTemplatePath(name) {
  return path.join(getTemplatesDir(), `${name}.txt`);
}

/**
 * List all saved templates
 */
function listTemplates() {
  const templatesDir = getTemplatesDir();
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.txt'));
  return files.map((f) => f.replace('.txt', ''));
}

/**
 * Save a template
 */
function saveTemplate(name, content) {
  const templatePath = getTemplatePath(name);
  fs.writeFileSync(templatePath, content, 'utf8');
  return true;
}

/**
 * Load a template
 */
function loadTemplate(name) {
  const templatePath = getTemplatePath(name);
  if (!fs.existsSync(templatePath)) {
    return null;
  }
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Delete a template
 */
function deleteTemplate(name) {
  const templatePath = getTemplatePath(name);
  if (fs.existsSync(templatePath)) {
    fs.unlinkSync(templatePath);
    return true;
  }
  return false;
}

/**
 * Expand template variables
 */
function expandTemplate(template, variables = {}) {
  let expanded = template;

  // Get current branch
  if (!variables.branch) {
    const branchResult = execGit('rev-parse --abbrev-ref HEAD', { silent: true });
    if (branchResult.success) {
      variables.branch = branchResult.output.trim();
    }
  }

  // Get current date
  if (!variables.date) {
    variables.date = new Date().toISOString().split('T')[0];
  }

  // Get current time
  if (!variables.time) {
    variables.time = new Date().toLocaleTimeString();
  }

  // Replace variables
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    expanded = expanded.replace(regex, variables[key]);
  });

  return expanded;
}

module.exports = {
  listTemplates,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
  expandTemplate,
  getTemplatesDir,
};
