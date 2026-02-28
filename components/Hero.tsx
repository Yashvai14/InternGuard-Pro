import Link from "next/link";

export default function Hero() {
  return (
    <div>
    <section className="bg-linear-to-br from-lightNeutral to-lightLavender min-h-screen flex justify-between items-center">
      <div className="max-w-300 mx-auto py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-primaryDark">
            Detect Fake Internships Before You Apply
          </h1>
          <p className="text-lg mb-8 text-primaryDark">
            AI-powered scam risk analysis that evaluates internship and job posts
            for suspicious patterns, manipulation tactics, and fraud indicators.
          </p>

          <div className="flex gap-4">
            <Link
              href="/analyze"
              className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition"
            >
              Check a Job Post
            </Link>

            <a
              href="#how-it-works"
              className="border border-primaryDark px-6 py-3 rounded-xl hover:bg-gray-400 hover:text-white transition text-primaryDark"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl items-center max-w-2xl mx-auto shadow-xl p-6 border border-softBeige">
          <h3 className="text-xl font-semibold mb-4 text-primaryDark">
            Sample Analysis
          </h3>
          <div className="bg-lightNeutral p-4 rounded-xl">
            <p className="mb-2 font-medium text-primaryDark">Risk Score:</p>
            <p className="text-3xl font-bold text-red-600">78 – High Risk</p>
            <p className="mt-4 text-sm text-primaryDark">
              Mentions upfront registration fee and unrealistic stipend promise.
            </p>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}