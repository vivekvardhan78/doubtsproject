import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doubtsApi, faqApi } from '../../services/api';
import { Doubt, FAQ } from '../../lib/supabase';
import { MessageSquare, CheckCircle, Clock, User, Send, Loader, Plus, Edit2, Trash2 } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('pending');
  const [activeTab, setActiveTab] = useState<'doubts' | 'faqs'>('doubts');
  const [answeringDoubt, setAnsweringDoubt] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doubtsData, faqsData] = await Promise.all([
        doubtsApi.getAll(),
        faqApi.getAll(),
      ]);
      setDoubts(doubtsData);
      setFaqs(faqsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerDoubt = async (doubtId: string) => {
    if (!profile || !answer.trim()) return;

    setSubmitting(true);
    try {
      await doubtsApi.answer(doubtId, answer, profile.id);
      setAnswer('');
      setAnsweringDoubt(null);
      await loadData();
    } catch (error) {
      console.error('Error answering doubt:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;

    try {
      await faqApi.create(newFaq);
      setNewFaq({ question: '', answer: '' });
      setShowFaqForm(false);
      await loadData();
    } catch (error) {
      console.error('Error creating FAQ:', error);
    }
  };

  const handleUpdateFaq = async () => {
    if (!editingFaq) return;

    try {
      await faqApi.update(editingFaq.id, {
        question: editingFaq.question,
        answer: editingFaq.answer,
      });
      setEditingFaq(null);
      await loadData();
    } catch (error) {
      console.error('Error updating FAQ:', error);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await faqApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  const filteredDoubts = doubts.filter((doubt) => {
    if (filter === 'all') return true;
    return doubt.status === filter;
  });

  const stats = {
    total: doubts.length,
    pending: doubts.filter((d) => d.status === 'pending').length,
    answered: doubts.filter((d) => d.status === 'answered').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Teacher Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Doubts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Answered</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.answered}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => setActiveTab('doubts')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'doubts'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Student Doubts
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'faqs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manage FAQs ({faqs.length})
          </button>
        </div>

        {activeTab === 'doubts' && (
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'answered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Answered
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'doubts' ? (
        filteredDoubts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No doubts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoubts.map((doubt) => (
              <div key={doubt.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{doubt.title}</h3>
                      <p className="text-gray-600 mb-3">{doubt.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {doubt.is_anonymous ? 'Anonymous' : doubt.student?.full_name}
                        </span>
                        <span>{new Date(doubt.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        doubt.status === 'answered'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {doubt.status === 'answered' ? 'Answered' : 'Pending'}
                    </span>
                  </div>

                  {doubt.answer && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">
                            Answered by {doubt.teacher?.full_name || 'Teacher'}
                          </p>
                          <p className="text-gray-800">{doubt.answer}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {doubt.status === 'pending' && (
                    <>
                      {answeringDoubt === doubt.id ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            placeholder="Type your answer here..."
                          />
                          <div className="flex space-x-3 mt-3">
                            <button
                              onClick={() => handleAnswerDoubt(doubt.id)}
                              disabled={submitting || !answer.trim()}
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {submitting ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Submit Answer
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setAnsweringDoubt(null);
                                setAnswer('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAnsweringDoubt(doubt.id)}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                        >
                          Answer This Doubt
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setShowFaqForm(!showFaqForm)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New FAQ
            </button>
          </div>

          {showFaqForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New FAQ</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Question"
                />
                <textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Answer"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateFaq}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Save FAQ
                  </button>
                  <button
                    onClick={() => {
                      setShowFaqForm(false);
                      setNewFaq({ question: '', answer: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl shadow-md p-6">
                {editingFaq?.id === faq.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingFaq.question}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      value={editingFaq.answer}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={handleUpdateFaq}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingFaq(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                        <p className="text-sm text-gray-500 mt-2">Asked {faq.ask_count} times</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingFaq(faq)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
