export default function Problem() {
  return (
    <section className="bg-lightLavender py-20">
      <div className="max-w-5xl mx-auto px-6 text-center text-primaryDark">
        <h2 className="text-3xl font-bold mb-10">
          Internship Scams Are Increasing — Students Are the Primary Targets
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-2xl font-bold">50%+</h3>
            <p>Online job posts lack verification mechanisms.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-2xl font-bold">High Risk</h3>
            <p>Students are targeted due to urgency and inexperience.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-2xl font-bold">Upfront Fees</h3>
            <p>Many fake internships demand registration payments.</p>
          </div>
        </div>

        <p className="max-w-3xl mx-auto">
          Scammers exploit desperation for experience, lack of awareness, and
          pressure tactics. Most students apply without verifying legitimacy.
        </p>
      </div>
    </section>
  );
}