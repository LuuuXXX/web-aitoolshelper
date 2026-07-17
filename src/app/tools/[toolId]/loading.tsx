import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-64 rounded" style={{ background: 'var(--card-border)' }} />
            <div className="h-4 w-96 max-w-full rounded" style={{ background: 'var(--card-border)' }} />
            <div className="card h-64" />
            <div className="card h-40" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
