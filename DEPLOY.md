# Deploying to Hostinger

The whole site is one Node.js app: Express serves the API, the admin dashboard and the built React website.
Hostinger runs it as a **Node.js Web App**, which needs a **Business** web hosting plan or a **Cloud** plan.

## 0. Before you start

- [ ] In hPanel, **Websites → Add website** shows a **Node.js Web App** option. If it doesn't, your plan can't run this site: ask Hostinger to upgrade you.
- [ ] The domain (e.g. `daystolgroup.com`) is in your Hostinger account. If a website already exists on it, Hostinger asks you to remove it first. **Back it up before removing.**
- [ ] You have: your MongoDB Atlas connection string, Cloudinary URL, Hostinger mailbox password and Paystack keys.

## 1. Put the code on GitHub (private repository)

Deploying from GitHub means every `git push` updates the live site automatically.

```powershell
cd C:\path\to\Daystol
git init
git add .
git commit -m "Daystol website"
```

Create a **private** repository on github.com (no README), then run the two commands GitHub shows you (`git remote add origin ...` and `git push -u origin main`).
`.gitignore` already keeps `node_modules`, `.env` files and build output out of the repository. Check on GitHub that **no `.env` file** was uploaded.

## 2. Create the app in hPanel

1. **Websites → Add website → Node.js Web App** (Hostinger may label it "Web App").
2. Choose **Import Git Repository**, click **Authorize** and pick your repository.
3. Build settings:

| Setting | Value |
|---|---|
| Framework | Express (or "Other") |
| Node.js version | 22.x |
| Build command | `npm run build` |
| Entry file | `server.js` |
| Output directory (if asked) | `client/dist` |

4. Connect your domain to the app when asked.

## 3. Environment variables

In the app's **Environment Variables** section, add each of these (no quotes needed in hPanel):

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PUBLIC_URL` | `https://daystolgroup.com` (your real address, no slash at the end) |
| `MONGODB_URI` | your Atlas connection string, ending in `/daystol?...` |
| `SESSION_SECRET` | a new random string of 40+ characters (not the one on your laptop) |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `info@daystolgroup.com` |
| `SMTP_PASS` | the mailbox password |
| `MAIL_FROM` | `Daystol Group <info@daystolgroup.com>` |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` first; `sk_live_...` once you go live |

Do **not** set `PORT`; Hostinger provides it.

To make a session secret, run this on your laptop and copy the output:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Let Hostinger reach your database

MongoDB Atlas only accepts connections from approved addresses. In Atlas: **Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)**.
Shared hosting addresses can change, so this is the reliable option; your database password still protects it, so keep that password long and private.

## 5. Deploy and check

1. Click **Deploy**. Watch the deployment log; it ends with a success or failure message.
2. Open `https://daystolgroup.com/api/health`. You should see `{"ok":true,"db":"connected"}`.
3. Open the home page, a product page, and `https://daystolgroup.com/admin`.

**Admin account:** you can't run npm commands on Hostinger, but the database is in the cloud, so run the seed on your laptop
with `MONGODB_URI` in `server\.env` pointing at the **same** database the live site uses:

```powershell
cd server
node src/scripts/seed.js --email you@daystolgroup.com --name "Your Name" --password "a-long-password"
```

Then log in to `/admin` and fill in **Site settings** (phone, WhatsApp, email, address, notification email, delivery).

## 6. Paystack

1. Paystack dashboard → **Settings → API Keys & Webhooks**.
2. **Webhook URL**: `https://daystolgroup.com/api/paystack/webhook` (set it for Test mode now, and again for Live mode later).
3. Test a full order on the live site with the test key and a Paystack test card.
4. To take real payments: complete Paystack's business activation, then replace `PAYSTACK_SECRET_KEY` with the `sk_live_` key and redeploy or restart.

## 7. Search engines

1. Go to Google Search Console, add `https://daystolgroup.com` and verify it (the DNS record option works with Hostinger DNS).
2. Submit the sitemap: `https://daystolgroup.com/sitemap.xml`.

The site already gives every page its own title, description and link preview, and products include price and stock for Google.

## Updating the site later

Commit and push to GitHub. Hostinger rebuilds and redeploys automatically; if the build fails, the previous version stays live.

```powershell
git add .
git commit -m "Describe the change"
git push
```

Changing an environment variable doesn't need a rebuild: use **Restart** on the app.

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| Build fails | Read the deployment log. A missing package means `package.json` wasn't committed. |
| Site shows an error page right after deploy | An environment variable is missing or wrong. The app prints `Invalid environment variables` and the name in the log. |
| `/api/health` says `"db":"disconnected"` | Atlas Network Access (step 4) or a wrong `MONGODB_URI`. |
| Admin login keeps returning to the login page | `NODE_ENV` must be `production` and the site must open on `https://`. |
| No product photos | `CLOUDINARY_URL` missing or wrong. |
| No emails | SMTP settings, or **Notification email** empty in Site settings. |
| Payments stay "Awaiting payment" | Webhook URL not set in Paystack, or test/live key mismatch. |
