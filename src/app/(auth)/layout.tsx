import AuthProvider from "@/components/providers/AuthProvider";

/**
 * Auth route group layout — no sidebar/header, just centered content.
 * AuthProvider is needed so LoginForm can use signIn() from next-auth/react.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
