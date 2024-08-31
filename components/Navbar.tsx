import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';

import MobileNav from './MobileNav';
import { auth } from "@clerk/nextjs/server"; 


const Navbar = () => {
  const userId = auth().userId;

  // Log user ID and name if available
  // if (userId) {
  //   // console.log('User ID:', userId);
  // }

  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/dfree.png"
          width={80}
          height={80}
          alt="DFREE MEET logo"
          className="max-sm:size-10"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          DFREE MEET
        </p>
      </Link>
      <div className="flex-between gap-5">
        <SignedIn>
          {userId}
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>

        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
