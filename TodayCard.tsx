import Link from "next/link";

export default function TodayCard({ title, headline, detail, href }: { title: string; headline: string; detail: string; href: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-muted">{title}</p>
      <p className="font-display text-3xl font-bold">{headline}</p>
      <p className="text-muted">{detail}</p>
    </Link>
  );
}
