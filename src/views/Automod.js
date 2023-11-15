// List of inappropriate words or phrases
const inappropriateWords = [
  "word1",
  "phrase2",
  "word3",
  // Add more inappropriate words or phrases as needed
];

// Object to keep track of user posts/comments count
const userPostsCount = {};

// Function to check if a post/comment contains inappropriate words
function checkForInappropriateContent(content) {
  for (const word of inappropriateWords) {
    if (content.includes(word)) {
      return true;
    }
  }
  return false;
}

// Function to handle user posts/comments
function handlePost(user, content) {
  const hasInappropriateContent = checkForInappropriateContent(content);
  
  if (hasInappropriateContent) {
    if (userPostsCount[user] && userPostsCount[user] >= 2) {
      // User has exceeded the limit, ban or timeout the user
      console.log(`User '${user}' has been banned or timed out.`);
      // Code to ban or timeout the user goes here
    } else {
      console.log(`Post/Comment by user '${user}' contains inappropriate content.`);
      // Code to flag the post or take necessary actions for review
    }
  } else {
    console.log(`Post/Comment by user '${user}' is approved.`);
    // Code to approve the post/comment
  }

  // Update the user's posts/comments count
  userPostsCount[user] = userPostsCount[user] ? userPostsCount[user] + 1 : 1;
}

// Example usage
handlePost("user1", "This is a normal post.");
handlePost("user2", "This post contains an inappropriate word.");
handlePost("user2", "This comment is even worse.");
handlePost("user1", "Another normal post.");
handlePost("user2", "Another inappropriate post.");

// Output
// Post/Comment by user 'user1' is approved.
// Post/Comment by user 'user2' contains inappropriate content.
// Post/Comment by user 'user2' contains inappropriate content.
// Post/Comment by user 'user1' is approved.
// User 'user2' has been banned or timed out.
