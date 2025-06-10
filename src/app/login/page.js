"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPhone, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation simple
    if (!formData.phone.trim() || !formData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    // Validation du numéro de téléphone
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Veuillez entrer un numéro de téléphone valide (9 chiffres)");
      return;
    }

    setIsLoading(true);
    
    try {
      // Utiliser l'origine de la fenêtre au lieu d'une URL codée en dur
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Formatage du numéro avec +237
      const formattedPhone = `+237${formData.phone}`;
      
      const response = await axios.post(`${apiBaseUrl}/api/auth/login`, {
        phone: formattedPhone,
        password: formData.password
      });
      
      // Enregistrer le token dans localStorage
      localStorage.setItem("token", response.data.token);
      
      toast.success("Connexion réussie!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      const errorMessage = error.response?.data?.msg || "Numéro de téléphone ou mot de passe incorrect";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8 w-full max-w-md"
        >
          <div className="flex items-center justify-center mb-8 relative">
            <Link href="/" className="absolute left-0 text-gray-light hover:text-white">
              <FaArrowLeft />
            </Link>
            <Image 
              src="/logo.svg" 
              alt="Mystik Logo" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-8">
            Connexion à votre compte
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-light mb-2">
                Numéro de téléphone
              </label>
              <div className="flex">
                <div className="bg-gray-800 flex items-center justify-center px-3 rounded-l-lg border-r border-gray-700">
                  <span className="text-gray-400">+237</span>
                </div>
                <div className="relative flex-1">
                  <FaPhone className="absolute top-3 left-3 text-gray-light" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="612345678"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input rounded-l-none w-full pl-10"
                    maxLength={9}
                    autoFocus
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-light" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
                className="input w-full pl-10"
                required
              />
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-light hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-8"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-light">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 