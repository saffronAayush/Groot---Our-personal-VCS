#!/usr/bin/env node

import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { diffLines } from "diff";
import chalk from "chalk";
import { Command } from "commander";

const program = new Command();

class Groot {
  constructor(repoPath = ".") {
    this.repoPath = path.join(repoPath, ".groot");
    this.objectsPath = path.join(this.repoPath, "objects");
    this.headPath = path.join(this.repoPath, "HEAD");
    this.indexPath = path.join(this.repoPath, "index");
  }

  async init() {
    await fs.mkdir(this.objectsPath, { recursive: true }); // if you make the directory in another directory and the outer dire. is not avail, then recursive:true will make the outer direc. first then create the inner one, without it this code will throw an error

    try {
      await fs.writeFile(this.headPath, "", { flag: "wx" });
      await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: "wx" });
      console.log("Groot initialized succesfully");
    } catch (error) {
      console.log("Already initialized the .grood folder");
    }
  }

  hashObject(content) {
    return crypto.createHash("sha1").update(content, "utf-8").digest("hex");
  }

  async add(fileToBeAdded) {
    const fileData = await fs.readFile(fileToBeAdded, { encoding: "utf-8" });
    const fileHash = this.hashObject(fileData);

    const newFileHashedObjectPath = path.join(this.objectsPath, fileHash);
    await fs.writeFile(newFileHashedObjectPath, fileData);

    await this.updateStagingArea(fileToBeAdded, fileHash);
    console.log(`Added ${fileToBeAdded}`);
  }

  async updateStagingArea(filePath, fileHash) {
    try {
      const indexData = await fs.readFile(this.indexPath, {
        encoding: "utf-8",
      });
      const index = JSON.parse(indexData);

      const fileIndex = index.findIndex((entry) => entry.path === filePath);

      if (fileIndex !== -1) {
        index[fileIndex].hash = fileHash;
      } else {
        index.push({ path: filePath, hash: fileHash });
      }

      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } catch (err) {
      console.error(`Error updating staging area: ${err.message}`);
      throw err;
    }
  }

  async commit(message) {
    const index = JSON.parse(
      await fs.readFile(this.indexPath, { encoding: "utf-8" })
    );

    if (index.length <= 0) {
      console.log(
        "nothing to commit, use add <file name> command first to stage the files to commit"
      );
      return;
    }

    const parrentCommit = await this.getCurrentHead();

    const commitData = {
      timeStamp: new Date().toISOString(),
      message,
      files: index,
      parent: parrentCommit,
    };

    const commitHash = this.hashObject(JSON.stringify(commitData));
    const commitPath = path.join(this.objectsPath, commitHash);
    await fs.writeFile(commitPath, JSON.stringify(commitData));
    await fs.writeFile(this.headPath, commitHash);
    await fs.writeFile(this.indexPath, "[]");
    console.log("Commit successfully created: ", commitHash);
  }

  async getCurrentHead() {
    try {
      return await fs.readFile(this.headPath, { encoding: "utf-8" });
    } catch (error) {
      return null;
    }
  }

  async log() {
    let currenCommitHash = await this.getCurrentHead();
    while (currenCommitHash && currenCommitHash?.length) {
      const commitData = JSON.parse(
        await fs.readFile(path.join(this.objectsPath, currenCommitHash), {
          encoding: "utf-8",
        })
      );
      console.log(
        `Commit: ${currenCommitHash}\n Data: ${commitData.timeStamp}\n message: ${commitData.message}\n`
      );
      console.log("-------------------------------------------");
      currenCommitHash = commitData.parent;
    }
  }

  async showCommitDiff(commitHash) {
    const commitData = await this.getCommitData(commitHash);

    if (!commitData) {
      console.log("Commmit not found");
      return;
    }
    if (!commitData.parent || commitData.parent.length <= 0) {
      console.log(
        "This was the first commit, nothing to check with the parent"
      );
      return;
    }

    const parentCommitData = await this.getCommitData(commitData.parent);

    console.log("Changes in the last commit are:\n");
    // console.log("parent commit data: ", parentCommitData);

    for (const file of commitData.files) {
      console.log(`File: ${file.path}`);

      const fileContent = await this.getFileData(file.hash);
      // console.log("file content ", fileContent);
      const parentFileContent = await this.getParentFileContent(
        parentCommitData,
        file.path
      );
      // console.log("parent file ", parentFileContent);

      if (parentFileContent) {
        console.log("\nDiff:");
        const diff = diffLines(parentFileContent, fileContent);

        diff.forEach((part) => {
          if (part.added) {
            process.stdout.write(chalk.green("++" + part.value));
          } else if (part.removed) {
            process.stdout.write(chalk.red("--" + part.value));
          } else {
            process.stdout.write(chalk.gray(part.value));
          }
        });
        console.log("\n");
      } else console.log("New file in this commit");
    }
  }

  async getParentFileContent(parentCommitData, filePath) {
    const parentFile = parentCommitData.files.find(
      (file) => file.path === filePath
    );
    if (parentFile) {
      return await this.getFileData(parentFile.hash);
    }
    return null;
  }

  async getCommitData(commitHash) {
    try {
      return JSON.parse(
        await fs.readFile(path.join(this.objectsPath, commitHash), {
          encoding: "utf-8",
        })
      );
    } catch (error) {
      console.log("Failed to read the commit data", error);
      return null;
    }
  }
  async getFileData(fileHash) {
    // fileHash = JSON.stringify(fileHash);
    const filePath = path.join(this.objectsPath, fileHash);
    try {
      return await fs.readFile(filePath, {
        encoding: "utf-8",
      });
    } catch (error) {
      console.log("Failed to read the file data", error);
      return null;
    }
  }
}

program.command("init").action(async () => {
  const groot = new Groot();
  await groot.init();
});

program.command("add <file>").action(async (file) => {
  const groot = new Groot();
  await groot.add(file);
});

program.command("commit <message>").action(async (message) => {
  const groot = new Groot();
  await groot.commit(message);
});

program.command("log").action(async () => {
  const groot = new Groot();

  await groot.log();
});

program.command("show <commitHash>").action(async (commitHash) => {
  const groot = new Groot();

  await groot.showCommitDiff(commitHash);
});

program.parse(process.argv);
