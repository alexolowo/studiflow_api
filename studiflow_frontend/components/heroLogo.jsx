import Link from 'next/link';
import Image from 'next/image';
import StudiFlowLogo from '@/public/studiflowLogo.png';

const HeroLogo = () => {
  return (
    <Link href="/" passHref>
      <div className="fixed top-4 left-4 z-50 cursor-pointer transition-transform hover:scale-105">
        <Image src={StudiFlowLogo} alt="StudiFlow Logo" width={85} height={85} />
      </div>
    </Link>
  );
};

export default HeroLogo;
