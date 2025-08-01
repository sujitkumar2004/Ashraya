import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, Plus, Edit, Trash2, User } from 'lucide-react';
import axios from 'axios';

interface Story {
  _id: string;
  title: string;
  content: string;
  author: {
    name: string;
    role: string;
  };
  likes: number;
  comments: Comment[];
  createdAt: Date;
  isLiked?: boolean;
}

interface Comment {
  _id: string;
  author: {
    name: string;
    role: string;
  };
  content: string;
  createdAt: Date;
}

const Stories: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', content: '' });
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      // Mock data for demonstration
      const mockStories: Story[] = [
        {
          _id: '1',
          title: 'Finding Strength in Community',
          content: 'When I was first diagnosed, I felt completely alone. The medical terminology, the treatment plans, the uncertainty - it all felt overwhelming. But through this platform, I found others who truly understood what I was going through. Their stories gave me hope, their advice practical help, and their friendship immeasurable comfort. Today, I want to share some of what I\'ve learned on this journey, hoping it might help someone else who is feeling as lost as I once did.',
          author: { name: 'Sarah M.', role: 'patient' },
          likes: 23,
          comments: [
            {
              _id: '1',
              author: { name: 'Michael T.', role: 'caregiver' },
              content: 'Thank you for sharing this, Sarah. Your courage inspires me every day.',
              createdAt: new Date(Date.now() - 86400000)
            }
          ],
          createdAt: new Date(Date.now() - 172800000),
          isLiked: false
        },
        {
          _id: '2',
          title: 'A Caregiver\'s Journey',
          content: 'Being a caregiver is one of the most challenging yet rewarding experiences I\'ve ever had. Watching my mother navigate her illness has taught me about resilience, love, and the preciousness of every moment. There have been dark days when I questioned if I was doing enough, if I was strong enough. But this community reminded me that caring for someone you love is one of the most noble things you can do. Here are some lessons I\'ve learned along the way...',
          author: { name: 'David L.', role: 'caregiver' },
          likes: 31,
          comments: [
            {
              _id: '2',
              author: { name: 'Dr. Wilson', role: 'therapist' },
              content: 'David, your dedication and love shine through your words. Remember to take care of yourself too.',
              createdAt: new Date(Date.now() - 43200000)
            }
          ],
          createdAt: new Date(Date.now() - 259200000),
          isLiked: true
        },
        {
          _id: '3',
          title: 'The Healing Power of Art',
          content: 'During my treatment, I discovered something unexpected - art became my sanctuary. When words failed me, when the medical appointments became overwhelming, I found solace in painting. Each brushstroke was a way to express emotions I couldn\'t verbalize. What started as a simple distraction became a profound form of healing. I want to encourage others to find their own creative outlet, whatever it might be.',
          author: { name: 'Emma R.', role: 'patient' },
          likes: 18,
          comments: [],
          createdAt: new Date(Date.now() - 345600000),
          isLiked: false
        }
      ];
      setStories(mockStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStory.title.trim() || !newStory.content.trim()) return;

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/stories', newStory);
      setNewStory({ title: '', content: '' });
      setShowCreateForm(false);
      fetchStories();
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeStory = async (storyId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/stories/${storyId}/like`);
      setStories(stories.map(story => 
        story._id === storyId 
          ? { 
              ...story, 
              likes: story.isLiked ? story.likes - 1 : story.likes + 1,
              isLiked: !story.isLiked 
            }
          : story
      ));
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleAddComment = async (storyId: string) => {
    if (!newComment.trim()) return;

    try {
      await axios.post(`http://localhost:5000/api/stories/${storyId}/comments`, {
        content: newComment
      });
      setNewComment('');
      fetchStories();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'text-teal-600 bg-teal-100';
      case 'caregiver': return 'text-blue-600 bg-blue-100';
      case 'therapist': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared Stories</h1>
            <p className="text-gray-600 text-lg">
              Share your journey, inspire others, and find connection through personal experiences.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Share Your Story</span>
          </button>
        </div>

        {/* Create Story Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Share Your Story</h2>
            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Story Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newStory.title}
                  onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Give your story a meaningful title"
                  required
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Story
                </label>
                <textarea
                  id="content"
                  value={newStory.content}
                  onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Share your experience, insights, or journey. Your words might be exactly what someone else needs to hear."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? 'Publishing...' : 'Publish Story'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stories List */}
        <div className="space-y-8">
          {stories.map((story) => (
            <article key={story._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{story.author.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(story.author.role)}`}>
                        {story.author.role}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">{story.title}</h2>
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed">{story.content}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLikeStory(story._id)}
                    className={`flex items-center space-x-2 transition-colors duration-200 ${
                      story.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${story.isLiked ? 'fill-current' : ''}`} />
                    <span>{story.likes}</span>
                  </button>
                  <button
                    onClick={() => setSelectedStory(selectedStory?._id === story._id ? null : story)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{story.comments.length}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors duration-200">
                    <Share2 className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {selectedStory?._id === story._id && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Comments</h4>
                  
                  {/* Add Comment */}
                  <div className="mb-6">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts or support..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={3}
                    />
                    <button
                      onClick={() => handleAddComment(story._id)}
                      disabled={!newComment.trim()}
                      className="mt-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Add Comment
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {story.comments.map((comment) => (
                      <div key={comment._id} className="flex items-start space-x-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{comment.author.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(comment.author.role)}`}>
                              {comment.author.role}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stories;