export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 text-gray-600 py-6 border-t border-gray-200 dark:border-gray-800">
      <div className="container">
        <div className="text-center text-sm">
          <p>
            &copy; 2025{" "}
            <a
              href="https://myzone.ai"
              className="text-primary-500 hover:text-primary-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              MyZone AI
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
