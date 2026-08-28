import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Not available</h1>
      <p className="mt-2 text-sm text-stone-600">
        This record does not exist, or you do not have access. Employees cannot open another
        person’s goals or reviews by changing the URL.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm text-teal-800 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
