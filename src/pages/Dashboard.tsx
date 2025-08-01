import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Users, BookOpen, Heart, MessageCircle, FileText } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dashboardCards = [
    {
      title: 'Therapy Sessions',
      description: 'Book and manage your therapy appointments',
      icon: Calendar,
      link: '/therapy',
      color: 'bg-gradient-to-br from-teal-50 to-blue-50',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Peer Groups',
      description: 'Connect with others in supportive communities',
      icon: Users,
      link: '/peer-groups',
      color: 'bg-gradient-to-br from-blue-50 to-purple-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Shared Stories',
      description: 'Read and share experiences with the community',
      icon: MessageCircle,
      link: '/stories',
      color: 'bg-gradient-to-br from-purple-50 to-pink-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Resource Library',
      description: 'Access helpful resources and materials',
      icon: BookOpen,
      link: '/resources',
      color: 'bg-gradient-to-br from-orange-50 to-red-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getWelcomeMessage()}, {user?.name}!
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome to your Ashraya dashboard. How can we support you today?
              </p>
            </div>
            <div className="hidden md:block">
              <Heart className="h-16 w-16 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Groups</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Stories Shared</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Resources Saved</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {dashboardCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className={`${card.color} p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
            >
              <div className="flex items-start">
                <card.icon className={`h-12 w-12 ${card.iconColor} mr-4 flex-shrink-0`} />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-teal-50 rounded-lg">
              <Calendar className="h-6 w-6 text-teal-600 mr-3" />
              <div>
                <p className="text-gray-900 font-medium">Therapy session scheduled</p>
                <p className="text-gray-600 text-sm">Tomorrow at 2:00 PM with Dr. Sarah Wilson</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-gray-900 font-medium">Joined "Caregiver Support" group</p>
                <p className="text-gray-600 text-sm">2 days ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="text-gray-900 font-medium">Shared your story "Finding Strength"</p>
                <p className="text-gray-600 text-sm">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;