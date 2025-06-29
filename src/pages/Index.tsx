import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, FileText, BarChart, Users, Clock, GraduationCap, CheckSquare, Edit3, FileCheck, UserPlus } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#e9e6ff]">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <main>
          {/* Hero section with dark gradient background */}
          <section className="bg-gradient-to-br from-[#0e0825] via-[#18154a] to-[#250e5e] text-white py-20 px-6 rounded-3xl mx-6 relative overflow-hidden mt-6">
            {/* Decorative elements */}
            <div className="absolute top-20 left-10 rotate-12 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 w-24 h-24 flex items-center justify-center">
              <div className="w-16 h-8 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-md"></div>
            </div>
            <div className="absolute bottom-20 right-10 -rotate-12 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 w-24 h-24 flex items-center justify-center">
              <div className="w-16 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md"></div>
            </div>
            
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <span className="text-xs uppercase tracking-wider text-indigo-300 mb-4 inline-block">MODERN QUIZ PLATFORM</span>
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                    Create Engaging Quizzes in Minutes
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                    Design beautiful quizzes, collect responses, and analyze results with our intuitive quiz creation platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {user ? (
                      <Link to="/admin-dashboard">
                        <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0">
                          Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link to="/signup">
                          <Button className="rounded-full px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0">
                            Register now <UserPlus className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to="/login">
                          <Button variant="outline" className="rounded-full px-8 py-6 bg-transparent border-white hover:bg-white/20">
                            Log in
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature cards */}
          <section id="features" className="py-10 px-6">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-900/90 to-purple-800/90 rounded-2xl p-8 text-white">
                  <div className="bg-purple-700/50 p-3 rounded-lg w-fit mb-4">
                    <CheckSquare className="h-6 w-6 text-purple-200" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">Diverse Question Types</h3>
                  <p className="text-purple-200 mb-4">
                    Create engaging quizzes with multiple-choice, true/false, short answer, and long answer formats.
                  </p>
                  <a href="#" className="text-white flex items-center hover:underline group">
                    Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/90 to-purple-800/90 rounded-2xl p-8 text-white">
                  <div className="bg-purple-700/50 p-3 rounded-lg w-fit mb-4">
                    <BarChart className="h-6 w-6 text-purple-200" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">Results Analytics</h3>
                  <p className="text-purple-200 mb-4">
                    Track performance with detailed quiz analytics, including completion rates, time spent, and question-level insights.
                  </p>
                  <a href="#" className="text-white flex items-center hover:underline group">
                    Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/90 to-purple-800/90 rounded-2xl p-8 text-white">
                  <div className="bg-purple-700/50 p-3 rounded-lg w-fit mb-4">
                    <FileCheck className="h-6 w-6 text-purple-200" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">Share & Distribute</h3>
                  <p className="text-purple-200 mb-4">
                    Easily share quizzes via custom links, embed them on your website, or distribute to specific groups.
                  </p>
                  <a href="#" className="text-white flex items-center hover:underline group">
                    Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Trusted by section */}
          <section className="py-12 bg-white rounded-2xl mx-6">
            <div className="container mx-auto px-4">
              <p className="text-center text-sm font-medium text-gray-500 mb-8">TRUSTED BY EDUCATORS WORLDWIDE</p>
              <div className="flex flex-wrap justify-center items-center gap-12">
                <div className="grayscale opacity-70 hover:opacity-100 transition-opacity">
                  <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C4.5 0 0 4.5 0 10C0 15.5 4.5 20 10 20C15.5 20 20 15.5 20 10C20 4.5 15.5 0 10 0ZM10 18C5.6 18 2 14.4 2 10C2 5.6 5.6 2 10 2C14.4 2 18 5.6 18 10C18 14.4 14.4 18 10 18Z" fill="#333"/>
                    <path d="M50 0C44.5 0 40 4.5 40 10C40 15.5 44.5 20 50 20C55.5 20 60 15.5 60 10C60 4.5 55.5 0 50 0ZM50 18C45.6 18 42 14.4 42 10C42 5.6 45.6 2 50 2C54.4 2 58 5.6 58 10C58 14.4 54.4 18 50 18Z" fill="#333"/>
                    <path d="M30 0C24.5 0 20 4.5 20 10C20 15.5 24.5 20 30 20C35.5 20 40 15.5 40 10C40 4.5 35.5 0 30 0ZM30 18C25.6 18 22 14.4 22 10C22 5.6 25.6 2 30 2C34.4 2 38 5.6 38 10C38 14.4 34.4 18 30 18Z" fill="#333"/>
                  </svg>
                </div>
                <div className="grayscale opacity-70 hover:opacity-100 transition-opacity">
                  <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0L20 10L10 20L0 10L10 0Z" fill="#333"/>
                    <path d="M40 0L50 10L40 20L30 10L40 0Z" fill="#333"/>
                    <path d="M70 0L80 10L70 20L60 10L70 0Z" fill="#333"/>
                  </svg>
                </div>
                <div className="grayscale opacity-70 hover:opacity-100 transition-opacity">
                  <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="20" rx="10" fill="#333"/>
                  </svg>
                </div>
                <div className="grayscale opacity-70 hover:opacity-100 transition-opacity">
                  <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0H20V20H0V0Z" fill="#333"/>
                    <path d="M40 0H60V20H40V0Z" fill="#333"/>
                  </svg>
                </div>
              </div>
            </div>
          </section>
          
          {/* Quiz features section */}
          <section className="py-16 px-6">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1516534775068-ba3e7458af70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                       alt="Student taking quiz on tablet" 
                       className="w-full h-[400px] object-cover rounded-2xl" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 mb-4 inline-block">POWERFUL QUIZ TOOLS</span>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Transform Your Assessment Experience
                  </h2>
                  <p className="text-gray-700 mb-8">
                    QuizGator empowers educators with robust quiz-building tools that make assessment creation effortless. From classroom quizzes to professional certifications, our platform elevates your testing experience.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-start">
                      <div className="mr-2 text-purple-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <p className="text-sm">Auto-grading and instant results</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 text-purple-600">
                        <Edit3 className="h-5 w-5" />
                      </div>
                      <p className="text-sm">Customizable quiz templates</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 text-purple-600">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <p className="text-sm">Learning progress tracking</p>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 text-purple-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="text-sm">Collaborative quiz creation</p>
                    </div>
                  </div>
                  <Link to="/login">
                    <Button className="rounded-full px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0">
                      Start your free trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-8 px-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="bg-black p-2 rounded-lg">
                  <span className="text-lg font-semibold text-white">QuizGator</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} QuizGator. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
