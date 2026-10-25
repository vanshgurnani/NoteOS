import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | NOTE OS",
  description: "Learn how NOTE OS collects, uses, and protects information.",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "64px 24px", color: "#242a25", lineHeight: 1.75 }}>
      <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>← NOTE OS</Link>
      <h1 style={{ fontSize: "2.4rem", lineHeight: 1.2, marginTop: 32 }}>Privacy Policy</h1>
      <p style={{ color: "#68736b" }}>Last updated: October 25, 2026</p>

      <p>
        This Privacy Policy explains how NOTE OS (“we,” “us,” or “our”) handles
        information when you use the NOTE OS application and related services
        (the “Service”).
      </p>

      <h2>1. Information we may collect</h2>
      <ul>
        <li><strong>Account information:</strong> information such as your name, email address, and authentication details when you register or sign in.</li>
        <li><strong>Your content:</strong> notes, documents, workspace information, and other content you create, upload, or store through the Service.</li>
        <li><strong>Usage and technical information:</strong> information such as device and browser details, log data, and diagnostic information that may be generated when the Service is used.</li>
        <li><strong>Integration information:</strong> information and permissions needed to connect services you choose to use with NOTE OS.</li>
      </ul>

      <h2>2. How we use information</h2>
      <p>We may use information to:</p>
      <ul>
        <li>Provide, operate, and maintain NOTE OS and its features.</li>
        <li>Create and manage accounts, workspaces, and access permissions.</li>
        <li>Store, retrieve, and display your notes and other content.</li>
        <li>Enable integrations and actions that you explicitly configure.</li>
        <li>Protect the Service, troubleshoot issues, and prevent misuse.</li>
        <li>Respond to support requests and communicate important service updates.</li>
      </ul>

      <h2>3. Google sign-in</h2>
      <p>
        If you choose Google sign-in, Google provides the account information
        required for authentication, such as your email address and basic
        profile information permitted by the sign-in flow. NOTE OS does not
        receive your Google account password. Google’s use of information is
        governed by Google’s own privacy policy.
      </p>

      <h2>4. Storage and service providers</h2>
      <p>
        NOTE OS uses third-party infrastructure and service providers to host
        the application, store data, and support its operation. Information may
        be processed by those providers on our behalf. We aim to use providers
        and access controls appropriate to the Service, but no method of
        transmission or storage is completely secure.
      </p>

      <h2>5. Sharing and connected services</h2>
      <p>
        Your notes and workspace content are intended to be available according
        to the access settings and permissions in NOTE OS. If you create a
        public note link, anyone who has that link may be able to view the
        shared content. You are responsible for reviewing content before
        making it public.
      </p>
      <p>
        When you connect an external service or use an integration, relevant
        information may be exchanged with that service to carry out the action
        you requested. The external service’s own terms and privacy policy also
        apply.
      </p>
      <p>We do not sell your personal information.</p>

      <h2>6. Retention and deletion</h2>
      <p>
        We retain information for as long as it is needed to provide the
        Service, maintain your account, meet legitimate operational needs, or
        comply with applicable legal obligations. You may contact us to request
        help with account or data deletion. Some information may remain in
        backups or records for a limited period where necessary.
      </p>

      <h2>7. Your choices</h2>
      <p>
        You can choose what information to provide, manage connected services
        through the relevant settings where available, and avoid creating
        public links for content you want to keep private. You may contact us
        with questions or requests relating to your information.
      </p>

      <h2>8. Children’s privacy</h2>
      <p>
        NOTE OS is not intended for children under 13, and we do not knowingly
        collect personal information from children under 13.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy as the Service changes. Any updated
        version will be published on this page with a revised “Last updated”
        date.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy questions or requests, contact us at{" "}
        <a href="mailto:gurnanivansh57@gmail.com">gurnanivansh57@gmail.com</a>.
      </p>

      <p style={{ marginTop: 48, color: "#68736b" }}>
        <Link href="/terms" style={{ color: "inherit" }}>Terms of Service</Link>
      </p>
    </main>
  );
}
