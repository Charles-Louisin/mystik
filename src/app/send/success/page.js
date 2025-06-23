"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaCheck, FaHome, FaPaperPlane, FaUser } from "react-icons/fa";

// Composant qui utilise useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const username = searchParams.get("username");
  const recipient = to && to.trim() !== "" ? to : "l'utilisateur";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card p-4 sm:p-8 w-full max-w-md text-center"
        >
          <div className="mb-4">
            <Image 
              src="/logo.svg" 
              alt="Mystik Logo" 
              width={50} 
              height={50}
              className="object-contain mx-auto"
            />
          </div>
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FaCheck className="text-success text-2xl sm:text-3xl" />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Message envoyé avec succès !
          </h1>
          
          <p className="text-gray-light text-sm sm:text-base mb-6 sm:mb-8">
            Ton message anonyme a été envoyé à <span className="text-white font-medium">{recipient}</span>. 
            Il le recevra dès sa prochaine connexion.
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="btn-primary bg-gray-800 hover:bg-gray-700 flex items-center justify-center py-2 sm:py-3">
                <FaHome className="mr-2" />
                Accueil
              </Link>
              
              {username && (
                <Link href={`/send?to=${username}`} className="btn-primary flex items-center justify-center py-2 sm:py-3 text-sm sm:text-base">
                  <FaPaperPlane className="mr-2" />
                  Envoyer un autre message à {recipient}
                </Link>
              )}
            </div>
            
            <Link href="/send" className="btn-secondary flex items-center justify-center py-2 sm:py-3">
              <FaUser className="mr-2" />
              Envoyer un message à quelqu'un d'autre
            </Link>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-gray-light text-sm mb-3">
              Tu aimerais aussi recevoir des messages anonymes ?
            </p>
            
            <Link href="/register" className="text-primary hover:underline">
              Crée ton compte Mystik gratuitement
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Composant principal qui enveloppe le contenu dans Suspense
export default function SendSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <SuccessContent />
    </Suspense>
  );
} 