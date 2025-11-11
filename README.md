# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ecf51352-32c4-4be5-85f8-159894d1fb33

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ecf51352-32c4-4be5-85f8-159894d1fb33) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ecf51352-32c4-4be5-85f8-159894d1fb33) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Resend Email Configuration

This project uses [Resend](https://resend.com) for sending lead notification emails to buyers.

### Setup Instructions

1. **Create a Production API Key**
   - Go to [Resend API Keys](https://resend.com/api-keys)
   - Create a new API key (NOT a test key starting with `re_test_`)
   - Copy the production key

2. **Verify Your Domain**
   - Go to [Resend Domains](https://resend.com/domains)
   - Verify the domain `adsroutehub.com` (already configured for production)
   - Ensure DNS records are properly set up

3. **Configure the Edge Function Secret**
   - In your Lovable project, add the secret `RESEND_API_KEY` with your production key
   - The edge function will automatically validate that it's a production key (not `re_test_`)
   - Redeploy the `lead-intake` function after updating secrets (secrets are loaded at cold start)

4. **Email Configuration**
   - The system uses `leads@adsroutehub.com` as the sender address
   - This must match your verified domain
   - All emails are sent to buyer email addresses configured in the system

### Development Testing

For local development, you can optionally set `ALLOW_TEST_SEND_TO_OWNER=true` to bypass the test key check. However, this is not recommended for production.

### Logging

The lead-intake function logs detailed information for each email:
- `[Lead Email] sending` - Before sending (includes buyerId, leadId, recipient)
- `[Lead Email] sent` - On success (includes Resend message ID)
- `[Lead Email] failed` - On error (includes error details)
- `[Lead Email] skip` - If email is skipped (missing address, test lead, etc.)
