import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doubtsApi, faqApi } from '../../services/api';
import { Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { FAQ } from '../../lib/supabase';

export const PostDoubt: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingFaq, setCheckingFaq] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [suggestedFaq, setSuggestedFaq] = useState<FAQ | null>(null);
  const { profile } = useAuth();

  const handleTitleChange = async (value: string) => {
    setTitle(value);
    setSuggestedFaq(null);

    if (value.length > 10) {
      setCheckingFaq(true);
      try {
        const result = await faqApi.checkSimilar(value);
        if (result.matched && result.faq) {
          setSuggestedFaq(result.faq);
        }
      } catch (err) {
        console.error('FAQ check error:', err);
      } finally {
        setCheckingFaq(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    if (!profile) {
      setError('You must be logged in to post a doubt');
      setLoading(false);
      return;
    }

    try {
      await doubtsApi.create({
        title,
        description,
        is_anonymous: isAnonymous,
        student_id: profile.id,
      });

      setSuccess(true);
      setTitle('');
      setDescription('');
      setIsAnonymous(false);
      setSuggestedFaq(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to post doubt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Post Your Doubt</h2>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-3" />
            <span>Your doubt has been posted successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-3" />
            <span>{error}</span>
          </div>
        )}

        {suggestedFaq && (
          <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Similar question found in FAQ!
                </h3>
                <p className="text-blue-800 font-medium mb-2">{suggestedFaq.question}</p>
                <p className="text-blue-700 text-sm">{suggestedFaq.answer}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Question Title
            </label>
            <div className="relative">
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                placeholder="What is your question about?"
              />
              {checkingFaq && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Provide more details about your question..."
            />
          </div>

          <div className="flex items-center">
            <input
              id="anonymous"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="ml-3 text-sm text-gray-700">
              Post anonymously
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Post Doubt
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
