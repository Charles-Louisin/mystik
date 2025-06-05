"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";
import AnimatedBackground from "./animations/AnimatedBackground";
import PageTransition from "./animations/PageTransition";
import LoadingScreen from "./animations/LoadingScreen";

const Layout = ({ children }) => {
  const pathname = usePathname();
  
  // Détermine si le fond animé doit être affiché sur cette page
  const isRootPath = [
    "/",
    "/login",
    "/register",
    "/send",
    "/send/success",
  ].includes(pathname);
  
  // Vérifie si c'est une page de redirection utilisateur (avec ou sans @)
  const isUserRedirect = pathname.match(/^\/@[a-zA-Z0-9_-]+$/) || pathname.match(/^\/[a-zA-Z0-9_-]+$/);
  
  const showAnimatedBackground = isRootPath || isUserRedirect;
  
  return (
    <>
      <LoadingScreen />
      <AnimatePresence mode="wait">
        {showAnimatedBackground ? (
          <AnimatedBackground>
            <PageTransition>
              {children}
            </PageTransition>
          </AnimatedBackground>
        ) : (
          <PageTransition>
            {children}
          </PageTransition>
        )}
      </AnimatePresence>
    </>
  );
};

export default Layout; 