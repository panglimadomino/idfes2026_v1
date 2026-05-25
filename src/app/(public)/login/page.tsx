import { LoginForm } from "./_components/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next ?? "/admin";
  const unauthorized = params.error === "unauthorized";

  return <LoginForm nextPath={nextPath} unauthorized={unauthorized} />;
}

