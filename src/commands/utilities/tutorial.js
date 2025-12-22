const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showBanner } = require('../../ui/components');
const VERSION = require('../../../package.json').version;
const { requireTTY } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');
const { getPreference, setPreference } = require('../../utils/user-preferences');

/**
 * Gamified Level-Based Tutorial System
 * Based on Git workflow concepts adapted for Gittable
 */

// Tutorial progress structure
function getTutorialProgress() {
  return getPreference('tutorial.progress', {
    level: 1,
    completedLevels: [],
    xp: 0,
    badges: [],
    streak: 0,
    lastPlayed: null,
  });
}

function saveTutorialProgress(progress) {
  setPreference('tutorial.progress', progress);
}

function calculateProgress(progress) {
  const totalLevels = 4;
  const completed = progress.completedLevels.length;
  return Math.round((completed / totalLevels) * 100);
}

function drawProgressBar(percentage, width = 30) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

// Level definitions
const LEVELS = [
  {
    id: 1,
    name: 'Beginner',
    title: 'Understanding Git Basics',
    description: 'Learn the three areas of Git and basic workflow',
    concepts: [
      'Working Directory - Where you make changes',
      'Staging Area - Where you prepare changes before committing',
      'Repository - Where your committed history is stored',
    ],
    commands: ['status', 'add', 'commit', 'push'],
    xpReward: 100,
    badge: '🎯 Git Basics',
    tutorials: [
      {
        name: 'The Three Areas of Git',
        description: 'Understanding Working Directory, Staging Area, and Repository',
        steps: [
          {
            text: 'Check your working directory status',
            cmd: 'gittable status',
            explanation: 'Shows files in three states: untracked (new), modified (changed), and staged (ready to commit)',
            tip: 'The status command is your best friend - use it often!',
          },
          {
            text: 'Stage files to the staging area',
            cmd: 'gittable add',
            explanation: 'Moves changes from working directory to staging area. Gittable provides interactive file selection!',
            tip: 'You can use patterns like "*.js" to stage multiple files',
          },
          {
            text: 'Commit staged changes to repository',
            cmd: 'gittable commit',
            explanation: 'Saves staged changes permanently. Gittable guides you through conventional commit format!',
            tip: 'After committing, you\'ll see a diff preview and can choose to push or sync',
          },
          {
            text: 'Push to remote repository',
            cmd: 'gittable push',
            explanation: 'Shares your commits with others. Gittable prompts you after commit!',
            tip: 'The commit command already includes push/sync options - no separate command needed!',
          },
        ],
      },
      {
        name: 'Daily Development Workflow',
        description: 'Complete workflow from checking status to pushing',
        steps: [
          {
            text: 'Start by checking what changed',
            cmd: 'gittable status',
            explanation: 'Always start here to see what files have been modified',
          },
          {
            text: 'Stage your changes',
            cmd: 'gittable add',
            explanation: 'Select files interactively or use patterns',
          },
          {
            text: 'Review changes before committing',
            explanation: 'Gittable automatically shows diff preview in commit flow!',
            tip: 'You can view diff stats and full diff before committing',
          },
          {
            text: 'Create a commit',
            cmd: 'gittable commit',
            explanation: 'Follow the interactive prompts for conventional commit format',
          },
        ],
      },
    ],
    quiz: [
      {
        question: 'What are the three areas of Git?',
        options: ['Working Directory, Staging Area, Repository', 'Local, Remote, Cloud', 'Files, Commits, Branches'],
        correct: 0,
      },
      {
        question: 'What does "gittable add" do?',
        options: ['Creates a commit', 'Stages files for commit', 'Pushes to remote'],
        correct: 1,
      },
    ],
  },
  {
    id: 2,
    name: 'Intermediate',
    title: 'Branching and Collaboration',
    description: 'Work with branches and collaborate with remotes',
    concepts: [
      'Branches - Parallel lines of development',
      'Merging - Combining changes from branches',
      'Remote repositories - Shared code with team',
    ],
    commands: ['branch', 'checkout', 'switch', 'merge', 'pull', 'sync'],
    xpReward: 200,
    badge: '🌿 Branch Master',
    tutorials: [
      {
        name: 'Branch Workflow',
        description: 'Create and work with branches',
        steps: [
          {
            text: 'List all branches',
            cmd: 'gittable branch',
            explanation: 'See all local and remote branches',
          },
          {
            text: 'Create a new feature branch',
            cmd: 'gittable branch create feature/new-feature',
            explanation: 'Creates and switches to new branch in one command',
            tip: 'Gittable organizes branches visually in the interactive menu',
          },
          {
            text: 'Make changes and commit',
            cmd: 'gittable commit',
            explanation: 'Work on your feature branch',
          },
          {
            text: 'Switch back to main',
            cmd: 'gittable switch main',
            explanation: 'Modern syntax for switching branches',
          },
          {
            text: 'Merge feature branch',
            cmd: 'gittable merge feature/new-feature',
            explanation: 'Combine changes from feature into main',
          },
        ],
      },
      {
        name: 'Collaboration Workflow',
        description: 'Sync with remote repository',
        steps: [
          {
            text: 'Pull latest changes',
            cmd: 'gittable pull',
            explanation: 'Fetch and merge changes from remote',
          },
          {
            text: 'Pull with rebase',
            cmd: 'gittable pull --rebase',
            explanation: 'Rebase instead of merge for cleaner history',
            tip: 'Use rebase to keep linear history',
          },
          {
            text: 'Sync with remote',
            cmd: 'gittable sync',
            explanation: 'Fetch, rebase, and push in one command',
            tip: 'Gittable\'s sync combines multiple operations',
          },
        ],
      },
    ],
    quiz: [
      {
        question: 'What is the purpose of branches?',
        options: ['To organize files', 'To create parallel lines of development', 'To store backups'],
        correct: 1,
      },
      {
        question: 'What does "gittable sync" do?',
        options: ['Only pushes', 'Fetch + rebase + push', 'Only pulls'],
        correct: 1,
      },
    ],
  },
  {
    id: 3,
    name: 'Advanced',
    title: 'Advanced Operations',
    description: 'Handle complex scenarios and recover from mistakes',
    concepts: [
      'Stashing - Temporarily save changes',
      'Rebasing - Rewrite commit history',
      'Undo operations - Recover from mistakes',
      'Conflict resolution - Handle merge conflicts',
    ],
    commands: ['stash', 'rebase', 'undo', 'revert', 'conflicts', 'resolve'],
    xpReward: 300,
    badge: '⚡ Advanced Git User',
    tutorials: [
      {
        name: 'Stash Workflow',
        description: 'Temporarily save changes',
        steps: [
          {
            text: 'Create a stash',
            cmd: 'gittable stash create "WIP: feature"',
            explanation: 'Save current changes temporarily',
            tip: 'Use descriptive messages for stashes',
          },
          {
            text: 'Switch branches or pull',
            cmd: 'gittable pull',
            explanation: 'Now you can switch branches safely',
          },
          {
            text: 'Restore stashed changes',
            cmd: 'gittable stash apply 0',
            explanation: 'Apply stash by index (keeps stash)',
            tip: 'Use "stash pop" to apply and remove',
          },
        ],
      },
      {
        name: 'Undo Operations',
        description: 'Recover from mistakes',
        steps: [
          {
            text: 'Undo last commit',
            cmd: 'gittable undo',
            explanation: 'Removes commit but keeps changes in working directory',
            tip: 'Safe operation - changes are preserved',
          },
          {
            text: 'Revert a commit',
            cmd: 'gittable revert HEAD',
            explanation: 'Creates new commit that undoes changes',
            tip: 'Use this for commits already pushed',
          },
          {
            text: 'Restore a file',
            cmd: 'gittable restore file.js',
            explanation: 'Restore file from index or commit',
          },
        ],
      },
      {
        name: 'Conflict Resolution',
        description: 'Handle merge conflicts',
        steps: [
          {
            text: 'List conflicted files',
            cmd: 'gittable conflicts',
            explanation: 'See all files with conflicts',
          },
          {
            text: 'Resolve a conflict',
            cmd: 'gittable resolve file.js',
            explanation: 'Opens file in editor to resolve conflicts',
            tip: 'Gittable helps you resolve conflicts step by step',
          },
          {
            text: 'Continue merge',
            cmd: 'gittable merge --continue',
            explanation: 'Complete merge after resolving conflicts',
          },
        ],
      },
    ],
    quiz: [
      {
        question: 'When should you use stash?',
        options: ['To delete files', 'To temporarily save changes', 'To push commits'],
        correct: 1,
      },
      {
        question: 'What is the difference between undo and revert?',
        options: ['No difference', 'Undo removes commit, revert creates new commit', 'Undo is for local, revert for remote'],
        correct: 1,
      },
    ],
  },
  {
    id: 4,
    name: 'Expert',
    title: 'Repository Management',
    description: 'Master repository management and advanced inspection',
    concepts: [
      'Tags - Mark important commits',
      'Submodules - Nested repositories',
      'Worktrees - Multiple working directories',
      'Hooks - Automate workflows',
      'Advanced history - Inspect repository deeply',
    ],
    commands: ['tag', 'submodule', 'worktree', 'hooks', 'grep', 'blame'],
    xpReward: 400,
    badge: '🏆 Git Expert',
    tutorials: [
      {
        name: 'Tag Management',
        description: 'Mark important commits',
        steps: [
          {
            text: 'List tags',
            cmd: 'gittable tag',
            explanation: 'See all tags in repository',
          },
          {
            text: 'Create a tag',
            cmd: 'gittable tag create v1.0.0',
            explanation: 'Mark a release version',
          },
          {
            text: 'Push tag to remote',
            cmd: 'gittable tag-push v1.0.0',
            explanation: 'Share tag with team',
          },
        ],
      },
      {
        name: 'Advanced History Inspection',
        description: 'Deep dive into repository history',
        steps: [
          {
            text: 'Search commit messages',
            cmd: 'gittable grep "pattern"',
            explanation: 'Find commits containing pattern',
          },
          {
            text: 'See who changed each line',
            cmd: 'gittable blame file.js',
            explanation: 'Line-by-line authorship',
          },
          {
            text: 'Compare commit ranges',
            cmd: 'gittable diff main..feature',
            explanation: 'See differences between ranges',
          },
        ],
      },
    ],
    quiz: [
      {
        question: 'What are tags used for?',
        options: ['To organize files', 'To mark important commits like releases', 'To store backups'],
        correct: 1,
      },
      {
        question: 'What does "gittable blame" show?',
        options: ['Who to blame for bugs', 'Who last modified each line', 'Commit messages'],
        correct: 1,
      },
    ],
  },
];

async function showLevelMenu(progress) {
  const options = LEVELS.map((level) => {
    const isCompleted = progress.completedLevels.includes(level.id);
    const isUnlocked = level.id === 1 || progress.completedLevels.includes(level.id - 1);
    const status = isCompleted
      ? chalk.green('✓ Completed')
      : isUnlocked
        ? chalk.cyan('→ Available')
        : chalk.gray('🔒 Locked');

    return {
      value: level.id,
      label: `${chalk.bold(level.name)}: ${level.title} ${status}`,
    };
  });

  options.push({
    value: 'progress',
    label: chalk.yellow('📊 View Progress & Achievements'),
  });

  options.push({
    value: 'exit',
    label: chalk.red('Exit tutorial'),
  });

  return await ui.prompt.select({
    message: 'Select a level:',
    options,
  });
}

async function runTutorial(level, tutorialIndex) {
  const tutorial = level.tutorials[tutorialIndex];
  const theme = getTheme();

  console.log();
  console.log(chalk.bold.cyan(tutorial.name));
  console.log(chalk.dim(tutorial.description));
  console.log();

  for (let i = 0; i < tutorial.steps.length; i++) {
    const step = tutorial.steps[i];
    console.log(chalk.bold.yellow(`Step ${i + 1}/${tutorial.steps.length}: ${step.text}`));
    
    if (step.cmd) {
      console.log(chalk.gray(`  $ ${step.cmd}`));
    }
    
    if (step.explanation) {
      console.log(chalk.dim(`  ${step.explanation}`));
    }
    
    if (step.tip) {
      console.log(chalk.cyan(`  💡 Tip: ${step.tip}`));
    }
    
    console.log();

    if (i < tutorial.steps.length - 1) {
      const continueTutorial = await ui.prompt.confirm({
        message: 'Continue to next step?',
        initialValue: true,
      });

      if (!continueTutorial) {
        return false;
      }
      console.log();
    }
  }

  return true;
}

