import { dbHelper } from '../db/database.js';

export const taskController = {
  getTasks(req, res) {
    try {
      const tasks = dbHelper.all(`
        SELECT * FROM tasks
        WHERE user_id = ?
        ORDER BY 
          CASE priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            ELSE 3 
          END,
          created_at DESC
      `, [req.user.id]);
      res.json({ tasks });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve tasks.' });
    }
  },

  createTask(req, res) {
    try {
      const { title, priority, dueTime, category, assignedTo } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Task title is required.' });
      }

      const id = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      dbHelper.run(`
        INSERT INTO tasks (id, user_id, title, priority, due_time, category, assigned_to, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [
        id,
        req.user.id,
        title.trim(),
        priority || 'Medium',
        dueTime || '5:00 PM',
        category || 'Operations',
        assignedTo || 'Owner'
      ]);

      const created = dbHelper.get('SELECT * FROM tasks WHERE id = ?', [id]);
      res.status(201).json({ task: created });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create task.' });
    }
  },

  toggleTask(req, res) {
    try {
      const { taskId } = req.params;
      const task = dbHelper.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      dbHelper.run('UPDATE tasks SET status = ? WHERE id = ?', [newStatus, taskId]);
      res.json({ task: { ...task, status: newStatus } });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle task status.' });
    }
  },

  deleteTask(req, res) {
    try {
      const { taskId } = req.params;
      dbHelper.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
      res.json({ message: 'Task removed.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task.' });
    }
  }
};
