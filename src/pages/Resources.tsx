import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ExternalLink, FileText, Heart, DollarSign, Scale, Stethoscope } from 'lucide-react';
import axios from 'axios';

interface Resource {
  _id: string;
  title: string;
  description: string;
  category: 'medical' | 'emotional' | 'financial' | 'legal';
  type: 'pdf' | 'link' | 'video';
  url: string;
  downloadCount: number;
  createdAt: Date;
}

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Categories', icon: FileText, color: 'text-gray-600' },
    { id: 'medical', name: 'Medical', icon: Stethoscope, color: 'text-teal-600' },
    { id: 'emotional', name: 'Emotional', icon: Heart, color: 'text-pink-600' },
    { id: 'financial', name: 'Financial', icon: DollarSign, color: 'text-green-600' },
    { id: 'legal', name: 'Legal', icon: Scale, color: 'text-blue-600' }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedCategory, selectedType]);

  const fetchResources = async () => {
    try {
      // Mock data for demonstration
      const mockResources: Resource[] = [
        {
          _id: '1',
          title: 'Understanding Palliative Care: A Comprehensive Guide',
          description: 'A detailed guide covering the fundamentals of palliative care, treatment options, and what to expect during the journey.',
          category: 'medical',
          type: 'pdf',
          url: '/resources/palliative-care-guide.pdf',
          downloadCount: 245,
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          _id: '2',
          title: 'Coping with Grief and Loss',
          description: 'Professional strategies and techniques for processing grief, managing emotions, and finding hope during difficult times.',
          category: 'emotional',
          type: 'pdf',
          url: '/resources/grief-coping-strategies.pdf',
          downloadCount: 189,
          createdAt: new Date(Date.now() - 172800000)
        },
        {
          _id: '3',
          title: 'Financial Planning for Healthcare Costs',
          description: 'Practical advice on managing healthcare expenses, insurance coverage, and financial assistance programs.',
          category: 'financial',
          type: 'link',
          url: 'https://example.com/financial-planning',
          downloadCount: 156,
          createdAt: new Date(Date.now() - 259200000)
        },
        {
          _id: '4',
          title: 'Advanced Directives and Legal Planning',
          description: 'Essential information about legal documents, healthcare directives, and planning for end-of-life decisions.',
          category: 'legal',
          type: 'pdf',
          url: '/resources/legal-planning-guide.pdf',
          downloadCount: 203,
          createdAt: new Date(Date.now() - 345600000)
        },
        {
          _id: '5',
          title: 'Mindfulness and Meditation for Healing',
          description: 'Guided meditation practices and mindfulness techniques to promote emotional well-being and inner peace.',
          category: 'emotional',
          type: 'video',
          url: 'https://example.com/meditation-video',
          downloadCount: 278,
          createdAt: new Date(Date.now() - 432000000)
        },
        {
          _id: '6',
          title: 'Nutrition During Treatment',
          description: 'Dietary guidelines and nutritional support strategies to maintain strength and well-being during treatment.',
          category: 'medical',
          type: 'pdf',
          url: '/resources/nutrition-guide.pdf',
          downloadCount: 167,
          createdAt: new Date(Date.now() - 518400000)
        },
        {
          _id: '7',
          title: 'Support for Family Caregivers',
          description: 'Resources and strategies for family members providing care, including self-care tips and support networks.',
          category: 'emotional',
          type: 'link',
          url: 'https://example.com/caregiver-support',
          downloadCount: 134,
          createdAt: new Date(Date.now() - 604800000)
        },
        {
          _id: '8',
          title: 'Medicare and Insurance Navigation',
          description: 'Step-by-step guide to understanding Medicare benefits, insurance claims, and coverage options.',
          category: 'financial',
          type: 'pdf',
          url: '/resources/medicare-guide.pdf',
          downloadCount: 198,
          createdAt: new Date(Date.now() - 691200000)
        }
      ];
      setResources(mockResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }

    setFilteredResources(filtered);
  };

  const handleDownload = async (resourceId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/resources/${resourceId}/download`);
      // Update download count
      setResources(resources.map(resource =>
        resource._id === resourceId
          ? { ...resource, downloadCount: resource.downloadCount + 1 }
          : resource
      ));
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : FileText;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : 'text-gray-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'link': return <ExternalLink className="h-4 w-4" />;
      case 'video': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Library</h1>
          <p className="text-gray-600 text-lg">
            Access comprehensive resources covering medical, emotional, financial, and legal aspects of your journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="link">Web Links</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.slice(1).map((category) => {
            const Icon = category.icon;
            const count = resources.filter(r => r.category === category.id).length;
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`bg-white p-4 rounded-xl shadow-md border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedCategory === category.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
              >
                <div className="text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${category.color}`} />
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{count} resources</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const CategoryIcon = getCategoryIcon(resource.category);
            return (
              <div key={resource._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className={`h-5 w-5 ${getCategoryColor(resource.category)}`} />
                    <span className={`text-sm font-medium capitalize ${getCategoryColor(resource.category)}`}>
                      {resource.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    {getTypeIcon(resource.type)}
                    <span className="text-sm capitalize">{resource.type}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {resource.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Download className="h-4 w-4" />
                    <span>{resource.downloadCount} downloads</span>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(resource._id)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-1"
                  >
                    {resource.type === 'link' ? (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        <span>View</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Added {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;