import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbHelper } from '../db/database.js';
import { seedUserEnvironment, seedDemoData } from '../db/seed.js';
import { CONFIG } from '../config.js';

export const authController = {
  register(req, res) {
    try {
      const { email, password, businessName } = req.body;
      if (!email || !password || !businessName) {
        return res.status(400).json({ error: 'Please provide email, password, and business name.' });
      }

      const existing = dbHelper.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      dbHelper.run(`
        INSERT INTO users (id, email, password_hash, business_name)
        VALUES (?, ?, ?, ?)
      `, [userId, email.toLowerCase().trim(), passwordHash, businessName.trim()]);

      // Seed fresh environment for the new independent user
      seedUserEnvironment(userId);

      const token = jwt.sign(
        { id: userId, email: email.toLowerCase().trim(), businessName: businessName.trim() },
        CONFIG.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: { id: userId, email: email.toLowerCase().trim(), businessName: businessName.trim() }
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed due to an internal server error.' });
    }
  },

  login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = dbHelper.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, businessName: user.business_name },
        CONFIG.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, businessName: user.business_name }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed due to an internal server error.' });
    }
  },

  me(req, res) {
    try {
      const user = dbHelper.get('SELECT id, email, business_name, created_at FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  },

  resetDemo(req, res) {
    try {
      if (req.user.email !== 'demo@opsautomate.com') {
        return res.status(403).json({ error: 'Reset is only permitted on the demonstration account.' });
      }
      seedUserEnvironment(req.user.id);
      res.json({ message: 'Demo environment reset successfully with fresh sample records.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reset demo environment.' });
    }
  }
};
