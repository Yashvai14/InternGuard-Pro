export default function Features() {
  return (
    <section className="bg-mutedGreen py-20">
      <div className="max-w-6xl mx-auto px-6 text-black">
        <h2 className="text-3xl font-bold text-center mb-12">
          Core Features
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-2">
              Risk Score (0–100)
            </h3>
            <p>
              Clear scoring system with Low, Moderate, High categorization.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-2">
              Keyword Highlighting
            </h3>
            <p>
              Flags suspicious phrases in the job description.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-2">
              Report History
            </h3>
            <p>
              Stores past analyses for review.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-2">
              User Feedback
            </h3>
            <p>
              Improves accuracy via legit/scam confirmation system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}