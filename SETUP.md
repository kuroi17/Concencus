# Student Hub (React + Tailwind)

Centralized student web app starter for hackathon development.

## Tech Stack

- React + Vite
- Tailwind CSS
- ESLint

## Prerequisites

Required:

- Node.js 20+ (LTS recommended)
- npm is included automatically when you install Node.js.
- A modern browser (Chrome, Edge, Firefox)

Install Node.js first (if not yet installed):

1. Download and install Node.js LTS from [nodejs.org](https://nodejs.org/).
2. Open a new terminal and run:

```bash
node -v
npm -v
```

If both commands print versions, the machine is ready.

## First-Time Setup

Clone and install dependencies:

```bash
git clone <your-repo-url>
cd Concencus
npm install
```

If you downloaded ZIP instead of git clone, just open terminal inside the project folder and run:

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Optional checks:

```bash
npm run lint
npm run build
```

Open the local URL shown in terminal (usually http://localhost:5173) in any modern browser.

## Quick Start (First Timers)

1. Install Node.js LTS from [nodejs.org](https://nodejs.org/).
2. Install Git (optional if you will use ZIP download).
3. Clone this repository.
4. Open terminal in the project folder.
5. Run `npm install`.
6. Run `npm run dev`.
7. Open the local URL in browser.

## Project Flow (Pages and Components)

Routing is already configured.

Ang gagalawin na lang ng bawat member ay yung assigned folder nila sa `src/components`:

- `AnnouncementComponents`
- `ChatComponents`
- `ForumComponents`

Current structure:

```text
src/
|-- pages/
|   |-- AnnouncementPage.jsx
|   |-- ChatPage.jsx
|   `-- ForumPage.jsx
|
`-- components/
    |-- AnnouncementComponents/
    |-- ChatComponents/
    `-- ForumComponents/
```

How the flow works:

1. `App.jsx` routes users to a page file inside `src/pages`.
2. Each page file should render UI from its matching folder in `src/components`.
3. Build feature UI inside the assigned components folder.

Example mapping:

- `AnnouncementPage.jsx` -> `components/AnnouncementComponents/`
- `ChatPage.jsx` -> `components/ChatComponents/`
- `ForumPage.jsx` -> `components/ForumComponents/`

## What Each Member Should Edit

Default rule for contributors:

- Work only inside your assigned folder under `src/components`.
- Do not change app-level routing in `src/App.jsx` unless the lead asks.
- Keep page ownership clear.
- Announcement member: `src/components/AnnouncementComponents/`
- Chat member: `src/components/ChatComponents/`
- Forum member: `src/components/ForumComponents/`

If needed, page files in `src/pages` can be updated only to import and render components from the correct folder.

## How To Start Contributing

Rules:

- Do not push directly to main.
- Always create and work on your own branch.
- Keep branch names clear.

Suggested branch format:

```bash
git checkout main
git pull origin main
git checkout -b <pageImplementation>-<yourName>
```

Examples:

- `announcementpage-jane`
- `chatpage-mike`
- `forumpage-alex`

After creating your branch, start coding.

## How To Push Your Work

Before pushing, sync with latest main first:

```bash
git checkout main
git pull origin main
git checkout <pageImplementation>-<yourName>
git merge main
```

Then commit and push your branch:

```bash
git add .
git commit -m "<your message>"
git push -u origin <pageImplementation>-<yourName>
```

## Create Pull Request

After push, open GitHub and create a Pull Request:

1. Base branch: `main`
2. Compare branch: your feature branch
3. Add clear title and description
4. Request review from teammates

Once approved, the owner will merge your Pull Request.
