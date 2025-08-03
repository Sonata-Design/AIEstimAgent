import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2
} from "lucide-react";

interface AIChatWidgetProps {
  className?: string;
}

export default function AIChatWidget({ className = "" }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    // Handle message sending
    setInputValue('');
  };

  if (!isOpen) {
    return (
      <div className={`fixed top-20 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed top-20 right-6 z-50 ${className}`}>
      <Card className={`w-80 shadow-xl border-purple-200 transition-all duration-300 ${
        isMinimized ? 'h-12' : 'h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-purple-50 border-b border-purple-200 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI Assistant</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 h-72">
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                    <Bot className="w-3 h-3" />
                  </div>
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-2">
                      <p className="text-xs">
                        Hello! I'm your AI construction estimating assistant. Ask me about takeoffs, costs, or measurements.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about takeoffs..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 text-xs"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 px-2"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}