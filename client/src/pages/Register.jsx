import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Layers,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Name validation rules
  const nameErrors = useMemo(() => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters long';
    if (name.trim().length > 50) return 'Name cannot exceed 50 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
      return 'Name can only contain alphabetic letters, spaces, hyphens, and dots';
    }
    return '';
  }, [name]);

  // Email validation rules
  const emailErrors = useMemo(() => {
    if (!email.trim()) return 'Email address is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email format (e.g., name@example.com)';
    }
    return '';
  }, [email]);

  // Password individual criteria checks
  const passwordCriteria = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&#^()_\-+=\[\]{}|:;<>,.~]/.test(password),
    };
  }, [password]);

  // Password strength calculation (0 to 100%)
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (passwordCriteria.hasLength) score += 20;
    if (passwordCriteria.hasUpper) score += 20;
    if (passwordCriteria.hasLower) score += 20;
    if (passwordCriteria.hasNumber) score += 20;
    if (passwordCriteria.hasSpecial) score += 20;

    let label = 'Very Weak';
    let color = 'bg-rose-500';
    let textColor = 'text-rose-400';

    if (score >= 100) {
      label = 'Strong';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-400';
    } else if (score >= 80) {
      label = 'Good';
      color = 'bg-indigo-500';
      textColor = 'text-indigo-400';
    } else if (score >= 60) {
      label = 'Fair';
      color = 'bg-amber-500';
      textColor = 'text-amber-400';
    } else if (score >= 40) {
      label = 'Weak';
      color = 'bg-rose-400';
      textColor = 'text-rose-400';
    }

    return { score, label, color, textColor };
  }, [passwordCriteria]);

  const isPasswordValid =
    passwordCriteria.hasLength &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  // Confirm password validation
  const confirmPasswordErrors = useMemo(() => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  }, [password, confirmPassword]);

  // Overall form validity
  const isFormValid =
    !nameErrors &&
    !emailErrors &&
    isPasswordValid &&
    !confirmPasswordErrors;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      setError('Please resolve all validation errors before proceeding');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-500/25">
            <Layers className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
            Create your Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Join Sync<span className="text-indigo-400">Forge</span> with robust real-time collaboration
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                {touched.name && !nameErrors && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Valid
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Karthikeyan T"
                  className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    touched.name && nameErrors
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : touched.name && !nameErrors
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
              {touched.name && nameErrors && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{nameErrors}</span>
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                {touched.email && !emailErrors && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Valid
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@company.com"
                  className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    touched.email && emailErrors
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : touched.email && !emailErrors
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
              {touched.email && emailErrors && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{emailErrors}</span>
                </p>
              )}
            </div>

            {/* Password with Strength Meter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {password && (
                  <span className={`text-[11px] font-bold ${passwordStrength.textColor}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a strong password"
                  className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    touched.password && !isPasswordValid
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : touched.password && isPasswordValid
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Progress Bar */}
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Real-Time Password Requirements Checklist */}
              <div className="mt-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Password Requirements:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasLength ? 'text-emerald-400 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasLength ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                    )}
                    <span>8+ characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasUpper ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                    )}
                    <span>1 uppercase letter (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasLower ? 'text-emerald-400 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasLower ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                    )}
                    <span>1 lowercase letter (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasNumber ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                    )}
                    <span>1 numeric digit (0-9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 sm:col-span-2 ${
                      passwordCriteria.hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasSpecial ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1 mr-1" />
                    )}
                    <span>1 special character (!@#$%^&*...)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                {confirmPassword && !confirmPasswordErrors && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Matched
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Repeat your password"
                  className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    touched.confirmPassword && confirmPasswordErrors
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : touched.confirmPassword && !confirmPasswordErrors
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
              {touched.confirmPassword && confirmPasswordErrors && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{confirmPasswordErrors}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
