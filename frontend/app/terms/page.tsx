import Link from "next/link";

export const metadata = {
  title: "Terms of Service | NOTE OS",
  description: "Read the terms that apply when using NOTE OS.",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "64px 24px", color: "#242a25", lineHeight: 1.75 }}>
      <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>← NOTE OS</Link>
      <h1 style={{ fontSize: "2.4rem", lineHeight: 1.2, marginTop: 32 }}>Terms of Service</h1>
      <p style={{ color: "#68736b" }}>Last updated: October 25, 2026</p>

      <p>
        These Terms of Service (“Terms”) govern your access to and use of NOTE
        OS and its related features (the “Service”). By using the Service, you
        agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        NOTE OS is a notes and workspace application. Its features may include
        creating and organizing notes, collaborating in workspaces, sharing
        selected content through public links, and connecting supported
        third-party services.
      </p>

      <h2>2. Accounts and security</h2>
      <p>
        You are responsible for providing accurate account information,
        maintaining the security of your sign-in credentials, and activity
        carried out through your account. Notify us if you believe your account
        has been accessed without your permission. We may restrict access when
        reasonably necessary to protect the Service or its users.
      </p>

      <h2>3. Your content</h2>
      <p>
        You retain your rights to the notes, files, and other content you submit
        to NOTE OS. You grant us permission to host, store, process, and display
        that content only as reasonably necessary to operate, secure, and
        provide the Service and the features you choose to use.
      </p>
      <p>
        You are responsible for your content and for ensuring that you have the
        rights and permissions needed to store or share it.
      </p>

      <h2>4. Public sharing and workspaces</h2>
      <p>
        You are responsible for managing workspace membership, invitations, and
        sharing permissions available in your account. Content shared through
        a public link may be accessible to anyone who obtains that link. Do not
        publish confidential or sensitive information unless you intend to
        make it accessible in that way.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful, fraudulent, or harmful activity.</li>
        <li>Attempt to gain unauthorized access to accounts, systems, or data.</li>
        <li>Interfere with or disrupt the operation or security of the Service.</li>
        <li>Upload malicious code or content that infringes another person’s rights.</li>
        <li>Abuse integrations, public links, or other features to violate these Terms or applicable law.</li>
      </ul>

      <h2>6. Third-party services</h2>
      <p>
        NOTE OS may allow you to connect third-party products and services.
        Those services are provided by their respective operators and may be
        governed by separate terms and privacy policies. We are not responsible
        for third-party services or changes they make to their products.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        We may add, change, suspend, or discontinue features of the Service.
        We do not guarantee that the Service will always be available,
        uninterrupted, or error-free. We may perform maintenance or make
        changes needed to operate and improve NOTE OS.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        To the extent permitted by applicable law, the Service is provided on
        an “as is” and “as available” basis, without warranties of any kind,
        whether express or implied. You are responsible for keeping copies of
        important content that you cannot afford to lose.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent permitted by applicable law, NOTE OS and its operators
        will not be liable for indirect, incidental, special, consequential, or
        punitive damages, or for loss of data, profits, or business arising
        from your use of or inability to use the Service. Nothing in these
        Terms excludes liability that cannot lawfully be excluded.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        You may stop using NOTE OS at any time. We may suspend or terminate
        access if we reasonably believe that you have violated these Terms,
        created a security risk, or used the Service in a way that may cause
        harm. Where appropriate, we will provide notice or an opportunity to
        address the issue.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. The updated version will
        be posted on this page with a revised “Last updated” date. Continued
        use of the Service after updated Terms take effect means you accept
        those changes.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:gurnanivansh57@gmail.com">gurnanivansh57@gmail.com</a>.
      </p>

      <p style={{ marginTop: 48, color: "#68736b" }}>
        <Link href="/privacy" style={{ color: "inherit" }}>Privacy Policy</Link>
      </p>
    </main>
  );
}
