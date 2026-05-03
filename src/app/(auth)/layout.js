export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface flex">

      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 flex-col justify-between p-12 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/3" />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-display text-3xl font-bold text-white">
            Grade<span className="text-amber">Mee</span>
          </span>
          <p className="text-white/40 text-sm mt-1">Assessment Platform</p>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <h2 className="font-display text-4xl font-bold text-white leading-snug">
              Smart assessments<br />
              for every teacher.
            </h2>
            <p className="text-white/50 text-base mt-4 leading-relaxed max-w-sm">
              Create, share, and analyse assessments for any subject,
              any class — in minutes, not hours.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {[
              { icon: '✏️', text: 'Create assessments manually or with AI' },
              { icon: '🔗', text: 'Share via link — no student account needed' },
              { icon: '📊', text: 'See results and analytics instantly' },
              { icon: '📖', text: 'Step-by-step explanations for students' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm flex-shrink-0">
                  {f.icon}
                </span>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} GradeMee. Built for teachers everywhere.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      {/*
        Mobile: full width, vertically centred, safe padding on all screen sizes.
        The login/signup page components each render their own top bar with the
        logo — no logo is rendered here to avoid duplication on mobile.
      */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {children}
      </div>

    </div>
  )
}