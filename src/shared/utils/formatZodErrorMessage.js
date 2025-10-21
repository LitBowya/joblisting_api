// utils/formatZodErrorMessage.js
export const formatZodErrorMessage = (error) => {
  if (!error?.issues || error.issues.length === 0)
    return "Invalid input.";

  // Build a single readable message
  const messages = error.issues.map((issue) => {
    const field = issue.path.join('.');
    return field ? `${field}: ${issue.message}` : issue.message;
  });

  // Join all messages into one line (customizable)
  return messages.join('\n');
};
