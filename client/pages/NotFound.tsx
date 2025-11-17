import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname,
      );
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-muted px-6">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <span className="text-6xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">Page Not Found</h1>
        <p className="text-lg text-foreground/70 mb-8">
          The page you're looking for doesn't exist. This might be a placeholder page. Feel free to ask the user to continue prompting to fill in this page's contents if needed!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Home className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          )}
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
