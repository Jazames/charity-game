import { useEffect } from "react";

interface IntroSequenceProps {
  onComplete: () => void;
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  useEffect(() => {
    const skip = () => onComplete();
    const timeout = window.setTimeout(onComplete, 12_000);
    window.addEventListener("keydown", skip, { once: true });

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", skip);
    };
  }, [onComplete]);

  return (
    <main className="intro-sequence" data-testid="game-intro">
      <div className="intro-vignette" />
      <section className="intro-story" data-testid="intro-story">
        <p className="intro-line intro-line-one">
          A wealthy religion has accidentally amassed an enormous hoard of wealth
          from the generous donations of its faithful followers.
        </p>
        <p className="intro-line intro-line-two">Now, scrutiny is mounting.</p>
        <p className="intro-line intro-line-three">
          You have been hired to disburse <strong>$100 billion.</strong>
        </p>
        <p className="intro-line intro-line-four">
          The church leaders would like you to improve the world in any way you
          can—while avoiding scandal.
        </p>
      </section>
      <button className="intro-skip" data-testid="intro-skip" onClick={onComplete} type="button">
        Press any key to begin
      </button>
    </main>
  );
}
