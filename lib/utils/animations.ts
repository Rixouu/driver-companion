import { Variants } from "framer-motion";

/**
 * Global animation variants and utilities for consistent animations across the app
 */

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Slide up animation
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { 
      duration: 0.2
    }
  }
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: -50,
    transition: { 
      duration: 0.2
    }
  }
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: 50,
    transition: { 
      duration: 0.2
    }
  }
};

// Scale up animation
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { 
      duration: 0.2
    }
  }
};

// Staggered children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Item for staggered animations
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30
    }
  }
};

// Slider animations for direction-based transitions
export const sliderVariants = {
  enter: () => ({
    opacity: 0
  }),
  center: {
    opacity: 1,
    transition: {
      opacity: { duration: 0.4, ease: "easeInOut" }
    }
  },
  exit: () => ({
    opacity: 0,
    transition: {
      opacity: { duration: 0.3, ease: "easeOut" }
    }
  })
};

// Animation settings for page transitions
export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

// Animation settings for smooth scrolling
export const smoothScroll = {
  duration: 0.8,
  ease: [0.43, 0.13, 0.23, 0.96]
};

// Helper to add delay to animations
export const withDelay = (delay: number): Variants => ({
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.3,
      delay 
    } 
  }
}); 