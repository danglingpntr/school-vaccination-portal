import { Button } from "@/components/ui/button";
import { HelpCircle, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-gray-900">
          {title}
        </h1>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center space-x-3">
        <span className="px-3 py-1 text-xs rounded-full bg-success-500 text-white flex items-center">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          System Online
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get help with using the vaccination portal</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
