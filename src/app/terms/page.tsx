import Link from "next/link";
import { Briefcase } from "lucide-react";

export const metadata = {
  title: "Terms of Service & Privacy Policy — JobPilot",
};

const LAST_UPDATED = "September 10, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Briefcase className="size-4" />
        </span>
        JobPilot
      </Link>

      <h1 className="text-2xl font-semibold">Terms of Service & Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 max-w-none space-y-8 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:mt-0 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-0 [&_ul]:space-y-1.5">
        <section>
          <h2>1. What JobPilot is</h2>
          <p>
            JobPilot is a personal job-search organization tool. It helps you track job
            postings, manage applications, store resume versions, and — where you choose to use
            it — get AI assistance rewording your own resume content or drafting cover letters.
            JobPilot never submits a job application on your behalf without you personally
            reviewing and clicking submit; there is no &quot;auto-apply&quot; feature.
          </p>
        </section>

        <section>
          <h2>2. Your account</h2>
          <ul>
            <li>
              You may sign in with your email address or a unique username you choose at signup.
              Usernames are unique per platform and are not shared or made public to other users.
            </li>
            <li>You are responsible for keeping your password confidential.</li>
            <li>
              You must provide accurate information and may not create an account to impersonate
              another person or entity.
            </li>
            <li>
              An administrator of this platform may have visibility into account and usage data
              as described in Section 5, for the purpose of operating and supporting the
              platform.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. What data we store</h2>
          <p>To provide the service, JobPilot stores, on your behalf:</p>
          <ul>
            <li>Your profile information (name, contact details, career preferences).</li>
            <li>Resume content and every version you create or approve.</li>
            <li>
              Job postings you save or that are discovered from job boards you connect (via each
              board&apos;s public API — no scraping of private or authenticated data).
            </li>
            <li>Your applications, notes, interview records, and recruiter contacts.</li>
            <li>
              A record of AI-generated suggestions, including what was suggested and whether you
              approved it.
            </li>
          </ul>
          <p className="mt-3">
            Your data is isolated from other users&apos; data using database-level access
            controls (row-level security). Other users of this platform cannot see your resumes,
            applications, or personal information.
          </p>
        </section>

        <section>
          <h2>4. AI features and your resume content</h2>
          <p>
            If you use resume tailoring, cover-letter generation, or the job search assistant,
            the relevant text (e.g., your resume content and a job description) is sent to a
            third-party AI provider (currently Anthropic and/or OpenAI, depending on
            configuration) to generate a response. We do not send your data to train these
            providers&apos; models.
          </p>
          <p>
            <strong>Anti-fabrication commitment:</strong> AI features are instructed to only
            reword or reorder facts that already exist in your resume — never to invent
            companies, titles, technologies, certifications, degrees, or metrics you have not
            entered yourself. Every AI-suggested change is shown to you individually and requires
            your explicit approval before it becomes part of your active resume. You remain
            responsible for reviewing the accuracy of anything you approve or submit.
          </p>
        </section>

        <section>
          <h2>5. Administrator access</h2>
          <p>
            This platform has an administrator role used to operate and support it. Administrators
            can see account-level information (such as email, username, signup date, and usage
            metrics) and, where necessary for support, the content of your job search data (resumes,
            applications, jobs, etc.). Administrator access exists for platform management and
            troubleshooting, not for unrelated purposes, and administrators do not have the ability
            to submit applications, edit your resume content, or act on your account without your
            request.
          </p>
        </section>

        <section>
          <h2>6. Data retention & deletion</h2>
          <p>
            Your data is retained for as long as your account is active. You may request deletion
            of your account and associated data at any time by contacting the platform
            administrator; deletion removes your profile, resumes, applications, and related
            records from the database.
          </p>
        </section>

        <section>
          <h2>7. Third-party services</h2>
          <p>This platform relies on the following third-party services to operate:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — database, authentication, and file storage.
            </li>
            <li>
              <strong>Anthropic and/or OpenAI</strong> — AI text generation for optional resume
              tailoring, cover letters, and assistant features.
            </li>
            <li>
              <strong>Greenhouse, Lever, and Ashby</strong> — public job board APIs used to
              discover job postings you choose to track. No account credentials are shared with
              these services.
            </li>
          </ul>
        </section>

        <section>
          <h2>8. Changes to these terms</h2>
          <p>
            If these terms change materially, you will be asked to review and accept the updated
            version the next time you sign in.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            Questions about this policy or your data can be directed to the platform
            administrator.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          Back to sign up
        </Link>
      </p>
    </div>
  );
}
