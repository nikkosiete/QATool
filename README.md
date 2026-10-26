# TSI Build Quality Hub

Website build QA dashboard (audits, reports, history, calendar, team members,
checklist) with a real shared database.

- **Front end:** a single static page (`index.html`), hosted on **Vercel**
- **Database + login:** **Supabase** (PostgreSQL, email/password auth, row-level security)
- No build step, no server code, no npm install.

```
tsi-quality-hub/
├── index.html                    the app
├── config.js                     your Supabase URL + anon key  (edit this)
├── vercel.json                   hosting + security headers
├── .gitignore
├── README.md
└── supabase/
    ├── 01_schema.sql             tables, roles, security rules, reporting view
    ├── 02_seed_checklist.sql     loads the default QA checklist
    └── 03_first_admin.sql        makes you the first owner (edit the email)
```

---

## Setup (about 15 minutes)

### 1. Create the Supabase project
1. Go to <https://supabase.com> > **New project**. Pick a region close to your team and save the database password somewhere safe.
2. Wait for it to finish provisioning.

### 2. Create the database
Open **SQL Editor > New query**, paste each file, and click **Run**, in this order:

1. `supabase/01_schema.sql`
2. `supabase/02_seed_checklist.sql`

(Step 3 below comes before `03_first_admin.sql`.)

### 3. Create your login, then make yourself admin
1. **Authentication > Users > Add user > Create new user.** Enter your work email and a password. Tick **Auto Confirm User**.
2. Open `supabase/03_first_admin.sql`, replace `you@example.com` with that exact email, and run it in the SQL Editor.

### 4. Turn off public sign-ups (recommended)
**Authentication > Sign In / Providers (or Settings) > disable "Allow new users to sign up".**
Only people you add manually in step 5 can then log in.

### 5. Connect the app
**Project Settings > API**: copy the **Project URL** and the **anon public** key into `config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...",
  admins: []
};
```

> Only use the **anon** key. Never put the `service_role` key in this project.

### 6. Test locally (optional)
```bash
cd tsi-quality-hub
python3 -m http.server 8080      # then open http://localhost:8080
```
Sign in with the user from step 3. The sidebar should show **Owner**.

### 7. Deploy to Vercel
**Option A, Git (recommended):** push this folder to a GitHub repo, then in Vercel choose **Add New > Project**, import the repo, and click **Deploy**. Leave Framework Preset as **Other** and the build/output settings empty.

**Option B, CLI:**
```bash
npm i -g vercel
cd tsi-quality-hub
vercel --prod
```

Every later change to `config.js` or `index.html` needs a redeploy.

### 8. Add your team
1. Sign in > **Team Members** > add each person with their **work email**, **Role**, and **Designation**.
2. In Supabase **Authentication > Users**, create a login for each person using the **same email**.

---

## Who can do what

Access is decided by the person's record in **Team Members**, matched on email. It is enforced in the database, not just the screen.

| Person | Can do |
|---|---|
| Owner (listed in `qa_admins`) | Everything |
| Role **Team Lead**, or designation **Associate Process Manager / Process Manager / Tower Head** | Everything: edit members, leaves, checklist; run and delete audits |
| Role **QA** | View everything; run, save and override audits |
| Role **Designer** (or not listed) | View only |

Members marked **Inactive** lose their access.

---

## How the data is stored

One table, `qa_records`, with a `coll` column that says what the row is.

| `coll` | Contents |
|---|---|
| `audits` | Every audit: site ID, designer, QA, per-checkpoint results, fail count, score, timing, overrides |
| `members` | Team members: name, employee ID, designation, role, email, status |
| `leaves` | Vacation / sick / emergency leave entries |
| `config` | App settings; `config/checklist` holds the checklist text |

Each row's payload is JSON in the `data` column, so new fields added to the app need no database change. `created_at`, `updated_at` and `updated_by` are filled automatically.

For SQL/BI reporting there is a ready-made view, `qa_audits_flat`:
```sql
select designer, count(*) audits, round(avg(score),1) avg_score
from qa_audits_flat
where status <> 'ongoing'
group by designer order by audits desc;
```

---

## Maintenance

- **Backups:** Free-tier projects don't get automatic restorable backups. Periodically export with the **History** tab's CSV download, or in SQL Editor run `select * from qa_records` > **Download CSV**. Paid plans include daily backups.
- **Free tier pausing:** Free projects pause after about a week with no activity. Restore from the dashboard if that happens.
- **Staying signed in:** the app refreshes login tokens automatically. Sessions end when the browser tab is closed. You can lengthen token life under **Authentication > Sessions / JWT settings**.
- **Large history:** the app loads data in pages of 1000 rows, so there is no row cap.
- **Changing the checklist:** edit it in the app (**Checklist** tab). `02_seed_checklist.sql` only seeds it once and will not overwrite your edits.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Page opens with "Demo · full access" and no login | `config.js` is empty or wrong. Fill in the URL and anon key, redeploy. |
| "Sign in failed / Invalid login credentials" | The user doesn't exist, or the password is wrong. Check **Authentication > Users**. |
| Signed in but badge says "Guest · view only" | No active Team Members record has the same email as the login. Add one (an owner can do this), or add the email via `03_first_admin.sql`. |
| "new row violates row-level security policy" | The signed-in person's role doesn't allow that action (see the table above). |
| "relation qa_admins does not exist" toast | `01_schema.sql` wasn't run (or failed). Re-run it. |
| Changes by others appear after a delay | Data refreshes every 20 seconds. |

---

## Security notes
- The **anon key is public by design**; what protects the data is Row Level Security in `01_schema.sql`. Without a signed-in user, the database returns nothing.
- Keep sign-ups disabled so only people you create can log in.
- Use strong passwords (Supabase **Authentication > Password settings** lets you require more).
- Never commit or share the `service_role` key or the database password.
