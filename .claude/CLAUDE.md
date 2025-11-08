不確かである答えはわからないと答えて

# Guidelines

This document defines the project's rules, objectives, and progress management methods. Please proceed with the project according to the following content.

## Top-Level Rules

- To maximize efficiency, **if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially**.
- **You must think exclusively in English**. However, you are required to **respond in Japanese**.

## Project Rules

- Follow the rules below for writing code comments and documentation:
  - **Documentation** such as JSDoc and Docstrings must be written in **English**.
  - **Comments embedded within the code**, such as descriptions for Vitest or zod-openapi, must be written in **English**.
  - **Code comments** that describe the background or reasoning behind the implementation should be written in **Japanese**.
  - **Do not use emojis**.
- When writing Japanese, do not include unnecessary spaces.
  - for example
    - ◯ "Claude Code 入門"
    - × "Claude Code 入門"
- To understand how to use a library, **always use the Contex7 MCP** to retrieve the latest information.
- When searching for hidden folders like `.tmp`, the `List` tool is unlikely to find them. **Use the `Bash` tool to find hidden folders**.
- **You must send a notification upon task completion.**
  - "Task completion" refers to the state immediately after you have finished responding to the user and are awaiting their next input.
  - **A notification is required even for minor tasks** like format correction, refactoring, or documentation updates.
  - Use the following format and `osascript` to send notifications:
    - `osascript -e 'display notification "${TASK_DESCRIPTION} is complete" with title "${REPOSITORY_NAME}"'`
    - `${TASK_DESCRIPTION}` should be a summary of the task, and `${REPOSITORY_NAME}` should be the repository name.

## Project Objectives

### Development Style

- **Requirements and design for each task must be documented in `.tmp/design.md`**.
- **Detailed sub-tasks for each main task must be defined in `.tmp/task.md`**.
- **You must update `.tmp/task.md` as you make progress on your work.**

1.  First, create a plan and document the requirements in `.tmp/design.md`.
2.  Based on the requirements, identify all necessary tasks and list them in a Markdown file at `.tmp/task.md`.
3.  Once the plan is established, create a new branch and begin your work.
    - Branch names should start with `feature/` followed by a brief summary of the task.
4.  Break down tasks into small, manageable units that can be completed within a single commit.
5.  Create a checklist for each task to manage its progress.
6.  Always apply a code formatter to maintain readability.
7.  Do not commit your changes. Instead, ask for confirmation.
8.  When instructed to create a Pull Request (PR), use the following format:
    - **Title**: A brief summary of the task.
    - **Key Changes**: Describe the changes, points of caution, etc.
    - **Testing**: Specify which tests passed, which tests were added, and clearly state how to run the tests.
    - **Related Tasks**: Provide links or numbers for related tasks.
    - **Other**: Include any other special notes or relevant information.
