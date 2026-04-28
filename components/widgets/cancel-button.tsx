import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

interface CancelButtonProps {
  disabled?: boolean;
}

export default function CancelButton({ disabled }: CancelButtonProps = {}) {
  const router = useRouter();

  return (
    <motion.div
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => router.back()}
      >
        Cancel
      </Button>
    </motion.div>
  );
}
