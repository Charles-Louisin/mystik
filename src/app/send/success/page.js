"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaCheck, FaHome, FaPaperPlane, FaUser } from "react-icons/fa";

export default function SendSuccess() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const username = searchParams.get("username");
  const recipient = to && to.trim() !== "" ? to : "l'utilisateur";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card p-8 w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-success text-3xl" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">
            Message envoyé avec succès !
          </h1>
          
          <p className="text-gray-light mb-8">
            Ton message anonyme a été envoyé à <span className="text-white font-medium">{recipient}</span>. 
            Il le recevra dès sa prochaine connexion.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="btn-primary bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                <FaHome className="mr-2" />
                Accueil
              </Link>
              
              {username && (
                <Link href={`/send?to=${username}`} className="btn-primary flex items-center justify-center">
                  <FaPaperPlane className="mr-2" />
                  Envoyer un autre message à {recipient}
                </Link>
              )}
            </div>
            
            <Link href="/send" className="btn-secondary flex items-center justify-center">
              <FaUser className="mr-2" />
              Envoyer un message à quelqu'un d'autre
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-gray-light text-sm mb-4">
              Tu aimerais aussi recevoir des messages anonymes ?
            </p>
            
            <Link href="/register" className="text-primary hover:underline">
              Crée ton compte Mystik gratuitement
            </Link>
          </div>
          
          <div className="mt-6">
            <Image 
              src="/logo.svg" 
              alt="Mystik Logo" 
              width={60} 
              height={60}
              className="object-contain mx-auto"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
} 