'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

const MeetingPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();
  const { call, isCallLoading } = useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call) {
    return (
      <p className="text-center text-3xl font-bold text-white">
        Call Not Found
      </p>
    );
  }

  const notAllowed = call.type === 'invited' && (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

  // Check if userId exists before rendering MeetingRoom
  const userId = user.id;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            userId ? (
              <MeetingRoom userId={userId} />
            ) : (
              <p className="text-center text-3xl font-bold text-white">
                User not found, unable to join the meeting.
              </p>
            )
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingPage;
  



// 'use client';

// import { useState } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
// import { useParams } from 'next/navigation';
// import { Loader } from 'lucide-react';

// import { useGetCallById } from '@/hooks/useGetCallById';
// import Alert from '@/components/Alert';
// import MeetingSetup from '@/components/MeetingSetup';
// import MeetingRoom from '@/components/MeetingRoom';

// const MeetingPage = () => {
//   const { id } = useParams();
//   const { isLoaded, user } = useUser();
//   const { call, isCallLoading } = useGetCallById(id);
//   const [isSetupComplete, setIsSetupComplete] = useState(false);

//   if (!isLoaded || isCallLoading) return <Loader />;

//   if (!call) return (
//     <p className="text-center text-3xl font-bold text-white">
//       Call Not Found
//     </p>
//   );

//   // Ensure the user is part of the call
//   const notAllowed = call.type === 'invited' && (!user || !call.state.members.find((m) => m.user.id === user.id));

//   if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

//   // Pass userId explicitly to MeetingRoom component
//   return (
//     <main className="h-screen w-full">
//       <StreamCall call={call}>
//         <StreamTheme>
//           {!isSetupComplete ? (
//             <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
//           ) : (
//             user?.id && <MeetingRoom userId={user.id} />  // Pass userId as a prop
//           )}
//         </StreamTheme>
//       </StreamCall>
//     </main>
//   );
// };

// export default MeetingPage;
