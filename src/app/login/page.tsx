'use client'; // Required for using client-side hooks

import { useState } from "react";
import { auth } from "@/Utils/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import ParticlesLogin from "@/components/elements/ParticlesLogin";

const Login = () => {
    // Existing state variables
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    // New state variable to manage password visibility
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            // Firebase login
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to dashboard upon successful login
            router.push("/");
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-[#1E293B] p-4">
            {/* Particles Background */}
            <ParticlesLogin className="absolute inset-0 z-0" quantity={150} />

            {/* Login Form */}
            <div className="relative w-full max-w-md p-8 md:p-10 bg-white rounded-lg shadow-xl z-10">
                <div className="flex flex-col items-center pb-4">
                    <img src="/logo.svg" width="50" alt="Logo" />
                    <h1 className="text-3xl font-bold text-[#4B5563] mt-4">Red Cat Cuasar</h1>
                </div>

                <div className="text-sm font-light text-[#6B7280] pb-6 text-center">
                    Login to your account.
                </div>

                <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                    {error && <p className="text-red-500 text-center">{error}</p>}

                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-[#111827]">Email</label>
                        <div className="relative text-gray-400">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                {/* Email Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="lucide lucide-mail" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                </svg>
                            </span>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="pl-12 bg-gray-50 text-gray-600 border focus:border-transparent border-gray-300 sm:text-sm rounded-lg focus:ring-1 focus:outline-none focus:ring-gray-400 block w-full p-2.5 py-3 px-4"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-[#111827]">Password</label>
                        <div className="relative text-gray-400">
                            {/* Password Icon on the Left */}
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="lucide lucide-lock" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </span>

                            {/* Password Input Field */}
                            <input
                                type={passwordVisible ? "text" : "password"} // Dynamic type based on state
                                name="password"
                                id="password"
                                placeholder="••••••••••"
                                className="pl-12 pr-12 bg-gray-50 text-gray-600 border focus:border-transparent border-gray-300 sm:text-sm rounded-lg focus:ring-1 focus:outline-none focus:ring-gray-400 block w-full p-2.5 py-3 px-4"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {/* Toggle Password Visibility Icon on the Right */}
                            <span
                                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? (
                                    // Eye-Off Icon (Password is visible)
                                    <svg xmlns="http://www.w3.org/2000/svg" className="lucide lucide-eye-off" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.51 21.51 0 0 1 5.6-7.16"></path>
                                        <path d="M3 3l18 18"></path>
                                    </svg>
                                ) : (
                                    // Eye Icon (Password is hidden)
                                    <svg xmlns="http://www.w3.org/2000/svg" className="lucide lucide-eye" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full text-white bg-[#4F46E5] hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    >
                        Login
                    </button>

                    <div className="text-sm font-light text-center text-[#6B7280]">
                        Don't have an account yet? <a href="/register" className="font-medium text-[#4F46E5] hover:underline">Register</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
