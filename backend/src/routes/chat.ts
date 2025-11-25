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
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  try {
    const stream = processRequestStream(username, message, conversationId);
    
    // Handle stream errors
    let hasError = false;
    
    for await (const chunk of stream) {
      if (!res.headersSent) {
        // Headers already sent, continue streaming
      }
      
      try {
        res.write(chunk);
      } catch (writeError) {
        // Client disconnected or write failed
        console.error("Error writing chunk:", writeError);
        hasError = true;
        break;
      }
    }
    
    if (!hasError) {
      res.end();
    }
  } catch (error) {
    console.error("Chat route error:", error);
    
    // Try to send error message if connection is still open
    try {
      const errorMessage = error instanceof Error 
        ? `\n❌ Error: ${error.message}\n\nPlease try again or contact support if the issue persists.\n`
        : "\n❌ Error processing request. Please try again.\n";
      
      if (!res.headersSent) {
        res.status(500);
      }
      res.write(errorMessage);
      res.end();
    } catch (writeError) {
      // Connection already closed, just log
      console.error("Could not send error message to client:", writeError);
    }
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
