# Portfolio with Gmail enquiries

`index.html` is the portfolio. `api/enquiry.js` is a Vercel serverless function that emails every enquiry to your Gmail through the Gmail API.

## One-time Gmail API setup (about 10 minutes)

1. Go to https://console.cloud.google.com and create a project.
2. APIs & Services > Library > enable **Gmail API**.
3. APIs & Services > OAuth consent screen: choose External, fill the app name and your email, add yourself (rsjerin33@gmail.com) as a **Test user**.
4. APIs & Services > Credentials > Create credentials > **OAuth client ID** > Web application.
   Add this Authorized redirect URI: `https://developers.google.com/oauthplayground`
   Copy the **Client ID** and **Client secret**.
5. Open https://developers.google.com/oauthplayground, click the gear icon, tick **Use your own OAuth credentials**, paste the Client ID and secret.
6. In Step 1 enter the scope `https://www.googleapis.com/auth/gmail.send`, click Authorize APIs and sign in as rsjerin33@gmail.com.
7. In Step 2 click **Exchange authorization code for tokens** and copy the **Refresh token**.
   (While the app is in Testing mode, Google expires this token after 7 days. In the OAuth consent screen click **Publish app** to make it permanent. Only the gmail.send scope is used.)

## Deploy on Vercel

1. Push this folder to a GitHub repo, then import it at https://vercel.com/new.
2. Add three environment variables: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`.
3. Deploy. Submit the contact form on the live site; the enquiry arrives in your inbox with the visitor's email as Reply-To.

Never put these three values in `index.html` or commit them to GitHub.
