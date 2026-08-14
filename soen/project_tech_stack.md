# Dev_Fusion Tech Stack & Tools Deep Dive

This document lists every single technology, library, and tool used in **Dev_Fusion**, from the Frontend to the Backend and AI. It explains exactly *why* we used it and *what* it does in this specific project.

---

## 1. Frontend Technologies (The "Face")
**Location:** `frontend/`

### Core Frameworks
*   **React (v18.3.1):** The core library for building the UI. We used it to create reusable components like the Chat Interface, Code Editor, and Modals.
*   **Vite (v6.0.1):** The build tool. Used instead of Create-React-App because it's lightning-fast and supports native ES modules, which is crucial for modern web development.
*   **Node.js (Runtime):** Required to run Vite and manage packages (`npm`).

### UI & Styling
*   **TailwindCSS (v3.4.16):** A utility-first CSS framework. Used for all styling (layout, colors, spacing). It allowed us to build the "Glassmorphism" dark theme without writing thousands of lines of custom CSS.
*   **Framer Motion (`framer-motion`):** The animation library. Used for:
    *   **The smooth "slide-in" effect of the Side Panel.**
    *   **The "pop-up" animations of Modals (Admin Login, Select User).**
    *   **The smooth transitions when switching between Chat and File Explorer.**
*   **Lucide React (`lucide-react`) & Remix Icon (`remixicon`):** The icon sets. Used for all buttons (e.g., the "Play" icon for Run, the "Sparkles" icon for AI, the "Close" X icon). `lucide-react` is modern and clean.
*   **Clsx & Tailwind-Merge:**
    *   **Helper Tools:** These allow us to conditionally combine CSS classes. For example, changing a button from "Blue" (Active) to "Gray" (Disabled) dynamically in React code.

### Critical Features
*   **@webcontainer/api:** **(THE STAR PLAYER)**
    *   **Purpose:** This Google/StackBlitz technology allows us to run a **real Node.js server inside the browser**.
    *   **Usage:** It powers the "Run" button. It grabs the file tree, installs `npm` packages locally in Chrome, and serves the preview website without needing a heavy backend execution engine.
*   **Socket.io-client:**
    *   **Purpose:** Real-time bi-directional communication.
    *   **Usage:** Connects to the backend to send/receive chat messages instantly and get AI code updates without refreshing the page.
*   **Axios:**
    *   **Purpose:** Secure HTTP requests.
    *   **Usage:** Used for Login (`POST /login`), Register, and fetching Projects. It handles Cookies automatically.
*   **Highlight.js:**
    *   **Purpose:** Syntax Highlighting.
    *   **Usage:** Makes the code in the Chat window look colorful and readable (like VS Code) instead of plain black text.
*   **Markdown-to-jsx:**
    *   **Purpose:** Rendering AI responses.
    *   **Usage:** The AI replies in Markdown (with bold text, lists, code blocks). This library converts that Markdown into real React components so it looks formatted.

---

## 2. Backend Technologies (The "Brain")
**Location:** `backend/`

### Core Server
*   **Node.js & Express.js:**
    *   **Purpose:** The web server framework.
    *   **Usage:** Handles all API routes (`/users`, `/projects`, `/admin`). It acts as the traffic controller for the entire app.
*   **Morgan:**
    *   **Purpose:** HTTP Request Logger.
    *   **Usage:** Prints logs like `POST /users/login 200` in the terminal so we can debug what's happening.
*   **Cors (Cross-Origin Resource Sharing):**
    *   **Purpose:** Security.
    *   **Usage:** Configured to ONLY allow requests from your specific Frontend URL. It blocks hackers/other sites from calling your API.
*   **Cookie-Parser:**
    *   **Purpose:** Token Management.
    *   **Usage:** Reads the HTTP-Only cookie containing the Users's Auth Token. This is more secure than storing tokens in LocalStorage.

### Database
*   **MongoDB (v7.0) & Mongoose (v8.8.4):**
    *   **Purpose:** The NoSQL Database.
    *   **Usage:** Stores all data:
        *   `users`: Login info, Admin status.
        *   `projects`: The File Tree (JSON code), Project Name.
        *   `messages`: Every chat message sent.
        *   `sessions`: Timesheet data (login/logout times).

### Authentication & Security
*   **JsonWebToken (JWT):**
    *   **Purpose:** Stateless Authentication.
    *   **Usage:** Creates a signed "Passport" (Token) for the user. The backend verifies this signature on every request to know WHO is asking.
*   **Bcrypt:**
    *   **Purpose:** Password Hashing.
    *   **Usage:** Scrambles passwords (and Admin PINs) into unreadable text before saving to the DB. Even if the DB is stolen, passwords are safe.
*   **Express-Validator:**
    *   **Purpose:** Input Validation.
    *   **Usage:** Checks if emails are valid, if passwords have 6 chars, etc., *before* the code even tries to save them. Security layer 1.

### Real-Time Engine
*   **Socket.io (Server):**
    *   **Purpose:** The Websocket Server.
    *   **Usage:** Manages "Rooms" (Project IDs). When User A types, it broadcasts that message to everyone else in that Project Room.

### Artificial Intelligence
*   **@google/generative-ai (Gemini 1.5):**
    *   **Purpose:** The Brain.
    *   **Usage:** We send prompts (strings) to Google's API, and it returns code or chat responses. We configured it with a tailored "System Prompt" to act like a Senior Developer.

### File Handling
*   **Multer:**
    *   **Purpose:** File Uploads.
    *   **Usage:** Specifically handling the "Identity Proof" image upload during Admin Registration. It saves the file to the disk temporarily.

---

## 3. DevOps & Deployment (The "Home")

*   **Surge.sh:**
    *   **Usage:** Hosting the **Frontend**. It's a static host perfect for React apps.
*   **Google Cloud Run:**
    *   **Usage:** Hosting the **Backend**. It's a "Serverless Container" platform. It scales to zero (costs nothing) when no one is using it and wakes up instantly when you login.
*   **MongoDB Atlas:**
    *   **Usage:** Hosting the **Database** in the cloud. It ensures data is persistent and backed up.

---

## Summary of Data Flow
1.  **Frontend (React/Vite)** captures user input.
2.  **Axios** sends it to **Backend (Express)**.
3.  **Express** validates it using **Express-Validator**.
4.  **Mongoose** saves it to **MongoDB**.
5.  **Gemini AI** generates code when asked.
6.  **Socket.io** pushes that code back to Frontend.
7.  **WebContainer** executes that code right in the browser.

This stack is a modern "MERN + AI + WebContainer" hybrid architecture.
