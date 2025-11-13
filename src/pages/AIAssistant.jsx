import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Sparkles, Send, Trash2, Plus, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MessageBubble from "../components/ai/MessageBubble";
import { toast } from "sonner";

export default function AIAssistant() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-ai'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      return employee || userData;
    }
  });

  // Load conversations
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  const loadConversations = async () => {
    try {
      const convos = await base44.agents.listConversations({
        agent_name: "hr_assistant"
      });
      setConversations(convos || []);
      
      // Auto-select first conversation or create new one
      if (convos && convos.length > 0) {
        loadConversation(convos[0].id);
      } else {
        createNewConversation();
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const conversation = await base44.agents.getConversation(conversationId);
      setActiveConversation(conversation);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const createNewConversation = async () => {
    try {
      const newConvo = await base44.agents.createConversation({
        agent_name: "hr_assistant",
        metadata: {
          name: `Chat ${new Date().toLocaleDateString()}`,
          description: "HR Assistant Conversation"
        }
      });
      
      setConversations(prev => [newConvo, ...prev]);
      setActiveConversation(newConvo);
      setMessages([]);
      
      toast.success('New conversation started');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!confirm('Delete this conversation?')) return;
    
    try {
      // Note: Delete functionality depends on your backend implementation
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (activeConversation?.id === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          createNewConversation();
        }
      }
      
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Subscribe to conversation updates
  useEffect(() => {
    if (!activeConversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return () => {
      unsubscribe();
    };
  }, [activeConversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !activeConversation || isSending) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setIsSending(true);

    try {
      await base44.agents.addMessage(activeConversation, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setInputMessage(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Quick prompts
  const quickPrompts = language === 'ar' ? [
    "كم رصيد إجازاتي المتبقي؟",
    "ما هي سياسة الإجازات السنوية؟",
    "كيف أقدم طلب إجازة؟",
    "ما هي العطلات الرسمية القادمة؟"
  ] : [
    "What's my leave balance?",
    "Explain the annual leave policy",
    "How do I submit a leave request?",
    "What are the upcoming public holidays?"
  ];

  const handleQuickPrompt = (prompt) => {
    setInputMessage(prompt);
  };

  if (!currentUser) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-100px)]">
      <div className="h-full flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Conversation List */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <Card className="border-0 shadow-lg h-full flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span className="text-slate-900">{language === 'ar' ? 'المحادثات' : 'Conversations'}</span>
                </CardTitle>
                <Button
                  size="sm"
                  onClick={createNewConversation}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    {language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <div
                    key={convo.id}
                    onClick={() => loadConversation(convo.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all group",
                      activeConversation?.id === convo.id
                        ? "bg-emerald-50 border-2 border-emerald-200"
                        : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                    )}
                  >
                    <div className={`flex items-start justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {convo.metadata?.name || `Chat ${new Date(convo.created_at).toLocaleDateString()}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(convo.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(convo.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="border-0 shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white flex-shrink-0">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h3 className="text-lg font-bold text-slate-900">
                      {language === 'ar' ? 'مساعد الموارد البشرية' : 'HR Assistant'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI'}
                    </p>
                  </div>
                </CardTitle>
                {activeConversation && (
                  <Badge variant="outline" className="text-xs">
                    {messages.length} {language === 'ar' ? 'رسائل' : 'messages'}
                  </Badge>
                )}
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {!activeConversation ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {language === 'ar' ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟' : 'Hello! How can I help you today?'}
                  </h3>
                  <p className="text-slate-600 text-center mb-6">
                    {language === 'ar' 
                      ? 'اسألني عن السياسات، الإجازات، الطلبات، أو أي شيء متعلق بالموارد البشرية'
                      : 'Ask me about policies, leave balances, requests, or anything HR-related'}
                  </p>
                  
                  {/* Quick Prompts */}
                  <div className="grid md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="p-4 text-left rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                      >
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-sm text-slate-700">{prompt}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <MessageBubble key={idx} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* Input Area */}
            <div className="border-t p-4 bg-slate-50 flex-shrink-0">
              {activeConversation ? (
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                    disabled={isSending}
                    className={`flex-1 h-12 ${isRTL ? 'text-right' : ''}`}
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="h-12 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {language === 'ar' ? 'إرسال' : 'Send'}
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center text-sm text-slate-500">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Info Panel */}
      <Alert className="mt-6 border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>{language === 'ar' ? 'نصيحة:' : 'Tip:'}</strong>{' '}
          {language === 'ar' 
            ? 'المساعد الذكي يمكنه الوصول إلى معلوماتك الشخصية، السياسات، وأرصدة الإجازات لتقديم إجابات دقيقة.'
            : 'The AI assistant can access your personal information, company policies, and leave balances to provide accurate answers.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}