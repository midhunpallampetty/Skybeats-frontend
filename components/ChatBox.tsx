    'use client';
    import React, { useState, useRef, useEffect } from 'react';
    import axios from 'axios';
    import Swal from 'sweetalert2';
    type Message = {
      text: string;
      sender: 'user' | 'ai';
    };

    const ChatBox = () => {
      const [text, setText] = useState('');
      const [isOpen, setIsOpen] = useState(false);
      const [messages, setMessages] = useState<Message[]>([]);
      const [inputValue, setInputValue] = useState('');
      useEffect(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, [messages]);
      const audioRef = useRef<HTMLAudioElement | null>(null);

      const toggleChat = () => {
        setIsOpen(!isOpen);

        if (!isOpen && audioRef.current) {
          audioRef.current.play();
        }
      };
      const containerRef = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, [messages]);
      
      function removeSymbols(text: string) {
        return text.replace(/[#*]/g, '');
      }
      const speakText = (text: string) => {
        if ('speechSynthesis' in window) {

          window.speechSynthesis.cancel();
          const cleanedText = removeSymbols(text);
          const utterance = new SpeechSynthesisUtterance(cleanedText);
          utterance.lang = 'en-US';
          utterance.rate = 1;
          utterance.pitch = 1;

          utterance.onstart = () => {
            console.log('Speech started');
          };

          utterance.onend = () => {
            console.log('Speech ended');
          };

          utterance.onerror = (e) => {
            console.error('Speech synthesis error: ', e);
          };


          window.speechSynthesis.speak(utterance);
        } else {
          console.error('Text-to-speech is not supported in this browser.');
        }
      };


      const handleSendMessage = async () => {                         
        if (inputValue.trim() !== '') {
          setMessages((prevMessages) => [...prevMessages, { text: inputValue, sender: 'user' }]);
          setInputValue('');
      
          try {
          
          
const response = await axios({
  url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_AI_APIKEY}`,
  method: 'post',
  data: {
    contents: [{ parts: [{ text: inputValue }] }],
  },
});
      
            let aiResponseText = response.data.candidates[0].content.parts[0].text || 'Sorry, I couldn\'t understand your request.';
            
            // Filter response to make sure it's airline-related and doesn't contain code
            if (isAirlineRelated(aiResponseText) && !containsCode(aiResponseText)) {
              const cleanaiResponseText = removeSymbols(aiResponseText);
              setMessages((prevMessages) => [...prevMessages, { text: cleanaiResponseText, sender: 'ai' }]);
              speakText(cleanaiResponseText);
            } else {
              setMessages((prevMessages) => [...prevMessages, { text: 'The response is not related to airlines or it contains invalid content.', sender: 'ai' }]);
            }
      
          } catch (error) {
            console.error('Error generating content:', error);
            setMessages((prevMessages) => [...prevMessages, { text: 'An error occurred while processing your request.', sender: 'ai' }]);
          }
        }
      };
      
      // Function to filter airline-related content
      const isAirlineRelated = (text:string):boolean => {
        const airlineKeywords = ['flight', 'airline', 'ticket', 'boarding', 'PNR', 'check-in', 'baggage', 'departure', 'arrival', 'airport', 'seat', 'pilot', 'crew', 'cabin', 'airfare', 'booking', 'destination'];
        return airlineKeywords.some((keyword) => text.toLowerCase().includes(keyword));
      };
      
      // Function to check if the response contains code snippets
      const containsCode = (text:string):boolean => {
        const codePattern = /<code>|<\/code>|```|;|{|}/g;
        return codePattern.test(text);
      };
      
      // Function to remove unwanted symbols
     
      
      const handleVoiceToText = () => {
        startVoiceRecognition((transcript: any, error: any) => {
          if (error) {
            console.error('Recognition error:', error);
          } else {
            setInputValue(transcript);
            setText(transcript);


            setTimeout(() => {
              const sendButton = document.getElementById('sendMessage');
              if (sendButton) {
                sendButton.click();
              }
            }, 100);
          }
        });
      };

      function startVoiceRecognition(callback: any) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
          Swal.fire({
            title:'Not supported',
            text:'Your browser not support speach recognisation',
            background: 'black',
            showConfirmButton: false,
          });
          console.error('Your browser does not support speech recognition.');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          Swal.fire({
            imageUrl: 'https://i.pinimg.com/originals/6b/a1/74/6ba174bf48e9b6dc8d8bd19d13c9caa9.gif',
            imageWidth: 400,
            imageHeight: 200,
            imageAlt: 'Custom image',
            background: 'black',
            showConfirmButton: false,
          });
          console.log('Voice recognition started. You can speak now...');
        };

        recognition.onresult = (event: any) => {
          Swal.close();
          const transcript = event.results[0][0].transcript;

          console.log('You said: ', transcript);
          if (callback && typeof callback === 'function') {
            callback(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Error occurred in recognition: ', event.error);
          if (callback && typeof callback === 'function') {
            callback(null, event.error);
          }
        };

        recognition.onend = () => {
          console.log('Voice recognition ended.');
        };

        recognition.start();
      }
      return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
          <button
            style={{
              border: 'none',
              color: 'white',
              padding: '10px 15px',
              fontSize: '24px',
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 9999,
            }}
            onClick={toggleChat}
          >
            <img width='80' src='https://res.cloudinary.com/dgnjzuwqu/image/upload/v1761196138/Screenshot_from_2025-10-23_10-38-02-removebg-preview_bgufqb.png' alt="Chat Icon" />
          </button>

          {isOpen && (
            <div
              ref={containerRef}
              style={{
                width: '300px',
                height: '400px',
                backgroundColor: '#1058c3',
                opacity: 0.8,
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  backgroundColor: '#1f2656',
                  color: 'white',
                  padding: '10px',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <img src='https://i.pinimg.com/474x/c6/b9/1d/c6b91d47538de8534d5302bdb6135eb0.jpg' alt="Assistant Icon" className='h-12 w-12 rounded-[100px] shadow-inner shadow-white' />
                <h4 style={{ margin: 0 }}>Chat With AI Assistant</h4>
                <div>
                  <button onClick={handleVoiceToText}><svg xmlns="http://www.w3.org/2000/svg" fill='white' width='18' viewBox="0 0 384 512"><path d="M192 0C139 0 96 43 96 96l0 160c0 53 43 96 96 96s96-43 96-96l0-160c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 89.1 66.2 162.7 152 174.4l0 33.6-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l72 0 72 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-33.6c85.8-11.7 152-85.3 152-174.4l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 70.7-57.3 128-128 128s-128-57.3-128-128l0-40z"/></svg></button>

                </div>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}
                  onClick={toggleChat}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  padding: '10px',
                  height: '300px',
                  overflowY: 'scroll',
                  flexGrow: 1,
                }}
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      margin: '5px 0',
                      padding: '8px',
                      borderRadius: '5px',
                      backgroundColor: message.sender === 'user' ? '#007bff' : '#f1f1f1',
                      color: message.sender === 'user' ? 'white' : 'black',
                      textAlign: message.sender === 'user' ? 'right' : 'left',
                    }}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  padding: '10px',
                  borderTop: '1px solid #ddd',
                }}
              >
                <div style={{ position: 'relative', flexGrow: 1 }}>
                  <input
                    type="text"
                    value={inputValue} className='text-black font-extrabold '
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage(); 
                      }
                    }}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      width: '100%',
                      border: '1px solid #ddd',
                      padding: '10px',
                      borderRadius: '5px',
                      paddingRight: '50px',
                    }}
                  />
                  <button
                    id='sendMessage'
                    onClick={handleSendMessage}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: '#007bff',
                      border: 'none',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}


          <audio ref={audioRef} src="https://airline-datacenter.s3.ap-south-1.amazonaws.com/p_29405020_439.mp3" />
        </div>
      );
    };
                                                                              
    export default ChatBox;
