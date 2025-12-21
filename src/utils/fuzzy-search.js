/**
 * Fuzzy Search Utilities
 * Provides fuzzy matching and similarity scoring for command search
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score (0-1, higher is more similar)
 */
function similarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Check if query matches string (fuzzy match)
 */
function fuzzyMatch(query, text) {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) {
    return { match: true, score: 1.0 };
  }

  // Starts with gets high score
  if (textLower.startsWith(queryLower)) {
    return { match: true, score: 0.9 };
  }

  // Contains gets medium score
  if (textLower.includes(queryLower)) {
    return { match: true, score: 0.7 };
  }

  // Fuzzy match using similarity
  const score = similarityScore(queryLower, textLower);
  if (score > 0.5) {
    return { match: true, score };
  }

  return { match: false, score: 0 };
}

/**
 * Fuzzy search commands by name, alias, or description
 * Returns sorted by relevance (most similar first)
 */
function fuzzySearchCommands(commands, query) {
  const results = commands
    .map((cmd) => {
      let maxScore = 0;
      let matchType = 'none';

      // Check name
      const nameMatch = fuzzyMatch(query, cmd.name);
      if (nameMatch.match && nameMatch.score > maxScore) {
        maxScore = nameMatch.score;
        matchType = 'name';
      }

      // Check aliases
      for (const alias of cmd.aliases) {
        const aliasMatch = fuzzyMatch(query, alias);
        if (aliasMatch.match && aliasMatch.score > maxScore) {
          maxScore = aliasMatch.score;
          matchType = 'alias';
        }
      }

      // Check description
      const descMatch = fuzzyMatch(query, cmd.description);
      if (descMatch.match && descMatch.score > maxScore) {
        maxScore = descMatch.score;
        matchType = 'description';
      }

      return {
        command: cmd,
        score: maxScore,
        matchType,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      // Sort by score (highest first)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If same score, prefer name matches, then alias, then description
      const typeOrder = { name: 3, alias: 2, description: 1, none: 0 };
      return typeOrder[b.matchType] - typeOrder[a.matchType];
    })
    .map((result) => result.command);

  return results;
}

module.exports = {
  fuzzySearchCommands,
  similarityScore,
  fuzzyMatch,
};
