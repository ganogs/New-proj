# Social Media Sharer App

A full-stack application for creating and sharing posts to social media platforms (Facebook, LinkedIn, WhatsApp). The frontend provides a simple "New Post" form matching the provided UI mockup, while the backend handles post storage in SQLite and image uploads. Sharing uses URL-based links (with post text where supported); advanced API posting requires additional setup (see notes).

## Project Structure
- `frontend/`: Static HTML/CSS/JS for the UI.
  - `index.html`: Main form page.
  - `style.css`: Styles matching the mockup (white card, dashed textarea, blue upload button, colored share buttons).
  - `script.js`: Handles form submission, image preview, API calls, and share link generation.
- `backend/`: Node.js/Express API server.
  - `server.js`: Express app with POST `/api/posts` (create post with optional image) and GET `/api/posts/:id`.
  - `database.js`: SQLite setup for storing posts (id, text, image_path, created_at).
  - `package.json`: Dependencies (express, cors, multer, sqlite3, dotenv).
  - `.env`: Config (PORT=3000, DB_PATH=./database.db, MAX_FILE_SIZE=5MB).
  - `uploads/`: Directory for uploaded images (auto-created).
- `README.md`: This file.

## Local Setup and Testing
1. **Install Backend Dependencies**:
   - Navigate to `backend/` and run:
     ```
     cd backend
     npm install
     ```

2. **Start the Backend Server**:
   - In `backend/`:
     ```
     npm start
     ```
   - Server runs on `http://localhost:3000`. It serves the frontend statically and initializes the SQLite DB (`backend/database.db`).

3. **Test the App**:
   - Open `http://localhost:3000` in your browser.
   - Enter text in the textarea (required).
   - Optionally upload an image (<5MB, images only).
   - Submit the form: Post is saved to DB, success message shows, share buttons enable.
   - Click share buttons:
     - **Facebook/LinkedIn**: Opens sharer with post URL (e.g., `http://localhost:3000?postId=1`).
     - **WhatsApp**: Opens with text + URL.
   - Images are stored in `backend/uploads/`; DB entries viewable via SQLite tools (e.g., DB Browser for SQLite).
   - Error handling: Invalid uploads or empty text show messages.

4. **Development Mode** (optional):
   - Use `npm run dev` for auto-restart with Nodemon.

## Deployment
Deploy frontend and backend separately for scalability, or together if using a full-stack host.

### Option 1: Separate Deployment (Recommended)
- **Frontend (Static Hosting)**:
  1. Push `frontend/` to a GitHub repo (or zip and upload).
  2. Deploy to **Netlify** (free):
     - Drag-drop `frontend/` folder to netlify.com/drop.
     - Or connect GitHub repo via Netlify dashboard.
     - Site URL: e.g., `https://your-app.netlify.app`.
  3. Update API URL in `frontend/script.js` (line ~35): Change `http://localhost:3000` to your backend URL (e.g., `https://your-backend.railway.app`).
  4. Redeploy frontend after update.

- **Backend (Dynamic Hosting with DB)**:
  1. Push entire project (or `backend/`) to GitHub.
  2. Deploy to **Railway** (free tier, auto-DB):
     - Connect GitHub repo at railway.app.
     - Add environment variables: `PORT=3000`, `DB_PATH=./database.db` (Railway handles SQLite persistence).
     - Railway auto-deploys on push; get URL (e.g., `https://your-backend.railway.app`).
  3. For production: Set `MAX_FILE_SIZE` if needed. Images stored in Railway's volume.
  4. Alternative: **Heroku** (add `Procfile` with `web: npm start`; use PostgreSQL add-on instead of SQLite for better persistence).

- **Connect Them**:
  - Update frontend's API endpoint to backend URL.
  - Test: Create post on deployed frontend; verify DB save and share links work (URLs use deployed frontend origin).

### Option 2: Full-Stack on Vercel (Serverless)
1. Restructure: Move `backend/server.js` API routes to `api/posts.js` and `api/posts/[id].js` (Vercel functions).
2. Push to GitHub, deploy via vercel.com (connect repo).
3. Frontend at root; API at `/api`. SQLite works but use Vercel's KV or external DB for prod.
4. Note: File uploads limited in serverless; consider Cloudinary for images.

### Advanced Social API Integrations
Current sharing uses web sharers (URL/title only). For direct posting:
- **Facebook/LinkedIn**: Register app on developers.facebook.com / linkedin.com/developers. Get API keys, add to `.env` (e.g., `FB_APP_ID=your_id`). Update `backend/server.js` with `fb` or `linkedin-api` npm packages for OAuth/posting.
- **WhatsApp**: Use WhatsApp Business API (requires approval); integrate via Twilio or official SDK.
- Install: `cd backend && npm install fb linkedin-api` (or similar), then add endpoints.
- Security: Use HTTPS in prod; validate API keys.

## Notes
- **Images**: Stored as files; for prod, use CDN (e.g., Cloudinary) to avoid storage limits.
- **Security**: Add auth (JWT) for user posts. Sanitize text to prevent XSS.
- **Limitations**: SQLite for dev; scale to PostgreSQL/MySQL. No multi-user support yet.
- **Troubleshooting**:
  - Backend errors: Check console for DB/upload issues.
  - CORS: Enabled for all origins (adjust in prod).
  - If server not starting: Ensure Node.js >=18 installed.

For issues or enhancements (e.g., React frontend, MongoDB), provide feedback!
