/**
 * Compare two template versions and generate a migration report
 * @param {Object} oldConfig - Current user's template config
 * @param {Object} newConfig - New template version config
 * @param {String} oldVersion - Current version
 * @param {String} newVersion - New version
 * @returns {Object} Migration report with changes and required actions
 */
const compareTemplateVersions = (
  oldConfig,
  newConfig,
  oldVersion,
  newVersion
) => {
  const changes = [];

  // Compare pages
  const oldPages = new Map(oldConfig.pages?.map((p) => [p.id, p]) || []);
  const newPages = new Map(newConfig.pages?.map((p) => [p.id, p]) || []);

  // Check for new pages
  for (const [id, page] of newPages) {
    if (!oldPages.has(id)) {
      changes.push({
        type: "added",
        category: "page",
        path: `pages.${id}`,
        description: `New page added: "${page.title}" (${page.slug})`,
        requiresAction: true,
        actionDescription: "Review and customize the new page content",
      });
    }
  }

  // Check for removed pages
  for (const [id, page] of oldPages) {
    if (!newPages.has(id)) {
      changes.push({
        type: "removed",
        category: "page",
        path: `pages.${id}`,
        description: `Page removed: "${page.title}" (${page.slug})`,
        requiresAction: true,
        actionDescription:
          "Your custom content for this page will be preserved but page is no longer in template",
      });
    }
  }

  // Check for modified pages (section changes)
  for (const [id, newPage] of newPages) {
    const oldPage = oldPages.get(id);
    if (oldPage) {
      const sectionChanges = compareSections(
        oldPage.sections || [],
        newPage.sections || [],
        id
      );
      changes.push(...sectionChanges);
    }
  }

  // Compare theme
  const themeChanges = compareTheme(oldConfig.theme, newConfig.theme);
  changes.push(...themeChanges);

  // Compare navigation
  const navChanges = compareNavigation(
    oldConfig.navigation,
    newConfig.navigation
  );
  changes.push(...navChanges);

  return {
    fromVersion: oldVersion,
    toVersion: newVersion,
    totalChanges: changes.length,
    changesRequiringAction: changes.filter((c) => c.requiresAction).length,
    changes,
  };
};

/**
 * Compare sections between old and new page
 */
const compareSections = (oldSections, newSections, pageId) => {
  const changes = [];
  const oldMap = new Map(oldSections.map((s) => [s.id, s]));
  const newMap = new Map(newSections.map((s) => [s.id, s]));

  for (const [id, section] of newMap) {
    if (!oldMap.has(id)) {
      changes.push({
        type: "added",
        category: "section",
        path: `pages.${pageId}.sections.${id}`,
        description: `New section added: "${section.type}"`,
        requiresAction: true,
        actionDescription: "Configure the new section with your content",
      });
    }
  }

  for (const [id, section] of oldMap) {
    if (!newMap.has(id)) {
      changes.push({
        type: "removed",
        category: "section",
        path: `pages.${pageId}.sections.${id}`,
        description: `Section removed: "${section.type}"`,
        requiresAction: false,
        actionDescription: "Your custom content will be preserved",
      });
    }
  }

  return changes;
};

/**
 * Compare theme settings
 */
const compareTheme = (oldTheme, newTheme) => {
  const changes = [];

  if (!oldTheme || !newTheme) return changes;

  // Check for new theme properties
  const newColors = Object.keys(newTheme.color || {});
  const oldColors = Object.keys(oldTheme.color || {});

  const addedColors = newColors.filter((c) => !oldColors.includes(c));
  if (addedColors.length > 0) {
    changes.push({
      type: "added",
      category: "theme",
      path: "theme.color",
      description: `New color options: ${addedColors.join(", ")}`,
      requiresAction: false,
      actionDescription: "Optional: customize the new color settings",
    });
  }

  if (newTheme.font !== oldTheme.font) {
    changes.push({
      type: "modified",
      category: "theme",
      path: "theme.font",
      description: `Font changed from "${oldTheme.font}" to "${newTheme.font}"`,
      requiresAction: true,
      actionDescription:
        "Review if you want to keep your current font or adopt the new one",
    });
  }

  return changes;
};

/**
 * Compare navigation items
 */
const compareNavigation = (oldNav, newNav) => {
  const changes = [];

  if (!oldNav || !newNav) return changes;

  const oldHrefs = new Set(oldNav.map((n) => n.href));
  const newHrefs = new Set(newNav.map((n) => n.href));

  for (const item of newNav) {
    if (!oldHrefs.has(item.href)) {
      changes.push({
        type: "added",
        category: "navigation",
        path: `navigation.${item.href}`,
        description: `New navigation item: "${item.label}"`,
        requiresAction: true,
        actionDescription: "Decide if you want to include this navigation item",
      });
    }
  }

  return changes;
};

/**
 * Apply migration to user's site config
 * Merges new template features while preserving user customizations
 */
const applyMigration = (userConfig, newTemplateConfig, migrationReport) => {
  const migratedConfig = JSON.parse(JSON.stringify(userConfig));

  for (const change of migrationReport.changes) {
    if (change.type === "added") {
      // Add new items from template
      switch (change.category) {
        case "page":
          const newPage = newTemplateConfig.pages.find((p) =>
            change.path.includes(p.id)
          );
          if (
            newPage &&
            !migratedConfig.pages.find((p) => p.id === newPage.id)
          ) {
            migratedConfig.pages.push({ ...newPage, _isNew: true });
          }
          break;
        case "section":
          // Parse path to find page and section
          const pathParts = change.path.split(".");
          const pageId = pathParts[1];
          const sectionId = pathParts[3];
          const templatePage = newTemplateConfig.pages.find(
            (p) => p.id === pageId
          );
          const userPage = migratedConfig.pages.find((p) => p.id === pageId);
          if (templatePage && userPage) {
            const newSection = templatePage.sections.find(
              (s) => s.id === sectionId
            );
            if (
              newSection &&
              !userPage.sections.find((s) => s.id === sectionId)
            ) {
              userPage.sections.push({ ...newSection, _isNew: true });
            }
          }
          break;
        case "theme":
          // Merge new theme properties
          if (newTemplateConfig.theme?.color) {
            migratedConfig.theme = migratedConfig.theme || {};
            migratedConfig.theme.color = {
              ...newTemplateConfig.theme.color,
              ...migratedConfig.theme.color,
            };
          }
          break;
      }
    }
  }

  return migratedConfig;
};

module.exports = {
  compareTemplateVersions,
  applyMigration,
};
