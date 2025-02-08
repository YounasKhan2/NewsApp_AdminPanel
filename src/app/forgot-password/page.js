'use client'
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        {/* Success Message */}
        {success ? (
          <div className="px-8 pb-8">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="text-green-800 font-medium">Check your email</h3>
                <p className="text-sm text-green-700 mt-1">
                  We've sent password reset instructions to {email}. Please check your inbox and spam folder.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Return to login
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Error Display */}
            {error && (
              <div className="mx-8 mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-5 w-5" />
                ) : (
                  'Send Reset Instructions'
                )}
              </button>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to login
                </a>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;