import React, { useState, useContext } from "react";
import { logIn } from "../auth"; // Ensure correct path
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "./LanguageContext";

const translations = {
  en: {
    login: "Login",
    email: "Email",
    password: "Password",
    welcome: "Welcome Back!",
    poweredBy: "Mandoubi App Beta 1 powered by",
  },
  ar: {
    login: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    welcome: "مرحبًا بعودتك!",
    poweredBy: "تطبيق Mandoubi Beta 1 مدعوم من",
  },
  ku: {
    login: "چوونەژوورەوە",
    email: "ئیمەیڵ",
    password: "وشەی نهێنی",
    welcome: "بەخێربێیتەوە!",
    poweredBy: "Mandoubi App Beta 1 پشت بەستوو بە",
  },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await logIn(email, password);
      console.log("Logged in as:", user.uid);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
      console.error("Login error:", err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-lg shadow-lg"
      >
        <h2 className="text-2xl mb-6 text-center">
          {translations[language].welcome}
        </h2>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 text-sm">
            {translations[language].email}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 text-sm">
            {translations[language].password}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {translations[language].login}
        </button>
        <p className="text-center mt-4 text-sm text-gray-500">
          {translations[language].poweredBy}{" "}
          <a
            href="https://www.hamagardy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            @hamagardy
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
