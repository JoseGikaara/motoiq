import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 py-4 px-6 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">
          Motor<span className="text-blue-400">IQ</span>
        </Link>
        <span className="text-xs text-slate-500">Privacy & data protection</span>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold text-white mb-2">Privacy Notice</h1>
        <p className="text-slate-400">
          This privacy notice explains how MotorIQ (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, and protects
          information about car dealers and their customers. It is inspired by Kenya&apos;s Data Protection Act (DPA) and
          GDPR best practices.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Data we collect</h2>
          <p className="text-slate-400">We process the following categories of data:</p>
          <ul className="list-disc pl-5 text-slate-400 space-y-1">
            <li>Dealer account information: name, email, phone, dealership details.</li>
            <li>Lead and customer information: names, contact details, preferences, enquiry details.</li>
            <li>Vehicle information: make, model, year, price, media assets and specifications.</li>
            <li>Usage and analytics data: page views, clicks, device information and basic event logs.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. How we use data</h2>
          <p className="text-slate-400">We use this data to:</p>
          <ul className="list-disc pl-5 text-slate-400 space-y-1">
            <li>Provide the MotorIQ CRM, hosted websites and AI tooling to dealers.</li>
            <li>Route and track leads from public pages and campaigns.</li>
            <li>Send operational notifications (e.g. lead alerts, test drive reminders).</li>
            <li>Maintain security, monitor uptime, and improve product performance.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Lawful basis</h2>
          <p className="text-slate-400">
            Our primary lawful bases under the Kenya DPA and GDPR are: performance of a contract (providing MotorIQ to
            dealers), legitimate interests (fraud prevention, service improvement), and consent (for marketing where
            required).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Cookies & tracking</h2>
          <p className="text-slate-400">
            Dealer websites may use cookies or similar technologies for basic analytics and to remember visitor
            preferences. Non-essential cookies are only activated after a visitor accepts the consent banner.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">5. Data sharing & storage</h2>
          <p className="text-slate-400">
            We host data with reputable cloud providers. We do not sell personal data. Limited data may be shared with
            third-party processors (for example, email or SMS providers, cloud hosting, and analytics tools) strictly for
            providing the service, under data protection agreements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">6. Data subject rights</h2>
          <p className="text-slate-400">
            Under the Kenya DPA and GDPR, individuals have rights to access, correct, delete, and restrict processing of
            their personal data, and in some cases to object or request portability. To exercise these rights, contact us
            using the details below. We may need to verify identity before responding.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">7. Retention</h2>
          <p className="text-slate-400">
            We retain dealer and lead data for as long as necessary to provide the service and meet legal or regulatory
            requirements. Dealers can delete leads or request account deletion; some data may remain in backups for a
            limited period.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">8. Security</h2>
          <p className="text-slate-400">
            We use technical and organisational measures to protect data, including TLS, access controls, audit logging
            and regular backups. No system is 100% secure, but we work to reduce risk and respond quickly to incidents.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">9. Contact</h2>
          <p className="text-slate-400">
            For privacy questions or requests, contact:
          </p>
          <p className="text-slate-300">
            Email: <a href="mailto:privacy@motoriq.co.ke" className="text-blue-400 underline">privacy@motoriq.co.ke</a>
          </p>
        </section>

        <p className="text-xs text-slate-500 pt-4">
          This notice may be updated from time to time to reflect product or regulatory changes.
        </p>
      </main>
    </div>
  );
}

