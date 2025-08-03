import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  className?: string;
}

export default function AIChatInterface({ className = "" }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI construction estimating assistant. I can help you with takeoff calculations, material quantities, cost estimates, and answer questions about your blueprints. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('door') || input.includes('doors')) {
      return 'I can help you analyze doors in your blueprints. Based on typical construction standards, interior doors are usually 80" tall with widths of 24", 28", 30", 32", or 36". Exterior doors are typically 36" wide. Would you like me to run a door takeoff analysis on your current drawing?';
    }
    
    if (input.includes('window') || input.includes('windows')) {
      return 'For window analysis, I look at dimensions, types (single/double hung, casement, picture), and glazing specifications. Common residential window sizes range from 2\'x3\' to 4\'x6\'. Should I analyze the windows in your current blueprint?';
    }
    
    if (input.includes('cost') || input.includes('price') || input.includes('estimate')) {
      return 'I can provide cost estimates based on current material prices and labor rates. For accurate pricing, I\'ll need to know your location and project specifications. What type of cost estimate are you looking for?';
    }
    
    if (input.includes('sqft') || input.includes('square feet') || input.includes('area')) {
      return 'I can calculate areas for rooms, total building area, or specific material coverage. For flooring, I typically add 10% waste factor. For paint coverage, standard is 350-400 sq ft per gallon. What area calculation do you need?';
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return 'I can assist with: \n• Quantity takeoffs (doors, windows, flooring, walls)\n• Material cost estimates\n• Area and linear measurements\n• Construction specifications\n• Code compliance questions\n• Project planning advice\n\nJust describe what you need help with!';
    }
    
    return 'I understand you\'re asking about construction estimating. I can help with material takeoffs, cost calculations, measurements, and construction specifications. Could you provide more specific details about what you\'d like me to analyze or calculate?';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    "Calculate total square footage",
    "Count doors and windows", 
    "Estimate material costs",
    "Analyze room dimensions"
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
        </div>
        <p className="text-sm text-slate-600 mt-1">Construction estimating & takeoff help</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <Card className={`${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                <Bot className="w-4 h-4" />
              </div>
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <p className="text-sm text-slate-600">Thinking...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs text-left justify-start h-auto py-2"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about takeoffs, costs, or measurements..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}