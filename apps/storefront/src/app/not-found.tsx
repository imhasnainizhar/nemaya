import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="font-display text-8xl text-clay">404</p>
      <h1 className="font-display mt-4 text-4xl">This path is overgrown.</h1>
      <p className="mt-2 text-stone">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="btn-primary mt-8">Back home</Link>
    </div>
  )
}