async function runQuiz(level) {
  console.log();
  console.log(chalk.bold.cyan('📝 Quiz Time!'));
  console.log(chalk.dim('Test your understanding'));
  console.log();

  let correct = 0;
  for (let i = 0; i < level.quiz.length; i++) {
    const question = level.quiz[i];
    const options = question.options.map((opt, idx) => ({
      value: idx,
      label: opt,
    }));

    const answer = await ui.prompt.select({
      message: `${i + 1}. ${question.question}`,
      options,
    });

    if (answer === question.correct) {
      console.log(chalk.green('  ✓ Correct!'));
      correct++;
    } else {
      console.log(chalk.red(`  ✗ Incorrect. Correct answer: ${question.options[question.correct]}`));
    }
    console.log();
  }

  const percentage = Math.round((correct / level.quiz.length) * 100);
  console.log(chalk.bold(`Score: ${correct}/${level.quiz.length} (${percentage}%)`));
  
  return percentage >= 70; // Pass if 70% or higher
}

async function showProgress(progress) {
  const percentage = calculateProgress(progress);
  const theme = getTheme();

  console.log();
  console.log(chalk.bold.cyan('📊 Your Progress'));
  console.log();
  console.log(`  Level: ${chalk.bold(progress.level)}/4`);
  console.log(`  Progress: ${drawProgressBar(percentage)} ${percentage}%`);
  console.log(`  XP: ${chalk.yellow(progress.xp)}`);
  console.log(`  Streak: ${chalk.cyan(progress.streak)} days`);
  console.log();

  if (progress.badges.length > 0) {
    console.log(chalk.bold('🏆 Badges:'));
    for (const badge of progress.badges) {
      console.log(`  ${badge}`);
    }
    console.log();
  }

  console.log(chalk.dim('Press Enter to continue...'));
  await ui.prompt.text({ message: '' });
}

