# Your course server (from your sheet)

| What | Value |
|------|--------|
| **Public IP (use this in the browser for the app)** | `34.244.57.210` |
| **Web terminal in the browser** (shell inside the page) | http://34.244.57.210:5000 |
| **Password for that web terminal** (if it asks) | `devopshift` |
| **VS Code in the browser** | http://34.244.57.210:5001 |
| **Your vacation app (Option B — after Docker is running)** | **http://34.244.57.210:5002** (not 5000) |

**Important:** **Port 5000** is only the **school’s terminal/IDE in the browser**. It is **not** your vacation website. The site is on **port 5002** in Option B (see below).

If you use **SSH** instead, you will see a prompt like `ubuntu@ip-172-31-33-42` — that is **normal**. `172.31.x.x` is the **private** IP inside AWS; the **public** IP you use in a browser is still **34.244.57.210**.

### Node.js version (if `npm start` throws `SyntaxError: Unexpected token '.'` in Vite)

The **Frontend** needs **Node 20+** (Vite 7). The school VM may have an old system Node.

Check: `node -v` (must be v20.19 or higher, e.g. v20.x or v22.x). If it is **v12** or **v18** or lower, install a modern Node **in your home directory** (does not need `sudo`):

```bash
# Install nvm, then Node 20 LTS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Close and reopen the terminal, or:  source ~/.bashrc
nvm install 20
nvm use 20
node -v
cd ~/Vacations/Frontend
npm install
npm run start:code-server
```

(Use `npm start` only for local/Docker, not for the `5001/proxy/4002` preview.) **Easier (no nvm):** use **Docker** from the project root: `docker compose up -d --build` — the project’s Docker image already uses a current Node.

---

## B — Open your site with `http://34.244.57.210:5002`

1. Get your project on the server (the folder that contains `docker-compose.yml`):
   - Use the **web terminal** at **http://34.244.57.210:5000** (log in with the password in the table if needed), **or**
   - Use **VS Code** at **:5001**, **or**
   - **SSH** as `ubuntu` to the same machine.
2. Create **`Backend/.env`** if it is missing, with at least `JWT_SECRET` and `HASH_SALT` (and other keys your class uses).
3. In the project root, the file **`.env`** should contain (or use compose default):
   ```env
   VITE_API_URL=http://34.244.57.210:5002
   ```
4. In **AWS** → **EC2** → your instance → **Security** → **Security group** → **Edit inbound rules** → add:
   - **Type:** Custom TCP  
   - **Port:** `5002`  
   - **Source:** `0.0.0.0/0` (or “My IP” if you only want your computer)
5. On the server, in the project folder, run:
   ```bash
   cd /path/to/your/project
   docker compose up -d --build
   ```
6. In your browser, open the **website** (not 5000):
   ```text
   http://34.244.57.210:5002
   ```

### `ERR_CONNECTION_REFUSED` (Chrome / “this site can’t be reached”)

`Connection refused` means **nothing is listening on 5002** on the machine you are calling, or **Docker** was never started. Fix it **on the server**:

1. Go to the project directory and start the stack:
   ```bash
   docker compose up -d --build
   ```
2. Check that **`vacations_proxy`** is **Up**:
   ```bash
   docker compose ps
   ```
3. Test **on the same server** (this ignores AWS rules from the outside):
   ```bash
   curl -sI http://127.0.0.1:5002/ | head -n 1
   ```
   - You see a line like `HTTP/1.1 200` or `HTTP/1.1 301` → nginx is up. If it still fails in your home browser, the **security group** is still blocking **5002** or the **public IP** does not point to this instance.
   - `curl: (7) Failed to connect` to `127.0.0.1:5002` → Docker is not serving that port. Run: `docker compose logs proxy` and fix errors, then `docker compose up -d --build` again.

4. You can also run (from the repo on the server):
   ```bash
   sh scripts/check-site-on-server.sh
   ```

5. If **5002** is never open on your course account, use **option A** (Cloudflare tunnel) — no inbound port 5002 needed.

**Security note:** This file mentions the terminal password for convenience. If your GitHub repo is **public**, do not copy passwords into the README; rotate the password in the course panel if you think it was exposed.

---

## A — Public HTTPS link (only if 5002 stays closed)

1. In the root **`.env`**, **remove or comment** `VITE_API_URL` (or set `VITE_API_URL=` empty).
2. Run `docker compose up -d --build`, then:
   ```bash
   docker compose logs cloudflared
   ```
3. Open the **https://…trycloudflare.com** URL from the log.

---

## `ECONNREFUSED` on `http://<IP>:5001/proxy/4002/`

The preview on **5001** only forwards to **port 4002** on the server. You must run Vite in `Frontend` with **`npm run start:code-server`** (uses `--base /proxy/4002/` and **port 4002**). The **Docker** frontend is on host **:4003** and uses `base: /` — it does **not** work behind `/proxy/4002/` (you would see **404** on `client`, `@react-refresh`, etc.).

- **code-server** (`/proxy/4002/`): `cd ~/Vacations/Frontend && npm run start:code-server` (needs **:4002** free).
- **Full stack in browser** (no subpath): `http://<IP>:5002` from `docker compose up`, or `http://<IP>:4003` for direct Vite with Docker.

**`Port 4002 is already in use`:** stop whatever is on 4002, or use `npm run start:code-server:4003` and open **`/proxy/4003/`** instead.

```bash
sudo ss -tlnp | grep 4002
# If you no longer need it on 4002, stop it; or pull the latest compose (frontend is on :4003, not :4002).
cd ~/Vacations/Frontend && npm run start:code-server
```

## If the URL is `/proxy/4002/proxy/4002/` (path appears twice)

That **breaks** Vite. Use a **single** segment only:

`http://<IP>:5001/proxy/4002/`

`index.html` will auto-redirect if it detects the duplicate. After pull, use that address or it will self-fix on reload.

## Code-server: 404 on `client`, `main.tsx`, `@react-refresh`

The preview uses a **subpath** (`/proxy/4002/`). You must start with **`npm run start:code-server`**, not `npm start`. For a public site without that path, use **`http://<IP>:5002`** (Docker) or the **trycloudflare.com** link.

## Local PC (optional)

- In root **`.env`:** `VITE_API_URL=http://localhost:4001` when you use Docker on your computer with the UI on port **4003** and the API on **4001**.
