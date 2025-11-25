import express, { Router } from "express";
import { processRequestStream } from "../services/agentService.js";
import { getUser, getConversations, getMessages } from "../db/database.js";

const router: Router = express.Router();

router.post("/", async (req, res) => {
  const { message, username, conversationId } = req.body;

  if (!message || !username) {
    res.status(400).json({ error: "Message and username are required" });
    return;
  }

  // Set headers for streaming
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    const stream = processRequestStream(username, message, conversationId);
    
    for await (const chunk of stream) {
      res.write(chunk);
    }
    
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.write("\nError processing request.");
    res.end();
  }
});

router.get("/history", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await getUser(String(username));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const conversations = await getConversations(user.id);
    res.json(conversations);
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.get("/history/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const messages = await getMessages(Number(id));
    res.json(messages);
  } catch (error) {
    console.error("Message fetch error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
