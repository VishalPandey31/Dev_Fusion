# Dev_Fusion Project: The Complete Journey Flow

This document explains the entire project lifecycle in two parts:
1.  **Brief High-Level Flow:** A simple elevator pitch of how it works.
2.  **Deep Technical Journey:** A step-by-step breakdown of exactly what happens in the code.

---

## Part 1: Brief High-Level Flow (The "What")

*   **Step 1: Admin Registration**
    *   A new Admin signs up. To prevent fake admins, they must type a **Secret Code** ("DevFusion") and upload an ID proof.
*   **Step 2: Team Member Onboarding**
    *   Admins add team members using their Gmail address.
    *   Members receive an invite they can use to login.
*   **Step 3: Creating a Project**flocal
    *   Once logged in, you create a "Project" (basically a workspace)`.
    *   The backend records the exact time you entered the project for attendance.
*   **Step 4: AI Collaboration**
    *   You ask the AI (Gemini) to "Create a Website".
    *   The AI writes the code files (HTML, CSS, JS) directly into your project file tree.
*   **Step 5: Code Execution**
    *   You click **"Run"**.
    *   The browser instantly starts a mini-server (WebContainer) inside your tab. It installs libraries and shows a live preview of your site.
*   **Step 6: Sharing & Features**
    *   You can "Review" code to get a rating.
    *   You can "Smart Fix" errors instantly.
    *   You can share the code via WhatsApp or download it.

---

## Part 2: Deep Technical Journey (The "How")

### **Phase 1: The Gate (Authentication)**
**Code Locations:** `backend/controllers/admin.controller.js` (Admin), `backend/controllers/user.controller.js` (User)
*   **User Action:** Admin submits registration form.
*   **Code Flow:**
    *   `POST /admin/register` hits `admin.controller.js`.
    *   **Logic:** It checks `req.body.secretCode === 'DevFusion'`. If false, it throws a 403 Forbidden error.
    *   **DB:** Saves user with `isVerifiedAdmin: true` and hashes the PIN using `bcrypt`.
*   **User Action:** Member Logs In.
*   **Code Flow:**
    *   `POST /users/login` hits `user.controller.js`.
    *   **Logic:** It checks `user.status`. If it is 'PENDING', login is blocked. Only 'APPROVED' users get a JWT Token.

### **Phase 2: The Project Room (Socket Connection)**
**Code Locations:** `frontend/src/screens/Project.jsx` (Client), `backend/server.js` (Server Socket)
*   **User Action:** User clicks on a Project.
*   **Code Flow:**
    *   Frontend (`Project.jsx`) opens.
    *   `initializeSocket(projectId)` is called.
    *   **Backend (`server.js`):**
        *   `io.on('connection')` triggers.
        *   **Time Tracking:** It immediately runs `sessionModel.create({ loginTime: new Date() })` to mark attendance.
        *   The user joins a Socket Room: `socket.join(projectId)`.

### **Phase 3: The AI Brain (Generation)**
**Code Locations:** `backend/services/ai.service.js` (Gemini), `backend/controllers/ai.controller.js` (Logic)
*   **User Action:** User types "@ai create a login page".
*   **Code Flow:**
    *   **Frontend:** Emits `socket.emit('project-message', message)`.
    *   **Backend:**
        *   Detects `message.includes('@ai')`.
        *   Calls `ai.service.js` -> `Gemini API`.
        *   **Prompt Engineering:** It sends a system prompt telling Gemini: "You are a coding assistant. Return output as a JSON object with a fileTree structure."
    *   **Response:** Gemini returns JSON.
    *   **Backend:** Broadcasts this JSON to the room via Socket.io.
    *   **Frontend:** Parses the JSON and updates the `fileTree` state, causing the file explorer to instantly show `login.html` and `style.css`.

### **Phase 4: The Engine (WebContainer)**
**Code Location:** `frontend/src/screens/Project.jsx` (WebContainer Boot & Run)
*   **User Action:** User clicks "Run".
*   **Code Flow:**
    *   **Frontend:**
        *   `getWebContainer()` boots up the WebAssembly-based Node.js runtime.
        *   `webContainer.mount(fileTree)` writes the virtual files into memory.
    *   **Dependency Install:**
        *   Checks for `package.json`.
        *   Runs `webContainer.spawn('npm', ['install'])`.
        *   Streams logs to the terminal UI component.
    *   **Start Server:**
        *   Runs `node server.js` or `npm start`.
        *   The WebContainer emits a `server-ready` event with a local URL (e.g., `https://webcontainer-abc.local`).
        *   The frontend sets the `<iframe>` src to this URL.

### **Phase 5: Smart Features (Intelligence)**
*   **Review Code:** (File: `backend/controllers/ai.controller.js` & `frontend/src/screens/Project.jsx`)
    *   Sends file content to `/ai/get-feedback`.
    *   AI analyzes complexity and returns a JSON rating (Beginner/Expert).
*   **Smart Fix:** (File: `backend/controllers/ai.controller.js`)
    *   Grabs the last 10 lines of the terminal error.
    *   Backend checks MongoDB `ErrorLogs` first (Memory).
    *   If not found, asks AI for a fix and saves it for future users (Learning).
*   **WhatsApp Share:** (File: `frontend/src/screens/Project.jsx`)
    *   Encodes the file content into a URL: `https://api.whatsapp.com/send?text=...`.
    *   Opens it in a new tab.

---

### **Visual Summary**
```mermaid
graph TD
    User[User] -->|Login| Auth[Auth Controller]
    Auth -->|JWT Token| Frontend[React Frontend]
    Frontend -->|Socket Connect| Backend[Node Backend]
    Backend -->|Record Time| DB[(MongoDB)]
    
    Frontend -->|@ai prompt| Backend
    Backend -->|Call API| AI[Gemini API]
    AI -->|JSON Code| Backend
    Backend -->|Broadcast Code| Frontend
    
    Frontend -->|Click Run| WC[WebContainer (Browser)]
    WC -->|Serve| Preview[Live Website]
```
