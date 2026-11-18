import { processAiMessage } from '../services/aiService.js';
import { toolRegistry } from '../tools/toolRegistry.js';

export const aiController = {
  async chat(req, res) {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      const result = await processAiMessage(req.user.id, message.trim(), history || []);
      res.json(result);
    } catch (err) {
      console.error('aiController.chat error:', err);
      res.status(500).json({ error: 'AI processing failed.' });
    }
  },

  getTools(req, res) {
    const tools = Object.values(toolRegistry).map(t => ({
      name: t.name,
      description: t.description
    }));
    res.json({ tools });
  }
};
