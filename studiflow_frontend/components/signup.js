import { Button } from "./ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function Signup() {
    return (
        <div className="flex flex-col space-y-4">
            <div>
                <Label>Username</Label>
                <Input type="email" placeholder="" className="w-full" />
            </div>
            <div>
                <Label>Email</Label>
                <Input type="email" placeholder="" className="w-full" />
            </div>
            <div>
                <Label>Password</Label>
                <Input type="email" placeholder="" className="w-full" />
            </div>

            <div>
                <Label>Retype Password</Label>
                <Input type="email" placeholder="" className="w-full" />
            </div>

            <Button className="rounded-full max-w-fit mx-auto">
                Sign Up
            </Button>



        </div>
    )
}