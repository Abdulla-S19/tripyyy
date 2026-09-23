export function StepHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <header>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand">
        {title}
      </h1>
      <p className="mt-2 max-w-xl text-slate">{lead}</p>
    </header>
  );
}
