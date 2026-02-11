const { v4: uuidv4 } = require("uuid");

/**
 * Generate a URL-friendly unique site ID
 * Format: name-slug + random suffix
 */
const generateSiteId = (name) => {
  // Convert name to URL-friendly slug
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .substring(0, 30); // Limit length

  // Add random suffix
  const suffix = uuidv4().slice(0, 8);

  return `${slug}-${suffix}`;
};

module.exports = generateSiteId;
