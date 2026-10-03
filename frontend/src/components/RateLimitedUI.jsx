import { Gauge } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const RateLimitedUI = () => (
  <Alert className="mb-6 border-primary/30 bg-primary/5 [&>svg]:text-primary">
    <Gauge className="size-4" />
    <AlertTitle>Slow down a little</AlertTitle>
    <AlertDescription className="text-muted-foreground">
      Too many requests in a short time. Wait a few seconds, then try again.
    </AlertDescription>
  </Alert>
);

export default RateLimitedUI;
