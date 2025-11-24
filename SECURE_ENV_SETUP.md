# Secure Environment Variable Setup Guide

## Method 1: Using .env File (Recommended for Development)

This is the safest and most convenient method for local development.

### Steps:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file and add your API key:**
   ```bash
   # Open in your editor
   nano .env
   # or
   code .env
   ```

3. **Add your Gemini API key:**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Verify `.env` is in `.gitignore`:**
   ```bash
   cat .gitignore | grep .env
   ```
   (Should show `.env` is ignored)

5. **Docker Compose will automatically load `.env` file:**
   ```bash
   docker-compose up -d
   ```

### Security Notes:
- ✅ `.env` file is already in `.gitignore` - it won't be committed
- ✅ Never commit `.env` files to git
- ✅ Never share your API key publicly

---

## Method 2: Export in Current Shell (Temporary)

For a single session:

### macOS/Linux:
```bash
export GEMINI_API_KEY=your_actual_api_key_here
docker-compose up -d
```

### Windows (PowerShell):
```powershell
$env:GEMINI_API_KEY="your_actual_api_key_here"
docker-compose up -d
```

### Windows (Command Prompt):
```cmd
set GEMINI_API_KEY=your_actual_api_key_here
docker-compose up -d
```

**Note:** This only lasts for the current terminal session. When you close the terminal, it's gone.

---

## Method 3: System-Wide Environment Variable (Persistent)

### macOS/Linux:

1. **Add to your shell profile:**
   ```bash
   # For bash
   echo 'export GEMINI_API_KEY=your_actual_api_key_here' >> ~/.bashrc
   source ~/.bashrc
   
   # For zsh (default on macOS)
   echo 'export GEMINI_API_KEY=your_actual_api_key_here' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Verify it's set:**
   ```bash
   echo $GEMINI_API_KEY
   ```

### Windows:

1. **Using System Properties:**
   - Open "System Properties" → "Advanced" → "Environment Variables"
   - Add new variable: `GEMINI_API_KEY` = `your_actual_api_key_here`
   - Restart terminal/IDE

2. **Using PowerShell (Admin):**
   ```powershell
   [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your_actual_api_key_here', 'User')
   ```

---

## Method 4: Docker Compose env_file (Alternative)

You can also use Docker Compose's `env_file` directive:

1. **Create `.env` file** (as in Method 1)

2. **Update `docker-compose.yml`** to explicitly use it:
   ```yaml
   backend:
     env_file:
       - .env
   ```

   (Note: Docker Compose automatically loads `.env` from the project root, so this is optional)

---

## Method 5: Using Docker Secrets (Production)

For production deployments, use Docker secrets:

1. **Create a secret:**
   ```bash
   echo "your_actual_api_key_here" | docker secret create gemini_api_key -
   ```

2. **Update docker-compose.yml:**
   ```yaml
   backend:
     secrets:
       - gemini_api_key
     environment:
       - GEMINI_API_KEY_FILE=/run/secrets/gemini_api_key
   ```

3. **Update backend code** to read from file if `GEMINI_API_KEY_FILE` is set.

---

## Verification

### Check if variable is set:
```bash
# macOS/Linux
echo $GEMINI_API_KEY

# Windows PowerShell
echo $env:GEMINI_API_KEY

# Windows CMD
echo %GEMINI_API_KEY%
```

### Test Docker Compose can see it:
```bash
docker-compose config | grep GEMINI_API_KEY
```

### Test the backend:
```bash
# After starting services
curl http://localhost:3001/health
```

---

## Security Best Practices

1. **Never commit API keys to git:**
   - ✅ `.env` is in `.gitignore`
   - ✅ Use `.env.example` as a template
   - ❌ Never commit `.env` files

2. **Use different keys for different environments:**
   - Development: Use a test/development API key
   - Production: Use a separate production API key

3. **Rotate keys regularly:**
   - If a key is exposed, revoke it immediately
   - Generate a new key from [Google AI Studio](https://ai.google.dev/)

4. **Limit API key permissions:**
   - Use API keys with minimal required permissions
   - Monitor API usage for unusual activity

5. **Use secrets management in production:**
   - AWS Secrets Manager
   - Google Secret Manager
   - HashiCorp Vault
   - Docker Secrets (for Docker Swarm)

---

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy the key (you'll only see it once!)

---

## Troubleshooting

### "GEMINI_API_KEY variable is not set" warning:
- Make sure `.env` file exists in project root
- Check the variable name is exactly `GEMINI_API_KEY`
- Restart Docker Compose: `docker-compose down && docker-compose up -d`

### Backend can't connect to Gemini API:
- Verify API key is correct
- Check backend logs: `docker-compose logs backend`
- Test API key manually (see verification section)

### Variable not persisting:
- If using export, it only lasts for current session
- Use `.env` file for persistence
- Or add to shell profile for system-wide persistence

