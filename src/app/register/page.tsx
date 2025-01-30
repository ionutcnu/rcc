'use client';
import { useState } from "react";
import { auth } from "@/Utils/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Signup = () => {
    // State variables
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Reset error state
        setError("");

        if (password !== passwordConfirm) {
            setError("Passwords do not match!");
            return;
        }

        setIsSubmitting(true);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Redirect to the dashboard after successful sign-up
            router.push("/");
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
            <div className="flex flex-col lg:flex-row max-w-6xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                {/* Image Section */}
                <div className="lg:w-1/2 h-64 lg:h-auto relative">
                    <Image
                        src="https://images.unsplash.com/photo-1605106702734-205df224ecce?ixlib=rb-1.2.1&auto=format&fit=crop&w=870&q=80"
                        alt="Decorative background"
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>

                {/* Form Section */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12">
                    <div className="flex justify-center">
                        <Image
                            src="/logo.svg"
                            alt="Logo"
                            width={64}
                            height={64}
                            className="w-16 h-16"
                            priority
                        />
                    </div>

                    <h2 className="text-2xl font-semibold text-center text-gray-700 dark:text-white mt-4">Create Your Account</h2>

                    <p className="text-center text-gray-600 dark:text-gray-200 mt-2">Join us and start your journey</p>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="mt-6">
                        {/* First Name and Last Name */}
                        <div className="flex flex-col sm:flex-row sm:space-x-4">
                            <div className="w-full sm:w-1/2">
                                <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    First Name
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        type="text"
                                        id="FirstName"
                                        name="first_name"
                                        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9.985 9.985 0 0012 21a9.985 9.985 0 006.879-3.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full sm:w-1/2 mt-4 sm:mt-0">
                                <label htmlFor="LastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Last Name
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        type="text"
                                        id="LastName"
                                        name="last_name"
                                        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9.985 9.985 0 0012 21a9.985 9.985 0 006.879-3.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="mt-4">
                            <label htmlFor="Email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Email Address
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    type="email"
                                    id="Email"
                                    name="email"
                                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M16 12H8m0 0H5m3 0l4 4m0-4l-4-4m0 8V8m0 0V4m0 4l4-4m0 0l4 4m-4-4v4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mt-4">
                            <label htmlFor="Password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    id="Password"
                                    name="password"
                                    className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 15v2m0-6v2m0 2a2 2 0 11-4 0 2 2 0 014 0zM5 12h14M5 12a7 7 0 1114 0H5z" />
                                    </svg>
                                </div>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button
                                        type="button"
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                        className="focus:outline-none"
                                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                                    >
                                        {passwordVisible ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-9a9.968 9.968 0 012.87-7.068M15 15l-3-3m0 0l-3-3m3 3l3-3m-3 3l-3 3m9-9a9.968 9.968 0 012.87 7.068c0 5-4 9-9 9-1.313 0-2.57-.264-3.738-.744" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Password Confirmation */}
                        <div className="mt-4">
                            <label htmlFor="PasswordConfirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Confirm Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    type={passwordConfirmVisible ? "text" : "password"}
                                    id="PasswordConfirmation"
                                    name="password_confirmation"
                                    className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    required
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 15v2m0-6v2m0 2a2 2 0 11-4 0 2 2 0 014 0zM5 12h14M5 12a7 7 0 1114 0H5z" />
                                    </svg>
                                </div>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button
                                        type="button"
                                        onClick={() => setPasswordConfirmVisible(!passwordConfirmVisible)}
                                        className="focus:outline-none"
                                        aria-label={passwordConfirmVisible ? "Hide password" : "Show password"}
                                    >
                                        {passwordConfirmVisible ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-9a9.968 9.968 0 012.87-7.068M15 15l-3-3m0 0l-3-3m3 3l3-3m-3 3l-3 3m9-9a9.968 9.968 0 012.87 7.068c0 5-4 9-9 9-1.313 0-2.57-.264-3.738-.744" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-6">
                            <button
                                type="submit"
                                className="w-full flex justify-center items-center bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create an Account"
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?
                            <a href="/login" className="text-blue-600 hover:underline dark:text-blue-400 ml-1">Log in</a>.
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Signup;