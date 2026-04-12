"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";

type TypewriterTitleProps = {
  text: string;
  as?: ElementType;
  className?: string;
  typingClassName?: string;
  typingActiveClassName?: string;
  charDelayMs?: number;
  startDelayMs?: number;
};

export default function TypewriterTitle({
  text,
  as,
  className,
  typingClassName,
  typingActiveClassName,
  charDelayMs = 100,
  startDelayMs = 0,
}: TypewriterTitleProps) {
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const Component = as ?? "h1";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        setValue(text);
        setIsTyping(false);
        return;
      }
    }

    let index = 0;
    let timer: number | null = null;
    const startTimer = window.setTimeout(() => {
      timer = window.setInterval(() => {
        index += 1;
        setValue(text.slice(0, index));

        if (index >= text.length) {
          if (timer) {
            window.clearInterval(timer);
          }
          setIsTyping(false);
        }
      }, charDelayMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(startTimer);
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [charDelayMs, startDelayMs, text]);

  const classes = [
    className,
    typingClassName,
    isTyping && value.length > 0 ? typingActiveClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes}>{isTyping ? value : text}</Component>;
}
