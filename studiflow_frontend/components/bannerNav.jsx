import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import StudiFlowLogo from '@/public/file.png';
// import { Logo } from "@/components/ui/logo" // Assume we have a Logo component

export function BannerNav() {
  return (
    <nav className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          {/* <Logo className="h-8 w-auto" /> */}
          <Image src={StudiFlowLogo} alt="StudiFlow" width={96} height={96} />
          <span className="text-3xl font-semibold text-foreground">StudiFlow</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
