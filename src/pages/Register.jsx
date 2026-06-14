import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import Modal from '../components/Modal';

export default function Register() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState('');

  // OTP Modal states
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setFormError('You must agree to the Terms & Conditions');
      return;
    }

    // Open OTP Verification Modal
    setIsOtpModalOpen(true);
    addToast('Simulated OTP code sent to: ' + phone, 'info');
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setOtpError('');
    
    if (otpCode !== '1234') {
      setOtpError('Invalid OTP code. For testing, please enter "1234".');
      return;
    }

    setVerifyingOtp(true);
    
    // Simulate brief API delays
    setTimeout(() => {
      const success = register({ name, email, phone, password });
      setVerifyingOtp(false);
      
      if (success) {
        setIsOtpModalOpen(false);
        addToast('Welcome to NammaOorKaruvattuKadai! Your account has been registered.', 'success');
        navigate('/');
      } else {
        setIsOtpModalOpen(false);
        setFormError('Registration failed. The email might already be taken.');
      }
    }, 1000);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-brand-sand/35 py-12 px-4 sm:px-6 lg:px-8 font-inter palm-leaf-pattern">
      <div className="max-w-md w-full bg-white border border-brand-sand rounded-3xl p-8 shadow-xl relative border-b-8 border-b-brand-sand">
        
        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark/50 hover:text-brand-primary mb-6 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" /> Back to Login
        </Link>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="bg-brand-primary text-brand-cream p-3.5 rounded-full w-max mx-auto shadow-inner">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.15,6.08L2.09,20.14a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l2.06-2.06A9.89,9.89,0,0,0,12,22a10,10,0,0,0,10-10C22,5.2,16.5,2,12,2Zm5,11H7a1,1,0,0,1,0-2H17a1,1,0,0,1,0,2Z" />
            </svg>
          </div>
          <h2 className="font-tiro-tamil text-xl md:text-2xl text-brand-primary font-bold">
            கணக்கு துவங்குதல்
          </h2>
          <p className="font-playfair text-xs md:text-sm text-brand-dark/55 font-bold">
            Create an account to order sun-dried foods
          </p>
        </div>

        {/* Form or global auth error */}
        {(formError || error) && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            <span>{formError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark/70">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Balaji S"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <User className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark/70">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. balaji@gmail.com"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <Mail className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark/70">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210 (10 digits)"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <Phone className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark/70">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <Lock className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-brand-dark/70">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-brand-cream border border-brand-sand/75 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/35 font-medium"
              />
              <Lock className="w-4.5 h-4.5 text-brand-dark/40 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Agree Terms Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-brand-dark/75 cursor-pointer font-medium pt-1">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="accent-brand-primary w-4.5 h-4.5 border-brand-sand rounded mt-0.5 shrink-0"
            />
            <span>I agree to the Terms of Service and Privacy Policy. Sourced fish is subject to traditional drying times.</span>
          </label>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-brand-primary text-brand-cream py-3.5 rounded-xl text-sm font-bold hover:bg-brand-secondary active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-brand-dark/65 font-medium">
          <span>Already have an account? </span>
          <Link to="/login" className="text-brand-primary hover:underline font-bold">
            Sign In
          </Link>
        </div>

      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        title="Mobile Verification Required"
      >
        <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs font-semibold text-center">
          <p className="text-brand-dark/70 text-sm leading-relaxed mb-4">
            We have sent a 4-digit verification code (OTP) to your phone number <strong>{phone}</strong>.
          </p>

          <div className="bg-brand-cream border border-brand-sand/70 p-3 rounded-2xl text-[11px] text-brand-primary max-w-xs mx-auto mb-4 font-bold">
            ⚠️ TESTING CODE: Enter <code className="bg-white border px-1.5 py-0.5 rounded font-mono">1234</code> to verify.
          </div>

          {otpError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center justify-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <div className="flex justify-center py-2">
            <input
              type="text"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 1234"
              className="bg-brand-cream border border-brand-sand rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none w-36 focus:border-brand-primary"
            />
          </div>

          <div className="flex gap-3 pt-4 font-bold">
            <button
              type="button"
              onClick={() => setIsOtpModalOpen(false)}
              className="flex-1 border border-brand-sand py-2.5 rounded-xl hover:bg-brand-sand/20 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifyingOtp}
              className="flex-1 bg-brand-primary text-brand-cream py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all text-xs shadow disabled:opacity-50"
            >
              {verifyingOtp ? 'Verifying...' : 'Verify & Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
