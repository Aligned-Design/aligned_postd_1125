import { useConfetti } from "./useConfetti";
import { toast } from "./use-toast";

export function usePublishCelebration() {
  const { fire } = useConfetti();

  const celebrate = (isFirstPost: boolean = false) => {
    // Fire confetti
    fire({
      particleCount: isFirstPost ? 150 : 100,
      spread: isFirstPost ? 100 : 70,
      origin: { y: 0.6 },
    });

    // Show toast notification
    if (isFirstPost) {
      toast({
        title: "✅ Your first post is live!",
        description:
          "Congratulations! Your content is now published and reaching your audience.",
        duration: 5000,
      });
    } else {
      toast({
        title: "✅ Post published successfully!",
        description: "Your content is live and ready to engage your audience.",
        duration: 4000,
      });
    }
  };

  return { celebrate };
}
