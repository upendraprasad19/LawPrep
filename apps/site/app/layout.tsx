import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Law Prep — Your way into law', description: 'Explore law entrance routes and build a clear preparation journey.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
