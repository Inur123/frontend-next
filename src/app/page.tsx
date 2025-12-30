import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Frontend Next.js</h1>
      <p>Pilih menu:</p>
      <ul>
        <li>
          <Link href="/register">Register</Link>
        </li>
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/me">Me (Profile)</Link>
        </li>
      </ul>
    </div>
  );
}
