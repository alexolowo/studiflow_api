import { Button } from "@/app/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/app/components/ui/tabs"
import Login from "./login"
import Signup from "./signup"


export default function OnBoarding() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Join Us!</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-full">
                <DialogHeader>
                    <VisuallyHidden asChild>
                        <DialogTitle>
                            Login or Sign Up
                        </DialogTitle>
                    </VisuallyHidden>
                </DialogHeader>
                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 max-w-fit mx-auto">
                        <TabsTrigger value="login">Log In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="mt-0">
                        <Login />
                    </TabsContent>
                    <TabsContent value="signup" className="mt-0">
                        <Signup />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}