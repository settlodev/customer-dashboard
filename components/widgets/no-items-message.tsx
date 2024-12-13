import { Button } from "@/components/ui/button";

interface NoItemsMessageProp {
  message: string;
  onClick: () => void;
}

const NoItemsMessage = ({ message, onClick }: NoItemsMessageProp) => (
  <div className="flex flex-col mt-2 gap-2">
    <p className="text-sm text-red-500 font-bold">{message}</p>
    <Button onClick={onClick}>
      Add {message.includes("recipe") ? "Recipe" : "Stock"}
    </Button>
  </div>
);

export default NoItemsMessage;
