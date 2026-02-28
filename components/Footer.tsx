export default function Footer() {
  return (
    <footer className="bg-primaryDark text-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p>© 2026 Fake Internship Detector</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:underline">
            GitHub
          </a>
          <a href="#" className="hover:underline">
            Contact
          </a>
          <a href="#" className="hover:underline">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}