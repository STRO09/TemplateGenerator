/**
 * Build an email verification template.
 *
 * @param {Object} options
 *
 * @param {string} options.verificationUrl
 * Verification link.
 *
 * @returns {{
 *   subject: string,
 *   html: string
 * }}
 */
export default function emailVerificationTemplate({ verificationUrl }) {
  return {
    subject: "Verify your email",

    html: `
      <h2>Verify your email address</h2>

      <p>
        Thank you for signing up.
      </p>

      <p>
        Click the link below to verify your email:
      </p>

      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>

      <p>
        If you didn't create this account,
        you can safely ignore this email.
      </p>
    `,
  };
}
