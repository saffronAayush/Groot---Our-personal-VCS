# 🌱Groot — A Lightweight Git-like Version Control System

**Groot** is a minimalist, CLI-based version control system built with **Node.js**, inspired by Git. It allows you to track file changes, manage commits, view diffs, and more — all while keeping things educational and simple.

## Features

- Track changes to files
- Stage and commit updates
- View commit logs
- See diffs between file versions
- Minimal and easy to understand

## Installation

**Prerequisite:** Make sure [Node.js](https://nodejs.org) is installed on your system.

### Step 1: Clone the Repository

```bash
git clone https://github.com/saffronAayush/Groot---Our-personal-VCS
```

### Step 2: Navigate to the Project Directory and Install Dependencies

```bash
cd groot
npm install
```

### Step 3: Install Globally

```bash
npm install -g
```

## Initialization and Usage

### Initialize Groot in a Directory

```bash
groot init
```

### View All Available Commands

```bash
groot
```

## Command Reference

| Command                         | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `groot add <filename>`          | Adds a file to the staging area (similar to `git add`).                  |
| `groot commit "<your message>"` | Commits all staged files with a message.                                 |
| `groot log`                     | Displays a list of previous commits with timestamps and messages.        |
| `groot show <commit-hash>`      | Shows line-by-line differences between a specific commit and its parent. |

## Built With

- [Node.js](https://nodejs.org/)
- [Commander](https://www.npmjs.com/package/commander) — CLI command handling
- [Chalk](https://www.npmjs.com/package/chalk) — Stylish terminal output

## Author

**Aayush Soni**

Feel free to fork, star, or contribute to the project.  
Pull requests and suggestions are welcome.
