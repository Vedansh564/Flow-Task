import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initDb } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Endpoint definitions

// GET /tasks: Retrieve tasks
app.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await initDb();
    const sort = req.query.sort as string;

    let query = 'SELECT * FROM tasks';
    if (sort === 'position') {
      query += ' ORDER BY position ASC';
    } else {
      // Default: creation date, newest first
      query += ' ORDER BY creationDate DESC';
    }

    const tasks = await db.all(query);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /tasks: Add a new task
app.post('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const db = await initDb();
    const creationDate = new Date().toISOString();

    // Get max position to append task to the end of the drag-and-drop order
    const posResult = await db.get('SELECT MAX(position) as maxPos FROM tasks');
    const position = (posResult?.maxPos || 0) + 1;

    const result = await db.run(
      `INSERT INTO tasks (title, description, dueDate, status, creationDate, position)
       VALUES (?, ?, ?, 'Active', ?, ?)`,
      [title.trim(), description?.trim() || null, dueDate || null, creationDate, position]
    );

    const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
});

// PUT /tasks/reorder: Bulk update task positions (Drag & Drop)
app.put('/tasks/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order } = req.body; // Expecting { order: [{ id: 1, position: 1 }, { id: 2, position: 2 }] }

    if (!order || !Array.isArray(order)) {
      res.status(400).json({ error: 'order array is required' });
      return;
    }

    const db = await initDb();

    // Perform updates in a transaction for speed and atomicity
    await db.exec('BEGIN TRANSACTION');
    try {
      for (const item of order) {
        if (typeof item.id !== 'number' || typeof item.position !== 'number') {
          throw new Error('Invalid item data format in order array');
        }
        await db.run('UPDATE tasks SET position = ? WHERE id = ?', [item.position, item.id]);
      }
      await db.exec('COMMIT');
    } catch (txError) {
      await db.exec('ROLLBACK');
      throw txError;
    }

    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /tasks/:id: Update a task (title, description, due date, status)
app.put('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const { title, description, dueDate, status } = req.body;

    const db = await initDb();

    // Verify task exists
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Prepare fields to update
    const updatedTitle = title !== undefined ? title.trim() : task.title;
    const updatedDescription = description !== undefined ? (description?.trim() || null) : task.description;
    const updatedDueDate = dueDate !== undefined ? (dueDate || null) : task.dueDate;
    const updatedStatus = status !== undefined ? status : task.status;

    // Validate Status if it is being updated
    if (status !== undefined && status !== 'Active' && status !== 'Completed') {
      res.status(400).json({ error: "Status must be 'Active' or 'Completed'" });
      return;
    }

    // Validate Title if it is being updated
    if (title !== undefined && (!title || typeof title !== 'string' || title.trim() === '')) {
      res.status(400).json({ error: 'Title cannot be empty' });
      return;
    }

    await db.run(
      `UPDATE tasks
       SET title = ?, description = ?, dueDate = ?, status = ?
       WHERE id = ?`,
      [updatedTitle, updatedDescription, updatedDueDate, updatedStatus, id]
    );

    const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});

// DELETE /tasks/:id: Delete a task
app.delete('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const db = await initDb();

    // Verify task exists
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Personal Task Manager API is running.' });
});

// Centralized error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Initialize database then start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
