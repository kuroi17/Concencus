# Student Hub (React + Tailwind)

Centralized student web app starter for hackathon development.

## Tech Stack

- React + Vite
- Tailwind CSS
- ESLint

## Prerequisites (For Collaborators)

Required:

- Node.js 20+ (LTS recommended)
	- npm is included automatically when you install Node.js.
- A modern browser (Chrome, Edge, Firefox)

Needed to clone the repo:

- Git (or you can download ZIP from GitHub if Git is not installed)

Optional but recommended:

- VS Code

Important:

- You do not install React or Tailwind globally.
- You do not need a Python `requirements.txt` for this project.
- `npm install` reads `package.json` and installs all project dependencies automatically.

Install Node.js first (if not yet installed):

1. Download and install Node.js LTS from [nodejs.org](https://nodejs.org/).
2. Open a new terminal and run:

```bash
node -v
npm -v
```

If both commands print versions, the machine is ready.

## First-Time Setup

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Other Useful Commands

```bash
npm run build
npm run preview
npm run lint
```

## For Collaborators

For React/Node projects, you do not use `requirements.txt`.

Dependency management is handled by:

- `package.json` (declares dependencies)
- `package-lock.json` (locks exact versions)

When teammates clone the repo, they just run:

```bash
npm install
```

Then start the app:

```bash
npm run dev
```

Open the local URL shown in terminal (usually http://localhost:5173) in any modern browser.
Google Chrome is optional, not required.

## Quick Start (First Timers)

1. Install Node.js LTS from [nodejs.org](https://nodejs.org/).
2. Install Git (optional if you will use ZIP download).
3. Clone this repository.
4. Open terminal in the project folder.
5. Run `npm install`.
6. Run `npm run dev`.
7. Open the local URL in browser.

## Common Questions

Do I need to install ReactJS separately?

- No. React is installed from `package.json` when you run `npm install`.

Do I need to install Tailwind CSS separately?

- No. Tailwind is already configured in this repo and is installed by `npm install`.

Do I need Google Chrome?

- No. Any modern browser is fine.
