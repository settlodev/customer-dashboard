import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function CancelButton() {
  const router = useRouter();

  return (
    <motion.div
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button type="button" variant="secondary" onClick={() => router.back()}>
        Cancel
      </Button>
    </motion.div>
  );
}
