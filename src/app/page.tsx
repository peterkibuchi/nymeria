import { AuthTest } from "./_components/auth-test";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <AuthTest />
      </div>
    </main>
  );
}
