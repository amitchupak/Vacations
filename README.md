# Vacations

GitHub: https://github.com/amitchupak/Vacations

**Run the project (Docker):**

```bash
docker compose up -d --build
```

**Run the app on the course AWS server:** see [AWS-SETUP.md](AWS-SETUP.md).

**On this PC with Docker:** after the command above, open **http://localhost:5002** or the public **https://…trycloudflare.com** URL from `docker compose logs cloudflared` (works when AWS ports are closed).

**School code-server** (`/proxy/4002/`): in `Frontend` use **`npm run start:code-server`** (not `npm start` — fixes 404 on Vite scripts).
