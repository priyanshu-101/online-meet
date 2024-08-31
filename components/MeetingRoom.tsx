'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, MessageSquare, X } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

interface MeetingRoomProps {
  userId: string; // Pass userId as a prop
}



const MeetingRoom = ({ userId }: MeetingRoomProps) => {
  console.log(userId);
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ text: string; time: string; user: string }[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [canEveryoneChat, setCanEveryoneChat] = useState(true);
  const { useCallCallingState } = useCallStateHooks();
  const ws = useRef<WebSocket | null>(null);

  const callingState = useCallCallingState();

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);

      const receivedData = event.data;

      if (receivedData instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          if (typeof text === 'string') {
            try {
              const parsedMessage = JSON.parse(text);
              setMessages((prevMessages) => [...prevMessages, parsedMessage]);
            } catch (e) {
              console.error('Error parsing message:', e);
            }
          }
        };
        reader.readAsText(receivedData);
      } else if (typeof receivedData === 'string') {
        try {
          const parsedMessage = JSON.parse(receivedData);
          setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleSendMessage = () => {
    if (messageInput.trim() && canEveryoneChat) {
      const messageToSend = JSON.stringify({
        text: messageInput,
        time: new Date().toLocaleTimeString(),
        user: userId, // Use the userId passed as a prop
      });
      ws.current?.send(messageToSend);
      setMessageInput('');
    }
  };

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>

      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />

        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </button>

        <button onClick={() => setShowChat((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <MessageSquare size={20} className="text-white" />
          </div>
        </button>

        {!isPersonalRoom && <EndCallButton />}
      </div>

      {showChat && (
        <div className="fixed bottom-20 right-5 w-[300px] h-[400px] bg-white text-black rounded-md shadow-lg">
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">In-call messages</h2>
              <button onClick={() => setShowChat(false)}>
                <X size={20} className="text-black" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md mb-4">
              <label className="text-sm">Let everyone send messages</label>
              <input
                type="checkbox"
                checked={canEveryoneChat}
                onChange={(e) => setCanEveryoneChat(e.target.checked)}
                className="cursor-pointer"
              />
            </div>

            <div className="h-48 overflow-y-auto mb-4 border p-2 rounded bg-gray-100">
              {messages.length ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex mb-2 ${msg.user === userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-2 rounded-md ${msg.user === userId ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
                      style={{ maxWidth: '70%', wordWrap: 'break-word' }}
                    >
                      <div className="text-xs font-bold">
                        {msg.user}
                      </div>
                      <div className="text-xs text-gray-500">{msg.time}</div>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">
                  Unless pinned, messages can only be seen by people in the call when the message is sent. All messages are deleted when the call ends.
                </p>
              )}
            </div>

            <div className="mt-auto flex">
              <input
                type="text"
                className="flex-grow p-2 border border-gray-300 rounded-l"
                placeholder="Send a message"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={!canEveryoneChat}
              />
              <button
                onClick={handleSendMessage}
                className="bg-gray-200 text-gray-500 p-2 rounded-r"
                disabled={!canEveryoneChat}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MeetingRoom;
