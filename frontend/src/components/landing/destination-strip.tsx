"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const destinations = [
  {
    city: "Goa",
    tag: "Coast",
    img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Jaipur",
    tag: "Heritage",
    img: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Kashmir",
    tag: "Mountains",
    img: "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Kerala",
    tag: "Backwaters",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Udaipur",
    tag: "Lakes",
    img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Himachal",
    tag: "Alpine",
    img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Varanasi",
    tag: "Sacred",
    img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=72",
  },
  {
    city: "Ladakh",
    tag: "High Desert",
    img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=72",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function DestinationStrip() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 mb-10 flex items-end justify-between gap-6">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="kicker mb-3"
          >
            Where to next
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="display-serif text-4xl lg:text-5xl text-foreground"
          >
            India, at your own pace
          </motion.h2>
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          Plan any of these in seconds
          <ArrowUpRight className="h-4 w-4 text-[#C84B22]" />
        </motion.span>
      </div>

      {/* Cinematic infinite filmstrip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        <div className="flex gap-5 w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {[...destinations, ...destinations].map((d, i) => (
            <div
              key={i}
              className="group relative w-[260px] sm:w-[300px] shrink-0 overflow-hidden rounded-3xl border border-border bg-card"
            >
              <div className="relative h-[340px] overflow-hidden">
                <Image
                  src={d.img}
                  alt={d.city}
                  width={600}
                  height={680}
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {d.tag}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white font-serif">
                    {d.city}
                  </p>
                </div>
                <div className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                  <ArrowUpRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      </motion.div>
    </section>
  );
}
