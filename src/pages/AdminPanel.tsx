import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, FileText, Shield, Trash2, Check, X, Eye } from 'lucide-react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: Date;
}

interface Story {
  _id: string;
  title: string;
  author: { name: string; role: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface Resource {
  _id: string;
  title: string;
  category: string;
  type: string;
  uploadedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'resources' | 'analytics'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalResources: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data for demonstration
      const mockUsers: User[] = [
        {
          _id: '1',
          name: 'Sarah Mitchell',
          email: 'sarah.m@email.com',
          role: 'patient',
          isActive: true,
          joinedAt: new Date(Date.now() - 86400000 * 30)
        },
        {
          _id: '2',
          name: 'Michael Thompson',
          email: 'michael.t@email.com',
          role: 'caregiver',
          isActive: true,
          joinedAt: new Date(Date.now() - 86400000 * 15)
        },
        {
          _id: '3',
          name: 'Dr. Lisa Rodriguez',
          email: 'lisa.r@hospital.com',
          role: 'therapist',
          isActive: true,
          joinedAt: new Date(Date.now() - 86400000 * 45)
        },
        {
          _id: '4',
          name: 'David Chen',
          email: 'david.c@email.com',
          role: 'patient',
          isActive: false,
          joinedAt: new Date(Date.now() - 86400000 * 60)
        }
      ];

      const mockStories: Story[] = [
        {
          _id: '1',
          title: 'My Journey with Hope',
          author: { name: 'Emma Wilson', role: 'patient' },
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          _id: '2',
          title: 'Supporting a Loved One',
          author: { name: 'James Brown', role: 'caregiver' },
          status: 'approved',
          createdAt: new Date(Date.now() - 86400000 * 2)
        }
      ];

      const mockResources: Resource[] = [
        {
          _id: '1',
          title: 'Advanced Care Planning Guide',
          category: 'medical',
          type: 'pdf',
          uploadedBy: 'Dr. Rodriguez',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000)
        }
      ];

      setUsers(mockUsers);
      setStories(mockStories);
      setResources(mockResources);
      
      setAnalytics({
        totalUsers: mockUsers.length,
        totalStories: mockStories.length,
        totalResources: mockResources.length,
        activeUsers: mockUsers.filter(u => u.isActive).length
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate') => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}`, { action });
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: action === 'activate' }
          : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleStoryAction = async (storyId: string, action: 'approve' | 'reject') => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/stories/${storyId}`, { action });
      setStories(stories.map(story =>
        story._id === storyId
          ? { ...story, status: action === 'approve' ? 'approved' : 'rejected' }
          : story
      ));
    } catch (error) {
      console.error('Error updating story:', error);
    }
  };

  const handleResourceAction = async (resourceId: string, action: 'approve' | 'reject') => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/resources/${resourceId}`, { action });
      setResources(resources.map(resource =>
        resource._id === resourceId
          ? { ...resource, status: action === 'approve' ? 'approved' : 'rejected' }
          : resource
      ));
    } catch (error) {
      console.error('Error updating resource:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'bg-teal-100 text-teal-800';
      case 'caregiver': return 'bg-blue-100 text-blue-800';
      case 'therapist': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'stories', name: 'Stories', icon: MessageSquare },
    { id: 'resources', name: 'Resources', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: Shield }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600 text-lg">
            Manage users, moderate content, and oversee platform operations.
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Stories</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalStories}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalResources}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.activeUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleUserAction(user._id, user.isActive ? 'deactivate' : 'activate')}
                            className={`mr-2 px-3 py-1 rounded-md text-xs font-medium ${
                              user.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stories Tab */}
            {activeTab === 'stories' && (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div key={story._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{story.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>By {story.author.name} ({story.author.role})</span>
                          <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(story.status)}`}>
                          {story.status}
                        </span>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md">
                          <Eye className="h-4 w-4" />
                        </button>
                        {story.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStoryAction(story._id, 'approve')}
                              className="p-2 text-green-600 hover:text-green-700 rounded-md"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStoryAction(story._id, 'reject')}
                              className="p-2 text-red-600 hover:text-red-700 rounded-md"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>Category: {resource.category}</span>
                          <span>Type: {resource.type}</span>
                          <span>By {resource.uploadedBy}</span>
                          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resource.status)}`}>
                          {resource.status}
                        </span>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md">
                          <Eye className="h-4 w-4" />
                        </button>
                        {resource.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResourceAction(resource._id, 'approve')}
                              className="p-2 text-green-600 hover:text-green-700 rounded-md"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResourceAction(resource._id, 'reject')}
                              className="p-2 text-red-600 hover:text-red-700 rounded-md"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                  <div className="text-center py-8 text-gray-500">
                    Analytics charts would be implemented here with a charting library like Chart.js or D3.js
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Engagement</h3>
                  <div className="text-center py-8 text-gray-500">
                    Engagement metrics and charts would be displayed here
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;