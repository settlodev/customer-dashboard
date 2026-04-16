"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Mail, Phone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logout } from "@/lib/actions/auth-actions";

function AccountSuspendedPage() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 pt-12">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
            </motion.div>

            <CardTitle className="text-2xl font-bold text-gray-900">
              Account Suspended
            </CardTitle>

            <CardDescription className="mt-3 text-gray-600 max-w-sm mx-auto">
              Your subscription has been suspended due to a prolonged overdue
              payment. Access to your dashboard and data has been temporarily
              restricted.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-12 px-8 pt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-red-800">
                  What does this mean?
                </p>
                <ul className="text-sm text-red-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    You cannot access your dashboard, POS, or reports
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    Your data is safe and will be available once reactivated
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    Contact our support team to resolve the outstanding balance
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 text-center">
                  Reach out to get your account reactivated
                </p>

                <div className="grid gap-3">
                  <a
                    href="mailto:support@settlo.co.tz"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Support</p>
                      <p className="text-xs text-gray-500">support@settlo.co.tz</p>
                    </div>
                  </a>

                  <a
                    href="tel:+255753000000"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Call Support</p>
                      <p className="text-xs text-gray-500">+255 753 000 000</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default AccountSuspendedPage;
