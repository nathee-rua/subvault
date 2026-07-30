import AppShell from '@/components/AppShell';

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
