import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, BookOpen, Calendar, Shield, Award } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-yellow-300">Ashraya</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            A compassionate digital platform connecting patients, families, and healthcare professionals 
            for holistic palliative care support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-yellow-300 transition-colors duration-200"
            >
              Join Our Community
            </Link>
            <Link
              to="/therapy"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-teal-600 transition-colors duration-200"
            >
              Book Therapy Session
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Care Support
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide multiple pathways to healing, connection, and support for your journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 hover:shadow-lg transition-shadow duration-200">
              <Calendar className="h-16 w-16 text-teal-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Therapy Booking</h3>
              <p className="text-gray-600">
                Connect with qualified therapists and counselors who specialize in palliative care support.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-shadow duration-200">
              <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Peer Support Groups</h3>
              <p className="text-gray-600">
                Join supportive communities where you can share experiences and find understanding.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow duration-200">
              <BookOpen className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Resource Library</h3>
              <p className="text-gray-600">
                Access comprehensive resources covering medical, emotional, financial, and legal aspects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stories of Hope & Healing
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our community members about their journey with Ashraya.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-teal-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah M.</h4>
                  <p className="text-sm text-gray-600">Patient</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Ashraya gave me a community when I felt most alone. The peer support groups 
                helped me realize I wasn't facing this journey by myself."
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900">Mark T.</h4>
                  <p className="text-sm text-gray-600">Caregiver</p>
                </div>
              </div>
              <p className="text-gray-700">
                "As a caregiver, I found invaluable resources and support. The therapy sessions 
                helped me cope with the emotional challenges of caring for my loved one."
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <Award className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900">Dr. Lisa R.</h4>
                  <p className="text-sm text-gray-600">Healthcare Professional</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Ashraya bridges the gap between clinical care and emotional support. 
                It's an essential resource for comprehensive palliative care."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of people who have found support, connection, and healing through Ashraya.
          </p>
          <Link
            to="/register"
            className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-yellow-300 transition-colors duration-200 inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-8 w-8 text-teal-400" />
                <span className="text-2xl font-bold">Ashraya</span>
              </div>
              <p className="text-gray-400">
                Compassionate care for life's most challenging moments.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Therapy Booking</li>
                <li>Peer Support</li>
                <li>Resource Library</li>
                <li>Story Sharing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Community Guidelines</li>
                <li>Newsletter</li>
                <li>Social Media</li>
                <li>Partnerships</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Ashraya. All rights reserved. Made with ❤️ for healing and hope.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;