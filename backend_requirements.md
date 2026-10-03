# Backend Implementation Requirements

Based on the recent UI migration of the frontend from the Stitch design, several new visual features and user flows were introduced. However, the current backend implementation (Node.js / Express / Mongoose) lacks the models, fields, and API endpoints to support them. 

Below is a detailed analysis of the exact gaps between the new frontend features and the existing backend, grouped by domain.

---

## 1. User Profile & Authentication
The current `User` model only supports Google OAuth (`googleId`, `email`, `displayName`, `avatar`) and lacks standard password authentication fields. The new `ProfilePage.jsx` introduces a full account settings suite.

**Missing Model Fields (`User.js`):**
- `bio` (String) - To support the user biography field.
- `password` (String) - Hashed password to support the "Change Password" feature.
- `twoFactorEnabled` (Boolean) - For the 2FA toggle switch.
- `twoFactorSecret` (String) - To store the 2FA secret key.

**Missing API Endpoints:**
- `PUT /api/users/profile`
  - **Purpose:** Update the user's `displayName`, `email`, and `bio`.
- `PUT /api/users/password`
  - **Purpose:** Support the "Change Password" form (requires current password and new password).
- `POST /api/users/2fa/setup` & `POST /api/users/2fa/verify`
  - **Purpose:** Endpoints to generate a QR code/secret and verify the TOTP token for 2FA.
- `POST /api/users/avatar` (Optional)
  - **Purpose:** The UI has a camera icon to update the avatar. Requires an endpoint to handle `multipart/form-data` image uploads.

---

## 2. Notes & Organization
The current `Note` model only stores `title`, `content`, `userId`, and `totNotes`. The new UI introduces tags, privacy settings, trash, and folders (notebooks).

**Missing Model Fields (`Note.js`):**
- `tags` ([String] or [ObjectId]) - To support the tag chips (e.g., "Ideation", "Tech") and "Add Tag" functionality.
- `isPrivate` (Boolean) - Default `true`. The UI shows a lock icon for private notes and a "Shared" section.
- `isDeleted` (Boolean) or `deletedAt` (Date) - To support the "Trash" navigation link instead of hard-deleting immediately.
- `notebookId` (ObjectId) - To associate the note with a specific notebook.

**Missing Models:**
- `Notebook.js`
  - **Fields:** `name` (String), `userId` (ObjectId), `color` (String - optional).

**Missing API Endpoints:**
- `GET /api/notes/search?q={query}`
  - **Purpose:** To power the global search bar added in the `Header.jsx`.
- `GET /api/notes/trash`
  - **Purpose:** Retrieve soft-deleted notes for the "Trash" view.
- `POST /api/notes/:id/restore`
  - **Purpose:** Restore a note from the trash.
- `GET /api/notes/shared`
  - **Purpose:** Retrieve notes shared with the current user.
- **Notebook Endpoints:**
  - `GET /api/notebooks`, `POST /api/notebooks`, `PUT /api/notebooks/:id`, `DELETE /api/notebooks/:id`

---

## 3. Editor & Content
The new Create and Edit pages feature a rich text formatting toolbar, including an "Image" button. 

**Missing Features:**
- `POST /api/upload/image`
  - **Purpose:** If users click the image icon to upload an image into their note, the backend needs an endpoint (likely integrating with AWS S3, Cloudinary, or local storage) to upload the file and return a public URL to embed in the `content` string.

---

### Recommended Next Steps
To make the new frontend fully functional, we should execute the backend implementation in the following phases:
1. Update Mongoose Schemas (`User`, `Note`, and create `Notebook`).
2. Build out the User Profile / Settings endpoints.
3. Add search, tag, and soft-delete (Trash) functionality to the Note controller.
4. (Optional) Implement 2FA and Image Uploads as a final polish.
