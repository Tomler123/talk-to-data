import { useState } from "react";
import axios from "../api/axios";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/data/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.msg || "Upload successful!");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Dataset (CSV)</h2>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} style={{ marginTop: 10 }}>
        Upload
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}


// import { useState, useRef, useEffect } from 'react';
// import { Send, Mic, MicOff, BarChart3, PieChart, LineChart } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { mockChatHistory, type ChatMessage } from '@/lib/mockData';
// import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Cell, Pie } from 'recharts';

// const COLORS = ['hsl(262 83% 58%)', 'hsl(199 89% 48%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)'];

// const VoiceInput = ({ isListening, onToggle }: { isListening: boolean; onToggle: () => void }) => (
//   <Button
//     variant={isListening ? "destructive" : "outline"}
//     size="sm"
//     onClick={onToggle}
//     className={isListening ? "animate-pulse-glow" : ""}
//   >
//     {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
//   </Button>
// );

// const ChatVisualization = ({ visualization }: { visualization: any }) => {
//   if (!visualization) return null;

//   return (
//     <Card className="mt-4 bg-gradient-card">
//       <CardContent className="p-4">
//         <h4 className="text-sm font-medium mb-3 flex items-center">
//           {visualization.type === 'line' ? <LineChart className="h-4 w-4 mr-2" /> :
//            visualization.type === 'pie' ? <PieChart className="h-4 w-4 mr-2" /> :
//            <BarChart3 className="h-4 w-4 mr-2" />}
//           {visualization.title}
//         </h4>
        
//         <div className="h-64">
//           <ResponsiveContainer width="100%" height="100%">
//             {visualization.type === 'line' ? (
//               <RechartsLine data={visualization.data}>
//                 <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
//                 <XAxis dataKey="month" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line 
//                   type="monotone" 
//                   dataKey="sales" 
//                   stroke="hsl(262 83% 58%)" 
//                   strokeWidth={3}
//                   dot={{ fill: 'hsl(262 83% 58%)', r: 6 }}
//                 />
//               </RechartsLine>
//             ) : (
//               <RechartsPie>
//                 <Pie
//                   data={visualization.data}
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="percentage"
//                   label={({ category, percentage }) => `${category} ${percentage}%`}
//                 >
//                   {visualization.data.map((entry: any, index: number) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </RechartsPie>
//             )}
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export const ChatInterface = () => {
//   const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);
//   const [inputValue, setInputValue] = useState('');
//   const [isListening, setIsListening] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSendMessage = async () => {
//     if (!inputValue.trim()) return;

//     const userMessage: ChatMessage = {
//       id: Date.now().toString(),
//       user: 'You',
//       message: inputValue,
//       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       type: 'user'
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInputValue('');
//     setIsTyping(true);

//     // Simulate AI response
//     setTimeout(() => {
//       const aiMessage: ChatMessage = {
//         id: (Date.now() + 1).toString(),
//         user: 'AI Assistant',
//         message: `I understand you're asking about "${inputValue}". Based on the current data, here's what I found. Let me analyze this for you and provide some insights.`,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         type: 'ai',
//         ...(Math.random() > 0.5 && {
//           visualization: {
//             type: Math.random() > 0.5 ? 'line' : 'pie',
//             title: 'Data Analysis Result',
//             data: Math.random() > 0.5 ? 
//               [
//                 { month: 'Jan', sales: Math.floor(Math.random() * 50000) + 30000 },
//                 { month: 'Feb', sales: Math.floor(Math.random() * 50000) + 30000 },
//                 { month: 'Mar', sales: Math.floor(Math.random() * 50000) + 30000 },
//                 { month: 'Apr', sales: Math.floor(Math.random() * 50000) + 30000 }
//               ] :
//               [
//                 { category: 'Category A', percentage: Math.floor(Math.random() * 30) + 20 },
//                 { category: 'Category B', percentage: Math.floor(Math.random() * 30) + 20 },
//                 { category: 'Category C', percentage: Math.floor(Math.random() * 30) + 20 }
//               ]
//           }
//         })
//       };

//       setMessages(prev => [...prev, aiMessage]);
//       setIsTyping(false);
//     }, 2000);
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const toggleVoiceInput = () => {
//     setIsListening(!isListening);
//     // Here you would integrate with Web Speech API
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* Chat Header */}
//       <div className="p-4 border-b border-border bg-gradient-card">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold">Talk to Data</h2>
//             <p className="text-sm text-muted-foreground">Ask questions about your data in natural language</p>
//           </div>
//           <Badge variant="outline" className="bg-success text-success-foreground">
//             <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse-glow"></div>
//             AI Online
//           </Badge>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.map((message) => (
//           <div
//             key={message.id}
//             className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
//           >
//             <div
//               className={`max-w-[80%] rounded-lg p-3 ${
//                 message.type === 'user'
//                   ? 'bg-primary text-primary-foreground'
//                   : 'bg-card border border-border'
//               }`}
//             >
//               <div className="flex items-center gap-2 mb-1">
//                 <span className="text-xs font-medium">{message.user}</span>
//                 <span className="text-xs opacity-70">{message.timestamp}</span>
//               </div>
//               <p className="text-sm">{message.message}</p>
//               {message.visualization && <ChatVisualization visualization={message.visualization} />}
//             </div>
//           </div>
//         ))}

//         {isTyping && (
//           <div className="flex justify-start animate-fade-in">
//             <div className="bg-card border border-border rounded-lg p-3 max-w-[80%]">
//               <div className="flex items-center gap-2 mb-1">
//                 <span className="text-xs font-medium">AI Assistant</span>
//                 <span className="text-xs opacity-70">typing...</span>
//               </div>
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                 <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Area */}
//       <div className="p-4 border-t border-border bg-gradient-card">
//         <div className="flex items-center space-x-2">
//           <div className="flex-1 relative">
//             <Input
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder="Ask a question about your data..."
//               className="pr-12"
//             />
//           </div>
//           <VoiceInput isListening={isListening} onToggle={toggleVoiceInput} />
//           <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
//             <Send className="h-4 w-4" />
//           </Button>
//         </div>
        
//         {/* Suggested Questions */}
//         <div className="mt-3 flex flex-wrap gap-2">
//           {[
//             "Show me this month's sales",
//             "What are the top products?",
//             "Compare regions performance",
//             "Revenue trends analysis"
//           ].map((suggestion, index) => (
//             <Button
//               key={index}
//               variant="outline"
//               size="sm"
//               onClick={() => setInputValue(suggestion)}
//               className="text-xs"
//             >
//               {suggestion}
//             </Button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };