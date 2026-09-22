import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "80px 16px" }}>
      <EmptyState
        title="Page not found"
        message="The page you're looking for doesn't exist or has moved."
        action={
          <Link className="btn btn-primary" to="/">
            Back to home
          </Link>
        }
      />
    </div>
  );
}
