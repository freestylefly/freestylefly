#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const OWNER = "freestylefly";
const README_PATH = "README.md";
const START_MARKER = "<!-- AI_PROJECTS:START -->";
const END_MARKER = "<!-- AI_PROJECTS:END -->";

const projects = [
  {
    name: "awesome-gpt-image-2",
    description:
      "Prompt as Code for GPT-Image2, with reverse-engineered cases and production-ready prompt templates.",
  },
  {
    name: "openclaw-wechat",
    description:
      "A bridge that helps OpenClaw-style agents connect to personal WeChat more reliably.",
  },
  {
    name: "director_ai",
    description:
      "AI comic and video creation app for scripts, storyboards, and generated video.",
  },
  {
    name: "mcp-server-weread",
    description: "A WeRead MCP server that brings reading data into agent workflows.",
  },
  {
    name: "canghe-skills",
    description:
      "A growing Skills collection for agent productivity, content automation, and daily AI workflows.",
  },
  {
    name: "openclaw-stock-kb",
    description: "A quantitative investing knowledge base for OpenClaw agents.",
  },
  {
    name: "xiaohongshu-skills",
    description: "RedNote visual content Skills powered by image models.",
  },
  {
    name: "wechat-article-extractor-skill",
    description: "A Skill for extracting article content and metadata from WeChat URLs.",
  },
  {
    name: "aizaobao",
    description: "Daily AI tech briefing pipeline with text and voice generation.",
  },
  {
    name: "12306-mcp",
    description: "An MCP server for China Railway ticket search workflows.",
  },
  {
    name: "CodexGuide",
    description: "An open-source Codex guide and knowledge base for Chinese developers.",
  },
  {
    name: "doubao-image-process",
    description: "A Doubao API-based image analysis and streaming chat tool.",
  },
  {
    name: "cursor-custom-agents-rules-generator",
    description: "A generator for Cursor rules and custom AI coding workflows.",
  },
  {
    name: "obclaw",
    description: "An AI-powered Obsidian assistant for notes, knowledge capture, and personal workflows.",
  },
  {
    name: "obsidian-content-remix",
    description: "An Obsidian plugin that remixes notes into platform-native content with AI models.",
  },
  {
    name: "third-image-skill",
    description: "A third-party image generation Skill for AI visual workflows.",
  },
  {
    name: "fullstack-website-builder-skill",
    description: "A Skill that turns a one-line idea into a full-stack website scaffold.",
  },
  {
    name: "glm_image_platform",
    description: "A GLM-Image generation platform for AI image experiments.",
  },
];

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "freestylefly-profile-readme-updater",
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function escapePipes(value) {
  return String(value).replaceAll("|", "\\|");
}

async function fetchRepo(project) {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${project.name}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${project.name}: ${response.status} ${response.statusText}`);
  }

  const repo = await response.json();

  return {
    ...project,
    url: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updated: repo.pushed_at || repo.updated_at,
    archived: repo.archived,
    fork: repo.fork,
    visibility: repo.visibility,
  };
}

function renderCards(repos) {
  const topRepos = repos.slice(0, 6);
  const rows = [];

  for (let index = 0; index < topRepos.length; index += 2) {
    const cells = topRepos.slice(index, index + 2).map((repo) => {
      return [
        '<td width="50%" valign="top">',
        `  <a href="${repo.url}"><strong>${repo.name}</strong></a><br>`,
        `  <sub>${repo.description}</sub><br><br>`,
        `  <sub>Stars: <strong>${formatNumber(repo.stars)}</strong> · Forks: <strong>${formatNumber(
          repo.forks,
        )}</strong> · Updated: <strong>${formatDate(repo.updated)}</strong></sub>`,
        "</td>",
      ].join("\n");
    });

    if (cells.length === 1) {
      cells.push('<td width="50%" valign="top"></td>');
    }

    rows.push(["<tr>", ...cells, "</tr>"].join("\n"));
  }

  return ["<table>", ...rows, "</table>"].join("\n");
}

function renderTable(repos) {
  const lines = [
    "| Project | Description | Stars | Forks | Updated |",
    "| --- | --- | ---: | ---: | --- |",
  ];

  for (const repo of repos) {
    lines.push(
      `| [${repo.name}](${repo.url}) | ${escapePipes(repo.description)} | ${formatNumber(
        repo.stars,
      )} | ${formatNumber(repo.forks)} | ${formatDate(repo.updated)} |`,
    );
  }

  return lines.join("\n");
}

function renderSection(repos) {
  return [
    "Public AI-related repositories, ordered by GitHub stars. Metrics are generated from the GitHub API and refreshed automatically.",
    "",
    "### Featured Gallery",
    "",
    renderCards(repos),
    "",
    "### Full List",
    "",
    renderTable(repos),
  ].join("\n");
}

async function main() {
  const repos = await Promise.all(projects.map(fetchRepo));
  const visibleRepos = repos
    .filter((repo) => repo.visibility === "public" && !repo.archived && !repo.fork)
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));

  const readme = await readFile(README_PATH, "utf8");
  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README must contain ${START_MARKER} and ${END_MARKER}`);
  }

  const nextReadme = [
    readme.slice(0, start + START_MARKER.length),
    "\n",
    renderSection(visibleRepos),
    "\n",
    readme.slice(end),
  ].join("");

  await writeFile(README_PATH, nextReadme);
  console.log(`Updated ${README_PATH} with ${visibleRepos.length} AI projects.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