module.exports = async (_args) => {
  requireTTY('Tutorial requires interactive mode');

  showBanner('GITTABLE', { version: VERSION });
  console.log();
  console.log(chalk.bold.cyan('🎮 Gamified Tutorial System'));
  console.log(chalk.dim('Learn Git workflows with Gittable - Level by Level'));
  console.log();

  let progress = getTutorialProgress();
  const today = new Date().toDateString();
  
  // Update streak
  if (progress.lastPlayed === today) {
    // Already played today, no streak update
  } else if (progress.lastPlayed) {
    const lastDate = new Date(progress.lastPlayed);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      progress.streak++;
    } else {
      progress.streak = 1;
    }
  } else {
    progress.streak = 1;
  }
  progress.lastPlayed = today;

  while (true) {
    const selected = await showLevelMenu(progress);

    if (selected === null || selected === 'exit') {
      saveTutorialProgress(progress);
      return;
    }

    if (selected === 'progress') {
      await showProgress(progress);
      continue;
    }

    const level = LEVELS.find((l) => l.id === selected);
    if (!level) continue;

    const isUnlocked = level.id === 1 || progress.completedLevels.includes(level.id - 1);
    if (!isUnlocked) {
      ui.warn(`Level ${level.id} is locked. Complete Level ${level.id - 1} first.`);
      continue;
    }

    console.log();
    console.log(chalk.bold.cyan(`Level ${level.id}: ${level.title}`));
    console.log(chalk.dim(level.description));
    console.log();
    console.log(chalk.bold('Concepts:'));
    for (const concept of level.concepts) {
      console.log(chalk.dim(`  • ${concept}`));
    }
    console.log();

    // Select tutorial
    const tutorialOptions = level.tutorials.map((t, idx) => ({
      value: idx,
      label: `${t.name} - ${chalk.dim(t.description)}`,
    }));
    tutorialOptions.push({ value: 'back', label: chalk.gray('← Back to levels') });

    const tutorialIndex = await ui.prompt.select({
      message: 'Select a tutorial:',
      options: tutorialOptions,
    });

    if (tutorialIndex === 'back' || tutorialIndex === null) {
      continue;
    }

    // Run tutorial
    const completed = await runTutorial(level, tutorialIndex);
    if (!completed) continue;

    // Run quiz
    const passed = await runQuiz(level);
    if (!passed) {
      console.log(chalk.yellow('You need 70% to pass. Try again!'));
      continue;
    }

    // Complete level
    if (!progress.completedLevels.includes(level.id)) {
      progress.completedLevels.push(level.id);
      progress.xp += level.xpReward;
      progress.badges.push(level.badge);
      progress.level = Math.min(4, level.id + 1);

      console.log();
      console.log(chalk.green.bold(`🎉 Level ${level.id} Complete!`));
      console.log(chalk.yellow(`+${level.xpReward} XP`));
      console.log(chalk.cyan(`Badge unlocked: ${level.badge}`));
      console.log();

      if (level.id < 4) {
        console.log(chalk.cyan(`Level ${level.id + 1} is now unlocked!`));
      } else {
        console.log(chalk.green.bold('🏆 Congratulations! You\'ve completed all levels!'));
      }
      console.log();
    }

    saveTutorialProgress(progress);
  }
};
