"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  className,
  cardClassName,
  isActive = true,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
  className?: string;
  cardClassName?: string;
  isActive?: boolean;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>(items);

  useEffect(() => {
    let activeInterval: any;
    if (isActive) {
      activeInterval = setInterval(() => {
        setCards((prevCards: Card[]) => {
          const newArray = [...prevCards]; // create a copy of the array
          newArray.unshift(newArray.pop()!); // move the last element to the front
          return newArray;
        });
      }, 5000);
    }

    return () => {
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    };
  }, [isActive]);

  return (
    <div className={cn("relative h-60 w-60 md:h-60 md:w-96", className)}>
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className={cn(
              "absolute dark:bg-black bg-white h-60 w-60 md:h-60 md:w-96 rounded-3xl p-4 shadow-xl border border-neutral-200 dark:border-white/[0.1] shadow-black/[0.1] dark:shadow-white/[0.05] flex flex-col justify-between",
              cardClassName
            )}
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
              zIndex: cards.length - index, //  decrease z-index for the cards that are behind
            }}
          >
            <div className="font-normal text-neutral-700 dark:text-neutral-200 leading-tight">
              {card.content}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-bold leading-none">
                  {card.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="text-neutral-600 font-semibold dark:text-white text-xs leading-tight">
                  {card.name}
                </p>
                <p className="text-neutral-400 font-normal dark:text-neutral-200 text-[10px] leading-tight">
                  {card.designation}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
