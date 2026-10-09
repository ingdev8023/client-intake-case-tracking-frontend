import { LogIn } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { PageFooter } from "../components/PageFooter.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
            <h1 id="login-title">CCT</h1>
            <p>Client Intake and Case Tracking</p>
          </div>
        <form className="login-form" onSubmit={handleSubmit}>  
          <div className="login-field">
           <label htmlFor="email">Email</label>
           <input autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
              placeholder="name@firm.com"
              className="login-input"/>
         </div>
          
          <div className="login-field">
           <label htmlFor="password">Password</label>
           <input autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
              placeholder="***************"
              className="login-input"
             />
         </div>
         {error && <div className="form-error">{error}</div>}

          <button className="login-button" disabled={isSubmitting} type="submit">
            <LogIn size={16} />
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
      <PageFooter></PageFooter>
    </main>
    
  );
}
