# Apple Developer setup for Sign in with Apple (beginner guide)

This connects **Continue with Apple** on your login page to Supabase.

You do **not** need a published iOS app. You need an **Apple Developer Program** account (paid).

---

## Before you start

### 1. Apple Developer Program ($99 / year)

1. Go to [https://developer.apple.com/programs/](https://developer.apple.com/programs/).
2. Click **Enroll**.
3. Sign in with your Apple ID (or create one).
4. Choose **Individual** (simplest) or **Organization** (company).
5. Pay **$99 USD per year** and wait for approval (often 24–48 hours, sometimes faster).

Until enrollment is approved, you cannot finish Sign in with Apple for production.

### 2. Find your Supabase callback URL

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Project Settings** → **API** → note **Project URL**, e.g. `https://abcdefghijklmnop.supabase.co`.
3. Your Apple **Return URL** is always:

   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```

   Replace `abcdefghijklmnop` with your real project ref.

4. Your Apple **Domain** is only the host (no `https://`):

   ```
   abcdefghijklmnop.supabase.co
   ```

Keep these two values handy.

---

## Step A — Register an App ID

1. Go to [https://developer.apple.com/account](https://developer.apple.com/account).
2. Open **Certificates, Identifiers & Profiles**.
3. Left menu → **Identifiers** → **+** (plus button).
4. Select **App IDs** → **Continue**.
5. Type: **App** → **Continue**.
6. Fill in:
   - **Description:** `Fitness Tracker` (any name you like)
   - **Bundle ID:** **Explicit** → e.g. `com.yourname.fitnesstracker`
7. Scroll to capabilities → enable **Sign in with Apple**.
8. **Continue** → **Register**.

You need this App ID before creating the Services ID (web client).

---

## Step B — Create a Services ID (web “client ID”)

This is what Supabase calls **Client ID** for Apple.

1. **Identifiers** → **+** again.
2. Select **Services IDs** → **Continue**.
3. **Description:** `Fitness Tracker Web`
4. **Identifier:** e.g. `com.yourname.fitnesstracker.web` (must be unique; this is your **Services ID**)
5. **Continue** → **Register**.
6. Click the Services ID you just created.
7. Enable **Sign in with Apple** → **Configure**:
   - **Primary App ID:** pick the App ID from Step A.
   - **Domains and Subdomains:** your Supabase host only, e.g.  
     `abcdefghijklmnop.supabase.co`
   - **Return URLs:**  
     `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
8. **Next** → **Done** → **Continue** → **Save**.

Copy the **Services ID** (e.g. `com.yourname.fitnesstracker.web`) — paste this into Supabase as **Client ID**.

---

## Step C — Create a Sign in with Apple key

1. Left menu → **Keys** → **+**.
2. **Key name:** `Fitness Tracker Apple Auth`
3. Enable **Sign in with Apple** → **Configure** → select your **Primary App ID** from Step A.
4. **Save** → **Continue** → **Register**.
5. **Download** the `.p8` file **once** (you cannot download it again).
6. Note the **Key ID** shown on the page (10 characters).

Open the `.p8` file in a text editor — you will paste its **entire contents** into Supabase (including `-----BEGIN PRIVATE KEY-----` lines).

---

## Step D — Find your Team ID

1. [Apple Developer Account](https://developer.apple.com/account) → **Membership details**,  
   or top-right on **Certificates, Identifiers & Profiles**.
2. Copy **Team ID** (10 characters, letters and numbers).

---

## Step E — Configure Supabase

1. Supabase → **Authentication** → **Providers** → **Apple**.
2. **Enable** Apple.
3. Fill in:

   | Supabase field | Where to get it |
   |----------------|-----------------|
   | **Client ID** | Services ID from Step B (e.g. `com.yourname.fitnesstracker.web`) |
   | **Secret Key** | Contents of the `.p8` file from Step C |
   | **Key ID** | From Step C |
   | **Team ID** | From Step D |

4. **Save**.

Also check **Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (or your tunnel URL)
- **Redirect URLs:** include `http://localhost:3000/auth/callback` and your tunnel URL if you test on a phone

---

## Step F — Test

1. Run `npm run dev`.
2. Open `/login` → **Continue with Apple**.
3. Sign in with your Apple ID.
4. You should land on `/dashboard`.

First sign-in may ask to share email; choose **Share My Email** so the app can create your user row.

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Used App ID bundle as Client ID | Use **Services ID** in Supabase, not App ID |
| Return URL is your Next.js URL | Must be `https://xxx.supabase.co/auth/v1/callback` |
| Wrong domain | Domain is `xxx.supabase.co` without `https://` |
| Lost `.p8` file | Create a new Key in Apple Developer and update Supabase |
| “Developer not enrolled” | Wait for Apple Developer Program approval |
| No email after login | User chose “Hide My Email”; revoke app at [appleid.apple.com](https://appleid.apple.com) and sign in again, share email |

---

## Can I skip Apple and use only Google?

Yes. Leave Apple disabled in Supabase and hide the Apple button in the UI if you want. Google setup is easier and free; see [oauth-google-apple.md](./oauth-google-apple.md).

---

## Checklist

- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] App ID with Sign in with Apple
- [ ] Services ID with domain + return URL pointing at Supabase
- [ ] Key downloaded (`.p8`) + Key ID saved
- [ ] Team ID copied
- [ ] Supabase Apple provider filled in and saved
- [ ] Tested `/login` → Continue with Apple
