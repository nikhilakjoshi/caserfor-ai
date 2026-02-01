import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Brain,
  Shield,
  Scale,
  Users,
  Zap,
  BookOpen,
  Award,
} from "lucide-react"

const EB1A_CRITERIA = [
  { name: "Awards", desc: "National or international prizes" },
  { name: "Membership", desc: "Associations requiring outstanding achievement" },
  { name: "Published Material", desc: "About you in professional publications" },
  { name: "Judging", desc: "Judging the work of others in your field" },
  { name: "Original Contributions", desc: "Of major significance to the field" },
  { name: "Scholarly Articles", desc: "Authored in professional journals" },
  { name: "Exhibitions", desc: "Display of your work at artistic exhibitions" },
  { name: "Leading Role", desc: "In distinguished organizations" },
  { name: "High Salary", desc: "Commanding high remuneration" },
  { name: "Commercial Success", desc: "In the performing arts" },
]

const STEPS = [
  {
    icon: FileText,
    title: "Complete Intake",
    desc: "Fill out your background, achievements, and upload supporting documents.",
  },
  {
    icon: Brain,
    title: "AI Evaluation",
    desc: "Our AI evaluates your profile against all 10 EB-1A criteria with evidence search.",
  },
  {
    icon: Scale,
    title: "Get Your Report",
    desc: "Receive a detailed eligibility report with per-criterion scores and recommendations.",
  },
]

const VALUE_PROPS = [
  {
    icon: Zap,
    title: "Instant Analysis",
    desc: "Get your EB-1A eligibility assessment in minutes, not weeks.",
  },
  {
    icon: Shield,
    title: "Evidence-Backed",
    desc: "AI searches your uploaded documents for supporting evidence per criterion.",
  },
  {
    icon: BookOpen,
    title: "USCIS-Aligned",
    desc: "Evaluation criteria mirror actual USCIS adjudication standards.",
  },
  {
    icon: Users,
    title: "Built for Attorneys",
    desc: "Designed for immigration attorneys managing multiple EB-1A petitions.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          <span className="font-semibold text-lg">Casefor.ai</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/assistant"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Start Evaluation
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Know your EB-1A eligibility
          <br />
          before you file.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          AI-powered evaluation of your extraordinary ability petition. Upload
          your evidence, get a detailed criterion-by-criterion assessment
          aligned with USCIS standards.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Start Your Evaluation
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 border px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Try the Assistant
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white border mb-4">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EB-1A Criteria */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">
            All 10 EB-1A Criteria Evaluated
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            We assess your profile against every USCIS extraordinary ability
            criterion. You need to meet at least 3.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {EB1A_CRITERIA.map((c) => (
              <div
                key={c.name}
                className="flex items-start gap-3 p-3 bg-gray-50 border"
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Why Casefor.ai
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {VALUE_PROPS.map((vp) => (
              <div key={vp.title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-white border flex items-center justify-center">
                  <vp.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{vp.title}</h3>
                  <p className="text-sm text-muted-foreground">{vp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              Trusted by immigration attorneys
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Built on USCIS policy guidance and AAO precedent decisions.
            AI-generated reports are designed to supplement, not replace,
            professional legal judgment.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-20 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to assess your case?
          </h2>
          <p className="text-sm opacity-70 mb-8 max-w-md mx-auto">
            Complete the intake form and receive your AI-powered EB-1A
            eligibility report.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 text-sm font-medium hover:bg-background/90 transition-colors"
          >
            Start Your Evaluation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5" />
            <span>Casefor.ai</span>
          </div>
          <div>Not legal advice. Consult a qualified attorney.</div>
        </div>
      </footer>
    </div>
  )
}
