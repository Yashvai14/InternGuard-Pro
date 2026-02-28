export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-lightNeutral py-20">
      <div className="max-w-6xl mx-auto px-6 text-center text-primaryDark">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-softBeige p-8 rounded-2xl shadow">
            <h3 className="text-xl font-semibold mb-4">
              1. Paste Job Description
            </h3>
            <p>Copy and paste the full internship or job description.</p>
          </div>
          <div className="bg-softBeige p-8 rounded-2xl shadow">
            <h3 className="text-xl font-semibold mb-4">
              2. AI Analyzes Risk
            </h3>
            <p>Model detects suspicious phrases and fraud signals.</p>
          </div>
          <div className="bg-softBeige p-8 rounded-2xl shadow">
            <h3 className="text-xl font-semibold mb-4">
              3. Get Risk Score
            </h3>
            <p>Receive a 0–100 risk score with explanation.</p>
          </div>
        </div>
      </div>
    </section>
  );
}