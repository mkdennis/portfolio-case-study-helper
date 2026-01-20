import { Octokit } from "@octokit/rest";

export function createOctokit(accessToken: string) {
  return new Octokit({
    auth: accessToken,
  });
}

// Get GitHub config from environment variables (for personal use without OAuth)
export function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error(
      "Missing GitHub configuration. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env.local"
    );
  }

  return { token, owner, repo };
}

// Create Octokit instance using env config
export function getDefaultOctokit() {
  const { token } = getGitHubConfig();
  return createOctokit(token);
}

// Repository operations
export async function getAuthenticatedUser(octokit: Octokit) {
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export async function getUserRepos(octokit: Octokit) {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });
  return data;
}

export async function checkRepoExists(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    await octokit.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}

export async function createRepo(
  octokit: Octokit,
  name: string,
  description: string = "My design journal powered by Case Study Companion"
) {
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: true,
    auto_init: true,
  });
  return data;
}

// File operations
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ("content" in data && data.type === "file") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { content, sha: data.sha };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
  return data;
}

export async function deleteFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string
) {
  const { data } = await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
  });
  return data;
}

export async function getDirectoryContents(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<Array<{ name: string; path: string; type: string; sha: string }>> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// Initialize repository with folder structure
export async function initializeRepoStructure(
  octokit: Octokit,
  owner: string,
  repo: string,
  username: string
) {
  const config = {
    version: "1.0",
    user: {
      githubUsername: username,
      preferences: {
        defaultTone: "balanced",
        journalReminders: false,
        autoSuggestAssetNames: true,
      },
    },
    app: {
      repoName: repo,
      createdAt: new Date().toISOString(),
    },
  };

  // Create config file
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    ".casestudy/config.json",
    JSON.stringify(config, null, 2),
    "Initialize Case Study Companion"
  );

  // Create README
  const readme = `# Design Journal

This repository is managed by [Case Study Companion](https://casestudycompanion.app).

## Structure

- \`.casestudy/\` - App configuration
- \`projects/\` - Your design projects and journal entries

## Projects

Your projects will appear here as you create them.
`;

  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    "README.md",
    readme,
    "Add README"
  );

  // Create projects directory placeholder
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    "projects/.gitkeep",
    "",
    "Create projects directory"
  );

  return config;
}

// Project-specific operations
export async function createProjectStructure<T extends { name?: string }>(
  octokit: Octokit,
  owner: string,
  repo: string,
  projectSlug: string,
  metadata: T
) {
  // Create project meta.json
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    `projects/${projectSlug}/meta.json`,
    JSON.stringify(metadata, null, 2),
    `Create project: ${metadata.name || projectSlug}`
  );

  // Create journal directory
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    `projects/${projectSlug}/journal/.gitkeep`,
    "",
    "Create journal directory"
  );

  // Create assets directory
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    `projects/${projectSlug}/assets/.gitkeep`,
    "",
    "Create assets directory"
  );

  // Create assets metadata directory
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    `projects/${projectSlug}/assets/.metadata/.gitkeep`,
    "",
    "Create asset metadata directory"
  );

  // Create generated directory
  await createOrUpdateFile(
    octokit,
    owner,
    repo,
    `projects/${projectSlug}/generated/.gitkeep`,
    "",
    "Create generated directory"
  );

  return true;
}

// Upload binary file (for images)
export async function uploadBinaryFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: ArrayBuffer,
  message: string
) {
  const base64Content = Buffer.from(content).toString("base64");

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: base64Content,
  });

  return data;
}
