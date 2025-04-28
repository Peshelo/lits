"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

const LandingPage = () => {
  const router = useRouter();

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Dark Green Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-farmer-2.jpg"
          alt="Farm Background"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-green-900 bg-opacity-70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Professional Navbar */}
        <nav className="p-4 bg-white bg-opacity-95 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  width={50}
                  height={50}
                  alt="Platform Logo"
                  className="rounded-lg"
                />
                <span className="ml-2 text-lg font-semibold text-gray-800">
                  National Livestock Traceability
                </span>
              </div>
              <div className="hidden md:flex space-x-6">
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">
                  Features
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">
                  Documentation
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">
                  Support
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">
                  About
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/auth/sign-up")}
                className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
              >
                Register
              </button>
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Centered Hero Section */}
        <div className="flex-grow flex flex-col items-center justify-center text-center px-4 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-4xl leading-tight">
            National Livestock Traceability System
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-3xl">
            Secure digital platform for livestock health monitoring, ownership tracking, and regulatory compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="bg-white text-green-700 px-6 py-3 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Access Dashboard
            </button>
            <button
              onClick={() => router.push("/auth/sign-up")}
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Register Your Farm
            </button>
          </div>
        </div>

        {/* Simple Footer */}
        <footer className="py-4 bg-white bg-opacity-90 text-center">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} National Livestock Traceability System. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;