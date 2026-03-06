/**
 * Extract @mentions from text content
 * Matches patterns like @username, @user_name, @User123
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = text.match(mentionRegex);
  
  if (!matches) {
    return [];
  }

  // Remove the @ symbol and deduplicate
  const usernames = matches
    .map((match) => match.substring(1))
    .filter((username, index, arr) => arr.indexOf(username) === index);

  return usernames;
}

/**
 * Parse mentions and return with user info
 */
export async function parseMentionsWithUsers(text: string) {
  const { UserModel } = await import('../models/User.js');
  const mentions = extractMentions(text);
  const users = [];

  for (const username of mentions) {
    const user = await UserModel.findByUsername(username);
    if (user) {
      users.push({
        username: user.username,
        id: user.id,
        avatar_url: user.avatar_url,
      });
    }
  }

  return users;
}

/**
 * Replace @mentions with HTML links or markdown
 */
export function formatMentions(
  text: string,
  baseUrl: string = '/users'
): string {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  return text.replace(mentionRegex, (match, username) => {
    return `[${match}](${baseUrl}/${username})`;
  });
}
