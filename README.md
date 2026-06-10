# FlowTask - Personal Task Manager

FlowTask is a premium, glassmorphic Personal Task Manager built with React (Vite), Node.js (Express), TypeScript, SQLite, and Tailwind CSS. The project is organized as a single monorepo to streamline backend development, database storage, and front-end user experience in a cohesive workspace.

### 🚀 Deployed Links
- **Frontend Dashboard (Vercel):** [https://flow-task-tau.vercel.app](https://flow-task-tau.vercel.app)
- **Backend API Server (Render):** [https://flow-task-m38a.onrender.com](https://flow-task-m38a.onrender.com)

---

## ⚡ Tech Stack

- **Frontend Framework**: **React 19** with **Vite** & **TypeScript**
  - *Why*: React's functional component architecture and hooks offer modular, reactive UI states. Vite provides extremely fast HMR (Hot Module Replacement) and bundling.
- **Backend API**: **Node.js** with **Express** & **TypeScript**
  - *Why*: Node/Express is light, fast, and simple to set up. TypeScript provides build-time type-safety across backend handlers and frontend API requests.
- **Database**: **SQLite** (using the `sqlite` Promise-based wrapper and `sqlite3` driver)
  - *Why*: SQLite is a zero-configuration, file-based SQL database. It persists data across server restarts directly to a local file (`tasks.db`) without requiring an external database instance.
- **Styling**: **Tailwind CSS v4** & **Lucide React** (icons)
  - *Why*: Tailwind v4 offers a highly optimized, compiler-integrated CSS engine that makes creating custom themes, gradients, animations, and glassmorphic designs simple and clean.

---

## 📁 Project Structure

```
personal-task-manager/
├── client/                     # React + Vite Frontend
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── App.tsx             # Main dashboard UI, State, Drag & Drop
│   │   ├── index.css           # Tailwind v4 import & custom styles
│   │   └── main.tsx            # React entrypoint
│   ├── index.html              # Document wrapper & SEO meta tags
│   ├── package.json            # Client dependencies and build scripts
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.ts          # Vite configuration with Tailwind plugin
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── db.ts               # SQLite DB initialization & migrations
│   │   └── index.ts            # Express server routes & controllers
│   ├── package.json            # Server dependencies and runner scripts
│   └── tsconfig.json           # TypeScript compilation config
│
├── package.json                # Root package.json orchestrating workspaces
└── README.md                   # This project documentation
```

---

## 🚀 How to Run Locally

Follow these instructions to start the backend database server and the client dashboard together.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or later recommended)
- `npm` (usually pre-bundled with Node.js)

### Steps

1. **Clone or navigate to the project root**:
   ```bash
   cd personal-task-manager
   ```

2. **Run the Setup Script**:
   This script will install all dependencies for the root orchestrator, client, and server workspaces:
   ```bash
   npm run setup
   ```

3. **Start the Application in Development Mode**:
   Launch both the Express backend server (port 5000) and the React dev server (defaulting to port 5173) in parallel:
   ```bash
   npm run dev
   ```

4. **Access the Dashboard**:
   Open your browser and navigate to **`http://localhost:5173`**. The backend will be serving APIs on **`http://localhost:5000`**.

---

## 📡 API Documentation

All request payloads and response bodies are formatted as JSON.

### `GET /tasks`
Retrieves all tasks in the database.

- **Query Parameters**:
  - `sort` (optional): Set to `position` to sort tasks by their manually dragged custom order, or leave empty/set to `date` to sort by creation date (newest first).
- **Response Shape** (`200 OK`):
  ```json
  [
    {
      "id": 1,
      "title": "Create project design system",
      "description": "Establish theme values, dark mode colors, and font-families.",
      "dueDate": "2026-06-12",
      "status": "Active",
      "creationDate": "2026-06-10T10:21:44.123Z",
      "position": 1
    }
  ]
  ```

---

### `POST /tasks`
Adds a new task.

- **Request Body** (content-type: `application/json`):
  ```json
  {
    "title": "Build API controllers",            // Required (non-empty string)
    "description": "Implement task CRUD handlers", // Optional (string or null)
    "dueDate": "2026-06-15"                       // Optional (ISO Date string or null)
  }
  ```
- **Response Shape** (`201 Created`):
  ```json
  {
    "id": 2,
    "title": "Build API controllers",
    "description": "Implement task CRUD handlers",
    "dueDate": "2026-06-15",
    "status": "Active",
    "creationDate": "2026-06-10T10:25:00.000Z",
    "position": 2
  }
  ```

---

### `PUT /tasks/:id`
Updates specific attributes of a task (e.g. title, description, due date, status).

- **Request Body** (content-type: `application/json`):
  All properties are optional.
  ```json
  {
    "title": "Build and test API controllers",
    "description": "Implement Express controllers and verify responses",
    "dueDate": "2026-06-16",
    "status": "Completed" // Must be 'Active' or 'Completed'
  }
  ```
- **Response Shape** (`200 OK`):
  ```json
  {
    "id": 2,
    "title": "Build and test API controllers",
    "description": "Implement Express controllers and verify responses",
    "dueDate": "2026-06-16",
    "status": "Completed",
    "creationDate": "2026-06-10T10:25:00.000Z",
    "position": 2
  }
  ```

---

### `PUT /tasks/reorder`
Updates the custom list order of multiple tasks following a drag-and-drop action.

- **Request Body** (content-type: `application/json`):
  ```json
  {
    "order": [
      { "id": 2, "position": 1 },
      { "id": 1, "position": 2 }
    ]
  }
  ```
- **Response Shape** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Tasks reordered successfully"
  }
  ```

---

### `DELETE /tasks/:id`
Removes a task from the workspace database.

- **Response Shape** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Task deleted successfully"
  }
  ```

---

## 🔮 Next Steps & Potential Improvements

Here are several features and improvements that could be built next to expand FlowTask:

1. **User Authentication & Multi-Tenancy**:
   - Implement JWT or session-based cookies.
   - Separate task pools in SQLite so multiple users can sign up and manage their own tasks.
2. **Category/Workspace Labels (Tags)**:
   - Allow users to group tasks under labels (e.g. "Work", "Personal", "Code") and filter tasks by those labels.
3. **Task Reminders & Notifications**:
   - Integrate desktop notification APIs or webhooks (e.g. email or Slack alerts) for overdue tasks.
4. **Subtasks / Checklists**:
   - Allow a task to contain nested checklist items that count toward the overall task progress percentage.
5. **Database Indexing**:
   - Add indexes on columns like `status`, `dueDate`, and `position` in `tasks.db` to optimize query performance as the task counts grow.
