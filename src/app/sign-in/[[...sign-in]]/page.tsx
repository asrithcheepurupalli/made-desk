import React from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Shield, Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Sign In: made. desk",
};

export default function SignInPage() {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-screen bg-[#f6f3ee] flex flex-col justify-center items-center p-4 selection:bg-[#c8102e] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-[#16130f] shadow-[2px_2px_0px_#16130f] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#c8102e]" />
            <span className="font-mono uppercase font-bold text-xs tracking-wider text-[#16130f]">
              Internal Agency OS
            </span>
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f]">
            made. desk
          </h1>
          <p className="font-sans text-xs text-[#7c7770]">
            Operational dashboard & grounded intelligence assistant for made. by ac.
          </p>
        </div>

        {/* Auth Box */}
        {hasClerkKey ? (
          <div className="bg-white border-2 border-[#16130f] p-6 shadow-[4px_4px_0px_#16130f]">
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary:
                    "bg-[#16130f] hover:bg-[#c8102e] text-white font-mono text-xs uppercase tracking-wider rounded-none py-2.5 transition-colors",
                  card: "shadow-none border-0 p-0",
                  headerTitle: "font-display font-bold text-xl text-[#16130f]",
                  headerSubtitle: "font-sans text-xs text-[#7c7770]",
                  socialButtonsBlockButton:
                    "border-2 border-[#16130f] rounded-none font-mono text-xs hover:bg-[#f6f3ee] transition-colors",
                  formFieldInput:
                    "border-2 border-[#16130f] rounded-none font-sans text-xs p-2.5 bg-[#f6f3ee] focus:bg-white",
                  footerActionLink: "text-[#c8102e] hover:underline font-mono text-xs",
                },
              }}
            />
          </div>
        ) : (
          <div className="bg-white border-2 border-[#16130f] p-6 shadow-[4px_4px_0px_#16130f] space-y-4">
            <div className="flex items-center gap-2 text-[#bd9b4e]">
              <Shield className="w-5 h-5" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#16130f]">
                Local Dev Mode Active
              </span>
            </div>
            <p className="font-sans text-xs text-[#7c7770] leading-relaxed">
              No Clerk authentication keys detected. Studio access gate is running in local zero-config bypass mode.
            </p>
            <Link
              href="/inbox"
              className="brutal-btn-red w-full py-2.5 flex items-center justify-center gap-2 text-xs"
            >
              <span>Enter made. desk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#7c7770]">
            made. by ac · Authorized Agency Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
