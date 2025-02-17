import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

interface UserAvatarProps {
  name: string
  email: string
  imageUrl?: string
}

export function UserAvatar({ name, email, imageUrl }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Avatar>
      <AvatarImage src={imageUrl} alt={name} />
      <AvatarFallback>
        {imageUrl ? <User className="h-4 w-4" /> : initials}
      </AvatarFallback>
    </Avatar>
  )
} 