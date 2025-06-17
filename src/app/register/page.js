"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPhone, FaLock, FaArrowLeft, FaUser, FaCheck, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Définir l'origine lorsque le composant est monté côté client
    setOrigin(window.location.origin);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Vérifier la disponibilité du nom d'utilisateur
    if (name === 'username' && value.trim().length >= 3) {
      checkUsernameAvailability(value);
    }
    
    // Vérifier la disponibilité du numéro de téléphone
    if (name === 'phone' && value.trim().length >= 9) {
      checkPhoneAvailability(value);
    }
  };

  const checkPhoneAvailability = async (phone) => {
    if (phone.trim().length < 9) return;
    
    setIsCheckingPhone(true);
    setPhoneAvailable(null);
    
    try {
      // Utiliser la variable d'environnement en priorité
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      // Formatage du numéro avec +237
      const formattedPhone = `+237${phone}`;
      
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/check-phone`, {
        phone: formattedPhone
      });
      
      setPhoneAvailable(data.available);
      if (!data.available) {
        toast.error(data.message || "Ce numéro de téléphone est déjà utilisé");
      }
      
      return data.available;
    } catch (error) {
      console.error("Erreur lors de la vérification du téléphone:", error);
      toast.error("Erreur lors de la vérification du numéro de téléphone");
      setPhoneAvailable(false);
      return false;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (username.trim().length < 3) return;
    
    setIsCheckingUsername(true);
    setUsernameAvailable(null);
    
    try {
      // Utiliser la variable d'environnement en priorité
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/check-username`, {
        username: username
      });
      
      setUsernameAvailable(data.available);
      if (!data.available) {
        toast.error(data.message || "Ce nom d'utilisateur est déjà pris");
      }
      
      return data.available;
    } catch (error) {
      console.error("Erreur lors de la vérification du nom d'utilisateur:", error);
      toast.error("Erreur lors de la vérification du nom d'utilisateur");
      setUsernameAvailable(false);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const validateStep1 = async () => {
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Veuillez entrer un numéro de téléphone valide (9 chiffres)");
      return false;
    }
    
    return await checkPhoneAvailability(formData.phone);
  };

  const validateStep2 = async () => {
    if (formData.username.length < 3) {
      toast.error("Le nom d'utilisateur doit contenir au moins 3 caractères");
      return false;
    }
    
    return await checkUsernameAvailability(formData.username);
  };

  const validateStep3 = () => {
    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    if (step === 1) {
      const isPhoneValid = await validateStep1();
      if (isPhoneValid) {
        setStep(2);
      }
    } else if (step === 2) {
      const isUsernameValid = await validateStep2();
      if (isUsernameValid) {
        setStep(3);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Utiliser la variable d'environnement en priorité
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      // Formatage du numéro avec +237
      const formattedPhone = `+237${formData.phone}`;
      
      // Créer le compte
      const response = await axios.post(`${apiBaseUrl}/api/auth/register`, {
        username: formData.username,
        phone: formattedPhone,
        password: formData.password
      });
      
      // Enregistrer le token dans localStorage
      localStorage.setItem("token", response.data.token);
      
      toast.success("Compte créé avec succès!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      const errorMessage = error.response?.data?.msg || "Erreur lors de l'inscription";
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
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="absolute left-4 top-4 text-gray-light hover:text-white">
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
            {step === 1 && "Entrez votre numéro de téléphone"}
            {step === 2 && "Choisissez votre nom d'utilisateur"}
            {step === 3 && "Créez votre mot de passe"}
          </h1>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
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
                        className={`input rounded-l-none w-full pl-10 ${
                          phoneAvailable === true 
                            ? 'border-green-500' 
                            : phoneAvailable === false 
                              ? 'border-red-500' 
                              : ''
                        }`}
                        maxLength={9}
                        autoFocus
                        required
                      />
                      {isCheckingPhone && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {!isCheckingPhone && phoneAvailable === true && formData.phone.trim() !== '' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <FaCheck />
                        </div>
                      )}
                      {!isCheckingPhone && phoneAvailable === false && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                          <FaTimes />
                        </div>
                      )}
                    </div>
                  </div>
                  {!isCheckingPhone && phoneAvailable === false && (
                    <p className="text-red-400 text-xs mt-1">Ce numéro de téléphone est déjà utilisé</p>
                  )}
                </div>
                <p className="text-sm text-gray-light">
                  Nous utiliserons ce numéro pour sécuriser votre compte.
                </p>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isCheckingPhone || phoneAvailable === false}
                  className="btn-primary w-full mt-6"
                >
                  {isCheckingPhone ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                      Vérification...
                    </>
                  ) : (
                    "Continuer"
                  )}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <label className="block text-gray-light mb-2">
                    Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <FaUser className="absolute top-3 left-3 text-gray-light" />
                    <input
                      type="text"
                      name="username"
                      placeholder="Nom d'utilisateur"
                      value={formData.username}
                      onChange={handleChange}
                      className={`input w-full pl-10 ${
                        usernameAvailable === true 
                          ? 'border-green-500' 
                          : usernameAvailable === false 
                            ? 'border-red-500' 
                            : ''
                      }`}
                      autoFocus
                      minLength={3}
                      required
                    />
                    {isCheckingUsername && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && formData.username.trim() !== '' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                        <FaCheck />
                      </div>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                        <FaTimes />
                      </div>
                    )}
                  </div>
                  {!isCheckingUsername && usernameAvailable === false && (
                    <p className="text-red-400 text-xs mt-1">Ce nom d'utilisateur est déjà pris</p>
                  )}
                </div>
                <p className="text-sm text-gray-light">
                  Choisissez un nom d'utilisateur unique qui sera visible dans votre lien de partage:
                  <span className="block mt-1 font-mono bg-gray-800 px-2 py-1 rounded text-xs">
                    {origin}/@{formData.username || "username"}
                  </span>
                </p>
                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-primary bg-gray-800 hover:bg-gray-700 w-1/2"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isCheckingUsername || usernameAvailable === false}
                    className="btn-primary w-1/2"
                  >
                    {isCheckingUsername ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                        Vérification...
                      </>
                    ) : (
                      "Continuer"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <label className="block text-gray-light mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <FaLock className="absolute top-3 left-3 text-gray-light" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Mot de passe (min. 6 caractères)"
                      value={formData.password}
                      onChange={handleChange}
                      className="input w-full pl-10"
                      autoFocus
                      minLength={6}
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
                </div>
                <div className="relative">
                  <label className="block text-gray-light mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <FaLock className="absolute top-3 left-3 text-gray-light" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirmer le mot de passe"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input w-full pl-10 ${
                        formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
                          ? 'border-green-500'
                          : formData.confirmPassword.length > 0
                            ? 'border-red-500'
                            : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute top-3 right-3 text-gray-light hover:text-white transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-primary bg-gray-800 hover:bg-gray-700 w-1/2"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || formData.password !== formData.confirmPassword}
                    className="btn-primary w-1/2"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Création...
                      </span>
                    ) : (
                      "Créer mon compte"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-light">
              Vous avez déjà un compte?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Connectez-vous
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 