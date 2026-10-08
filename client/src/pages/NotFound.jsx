import { Link } from "react-router-dom";
import { primaryButton } from "../components/styles";

// Rendered by the catch-all route (path="*") when no other route matches the URL.
function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-16 text-center">
      <h1 className="font-display font-bold text-2xl md:text-3xl text-ink">
        This page doesn&rsquo;t exist
      </h1>
      <p className="text-sm text-muted mt-3">
        The link may be old, or the address may have a typo in it.
      </p>
      <Link to="/" className={`${primaryButton} mt-6`}>
        Go to the home page
      </Link>
    </div>
  );
}

export default NotFound;
