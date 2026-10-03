import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

// Google profile photo; Radix falls back to initials if it's missing or fails to load
const UserAvatar = ({ user, className }) => (
  <Avatar className={cn("size-8", className)}>
    <AvatarImage src={user?.avatar} alt="" referrerPolicy="no-referrer" />
    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
      {getInitials(user?.displayName || user?.email)}
    </AvatarFallback>
  </Avatar>
);

export default UserAvatar;
