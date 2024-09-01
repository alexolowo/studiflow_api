import React from 'react';
import { FaHome } from 'react-icons/fa';
import Link from 'next/link';
import StudiFlowLogo from '@/public/file.png';
import Image from 'next/image';

const PageBanner = () => {
  return (
    <Link href="/" passHref>
      <div className="flex items-center cursor-pointer p-4">
        <Image src={StudiFlowLogo} alt="StudiFlow Logo" width={85} height={85} />
        <div className="flex items-center"></div>

        {/* Vertical Separator */}
        <div className="h-8 border-l-2 mx-4" />

        {/* Home Icon */}
        <FaHome className="text-2xl" />
      </div>
    </Link>
  );
};

export default PageBanner;
